/**
 * TPS standard-work guard (poka-yoke) for RICIS-III Expansion Map.
 *
 * The board document `docs/00-governance/tps/board.json` is the single machine-readable
 * state of the working process (kanban + andon + kaizen + muda + takt). This module is the
 * enforcement half of `docs/00-governance/TOYOTA_TPS_WORKING_SYSTEM.md`: it turns the
 * declared rules into exit codes, so a card cannot be reported as "done" by narration alone.
 *
 * Design constraints (AGENTS.md / RCVAP):
 * - No dependency on the app runtime; pure functions over a parsed board + repository root.
 * - Every rule must be falsifiable: tools/tpsStandardWork.test.ts mutates a valid board and
 *   requires the specific violation code. A guard that cannot fail is not evidence.
 * - Timestamps are cross-checked against declared cycle times: reporting a takt that
 *   contradicts its own start/stop stamps is TUKHTA, so it is a violation, not a warning.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';

/** CI assets whose absence or git-ignoration invalidates declared evidence (AGENTS.md §7). */
export const REQUIRED_WORKFLOWS = [
  '.github/workflows/pr-verify.yml',
  '.github/workflows/deploy-pages.yml',
  '.github/workflows/lean-artifact-kernel-check.yml',
] as const;

export const GITIGNORE_PATH = '.gitignore';

/** Registry of proof-layer findings whose closure must stop the board from re-pulling the work. */
export const FINDINGS_REGISTRY_PATH = 'artifacts/proofs/core-checks/kernel-findings.json';

/**
 * Vocabulary that marks a finding as closed in its own `resolution` field. Owned by the code (not
 * by the board) so a card cannot relax it. Ambiguous wordings are handled by an explicit per-card
 * waiver, never by silently loosening this list.
 */
export const CLOSED_FINDING_VOCABULARY = [
  'РЕШЁНО',
  'ЗАКРЫТО',
  'CLOSED',
  'ИСПРАВЛЕНО',
  'FIXED',
  'РЕШЕНИЕ ВЛАДЕЛЬЦА',
] as const;

export const BOARD_PATH = 'docs/00-governance/tps/board.json';
export const BOARD_MARKDOWN_PATH = 'docs/00-governance/tps/BOARD.md';
export const CATALOG_PATH = 'docs/00-governance/DOCUMENTATION_CATALOG.md';

/** Rows may legitimately describe a target structure; they must then say so explicitly. */
export const DECLARED_TARGET_MARKER = 'ЦЕЛЕВАЯ СТРУКТУРА';

export const CANONICAL_LANES = [
  'backlog',
  'ready',
  'in_progress',
  'verify',
  'waiting_owner',
  'andon',
  'done',
] as const;

export const MUDA_CLASSES = [
  'transport',
  'inventory',
  'motion',
  'waiting',
  'overproduction',
  'overprocessing',
  'defects',
] as const;

export const TERMINAL_STATES = [
  'READY',
  'IN_PROGRESS',
  'COMPLETED',
  'PARTIALLY_COMPLETED',
  'BLOCKED',
  'REJECTED',
  'HYPOTHESIS',
] as const;

const ANDON_SEVERITIES = ['low', 'medium', 'high', 'blocker'] as const;
const KAIZEN_STATES = ['PROPOSED', 'ACCEPTED', 'DONE', 'REJECTED'] as const;
const AUDITOR_PATTERN = /^(EXTERNAL\s*[—:-]?\s*\S|SELF \(same-pipeline\))/u;
const MIN_GOAL_LENGTH = 30;
const MIN_REASON_LENGTH = 40;
const CYCLE_TOLERANCE_MS = 1500;

export interface TpsViolation {
  readonly code: string;
  readonly message: string;
  readonly cardId?: string;
}

export interface TpsLane {
  readonly id: string;
  readonly name: string;
  readonly wipLimit: number | null;
  readonly meaning?: string;
}

export interface TpsCommand {
  readonly command: string;
  readonly exitCode: number;
  readonly measuredAt: string;
  readonly durationMs?: number;
  readonly note?: string;
}

export interface TpsCard {
  readonly id: string;
  readonly title: string;
  readonly lane: string;
  readonly status: (typeof TERMINAL_STATES)[number];
  readonly taskClass: string;
  readonly owner: string;
  readonly originalGoal: string;
  readonly acceptanceCriteria: readonly string[];
  readonly sourceRef: string;
  readonly startedAt?: string;
  readonly closedAt?: string;
  readonly cycleTimeMs?: number;
  readonly workPattern?: string;
  readonly verification?: {
    readonly auditor: string;
    readonly commands: readonly TpsCommand[];
  };
  /**
   * A card whose subject work was closed outside this flow (upstream commit, another session) must
   * say so and cite the source. Quality at the source travels with the card: the station that
   * produced the proof owns the substance checks, this cycle owns the merge-coherence checks.
   */
  readonly closure?: {
    readonly closedBy: string;
    readonly ciEvidence?: string;
    readonly localEvidence?: string;
    readonly thisCycleContribution?: string;
  };
  readonly challenger?: {
    readonly attackedSubstitution: string;
    readonly independentFormOfEvidence?: string;
  };
  readonly andonIds?: readonly string[];
  readonly kaizenIds?: readonly string[];
  readonly kaizenDisposition?: { readonly disposition: string; readonly reason: string };
  readonly blockedOn?: string;
  /**
   * Declared exception for `CARD_FINDING_ALREADY_CLOSED`: a card may reference a finding whose
   * registry resolution looks closed when the closure is only partial (e.g. artefact level resolved,
   * node level still owed). The reason must be concrete, and the registry id must be real.
   */
  readonly findingReferenceWaivers?: readonly { readonly findingId: string; readonly reason: string }[];
}

export interface TpsAndonEvent {
  readonly id: string;
  readonly title: string;
  readonly severity: (typeof ANDON_SEVERITIES)[number];
  readonly state: 'OPEN' | 'CLOSED';
  readonly openedAt: string;
  readonly closedAt?: string;
  readonly fact: string;
  readonly whys: readonly string[];
  readonly rootCause: string;
  readonly countermeasure: string;
  readonly reverify?: { readonly command: string; readonly exitCode: number };
  readonly yokoten?: readonly { readonly target: string; readonly checkedOutcome: string }[];
  readonly processChange?: string;
  readonly affectedCardId?: string;
}

export interface TpsKaizenItem {
  readonly id: string;
  readonly title: string;
  readonly state: (typeof KAIZEN_STATES)[number];
  readonly owner: string;
  readonly expectedBenefit: string;
  readonly verificationCommand?: string;
  readonly verificationExitCode?: number;
  readonly linkedAndonId?: string;
}

export interface TpsMudaEntry {
  readonly id: string;
  readonly klass: (typeof MUDA_CLASSES)[number];
  readonly observation: string;
  readonly eliminationPlan: string;
  readonly linkedCardId: string;
  readonly linkedAndonId?: string;
  /** Set when the waste has actually been removed; an elimination plan alone is an intention. */
  readonly resolution?: string;
}

export interface TpsTaktSample {
  readonly step: string;
  readonly command: string;
  readonly measuredMs: number;
  readonly sampleSize: number;
  readonly measuredAt: string;
  readonly note?: string;
}

export interface TpsBoard {
  readonly boardVersion: string;
  readonly system: string;
  readonly standard: string;
  readonly generatedAt: string;
  readonly lanes: readonly TpsLane[];
  readonly standardWork: {
    readonly gateCommands: Readonly<Record<string, string>>;
    readonly requiredDoneChecks: readonly string[];
    /** Lighter end-of-line set for cards whose substance was verified upstream (see card.closure). */
    readonly requiredDoneChecksForExternalClosure?: readonly string[];
  };
  readonly leveling: {
    readonly classes: readonly string[];
    readonly maxPerClass: Readonly<Record<string, number>>;
    readonly maxCycleMsByClass: Readonly<Record<string, number>>;
  };
  readonly takt: { readonly samples: readonly TpsTaktSample[] };
  readonly cards: readonly TpsCard[];
  readonly andon: readonly TpsAndonEvent[];
  readonly kaizen: readonly TpsKaizenItem[];
  readonly muda: readonly TpsMudaEntry[];
  /** Optional extra CI assets; the minimal set is owned by the standard, not by the board. */
  readonly ciAssets?: { readonly requiredWorkflows?: readonly string[] };
}

function push(list: TpsViolation[], code: string, message: string, cardId?: string): void {
  list.push(cardId === undefined ? { code, message } : { code, message, cardId });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseIso(value: string | undefined): number | null {
  if (typeof value !== 'string' || value.length === 0) return null;
  const stamp = Date.parse(value);
  return Number.isNaN(stamp) ? null : stamp;
}

function repoPath(repositoryRoot: string, relative: string): string {
  const path = relative.split('#')[0]!.trim();
  if (path.length === 0) return '';
  return isAbsolute(path) ? path : resolve(repositoryRoot, path);
}

export function loadBoard(repositoryRoot: string): { board: TpsBoard | null; error: string | null } {
  const file = join(repositoryRoot, BOARD_PATH);
  if (!existsSync(file)) {
    return { board: null, error: `board file not found: ${BOARD_PATH}` };
  }
  try {
    return { board: JSON.parse(readFileSync(file, 'utf8')) as TpsBoard, error: null };
  } catch (error) {
    return { board: null, error: `board JSON is invalid: ${(error as Error).message}` };
  }
}

function validateLanes(board: TpsBoard, out: TpsViolation[]): void {
  if (!Array.isArray(board.lanes) || board.lanes.length === 0) {
    push(out, 'LANE_MISSING', 'board.lanes must declare the flow lanes');
    return;
  }
  const seen = new Set<string>();
  for (const lane of board.lanes) {
    if (seen.has(lane.id)) push(out, 'LANE_DUPLICATE', `duplicate lane id: ${lane.id}`);
    seen.add(lane.id);
    if (lane.wipLimit !== null && (!Number.isInteger(lane.wipLimit) || lane.wipLimit < 1)) {
      push(out, 'LANE_WIP_LIMIT_INVALID', `lane ${lane.id} must have wipLimit >= 1 or null`);
    }
  }
  for (const required of ['backlog', 'ready', 'in_progress', 'verify', 'done'] as const) {
    if (!seen.has(required)) push(out, 'LANE_MISSING', `required lane absent: ${required}`);
  }
}

function validateWipAndHeijunka(board: TpsBoard, out: TpsViolation[]): void {
  const byLane = new Map<string, TpsCard[]>();
  for (const card of board.cards) {
    const bucket = byLane.get(card.lane) ?? [];
    bucket.push(card);
    byLane.set(card.lane, bucket);
  }
  for (const lane of board.lanes) {
    const cards = byLane.get(lane.id) ?? [];
    if (lane.wipLimit !== null && cards.length > lane.wipLimit) {
      push(
        out,
        'LANE_WIP_LIMIT',
        `lane ${lane.id} holds ${cards.length} cards, limit ${lane.wipLimit} (overproduction in progress)`,
        cards[0]?.id,
      );
    }
    if (lane.id === 'in_progress' && cards.length > 1) {
      push(
        out,
        'ONE_PIECE_FLOW',
        `one-piece flow violated: ${cards.length} cards in progress (${cards.map((c) => c.id).join(', ')})`,
      );
    }
  }
  const classes = new Set(board.leveling.classes);
  const ready = byLane.get('ready') ?? [];
  const perClass = new Map<string, number>();
  for (const card of ready) {
    if (!classes.has(card.taskClass)) {
      push(
        out,
        'HEIJUNKKA_CLASS_UNKNOWN',
        `card declares taskClass "${card.taskClass}" absent from leveling.classes`,
        card.id,
      );
      continue;
    }
    perClass.set(card.taskClass, (perClass.get(card.taskClass) ?? 0) + 1);
  }
  for (const [klass, count] of perClass) {
    const limit = board.leveling.maxPerClass[klass] ?? Number.POSITIVE_INFINITY;
    if (count > limit) {
      push(
        out,
        'HEIJUNKKA_PILING',
        `ready lane piles up ${count} x ${klass} (heijunka limit ${limit}) — mixed-level scheduling required instead`,
      );
    }
  }
  for (const card of board.cards) {
    if (card.lane !== 'ready' && card.lane !== 'in_progress' && card.lane !== 'verify') continue;
    if (!classes.has(card.taskClass)) {
      push(out, 'HEIJUNKKA_CLASS_UNKNOWN', `flowing card has unknown taskClass "${card.taskClass}"`, card.id);
    }
  }
}

function validateCards(board: TpsBoard, repositoryRoot: string, out: TpsViolation[]): void {
  const laneIds = new Set(board.lanes.map((lane) => lane.id));
  const cardIds = new Set<string>();
  const andonById = new Map(board.andon.map((event) => [event.id, event]));
  const kaizenIds = new Set(board.kaizen.map((item) => item.id));

  for (const card of board.cards) {
    if (cardIds.has(card.id)) push(out, 'CARD_DUPLICATE_ID', `duplicate card id: ${card.id}`);
    cardIds.add(card.id);

    if (!laneIds.has(card.lane)) {
      push(out, 'LANE_ID_UNKNOWN', `card references unknown lane "${card.lane}"`, card.id);
    }
    if ((card.originalGoal ?? '').trim().length < MIN_GOAL_LENGTH) {
      push(
        out,
        'CARD_GOAL_TOO_SHORT',
        `originalGoal shorter than ${MIN_GOAL_LENGTH} chars — an unmeasurable goal cannot be verified against a result`,
        card.id,
      );
    }
    if (!Array.isArray(card.acceptanceCriteria) || card.acceptanceCriteria.length === 0) {
      push(out, 'CARD_NO_ACCEPTANCE', 'every card needs at least one acceptance criterion', card.id);
    }
    const source = repoPath(repositoryRoot, card.sourceRef ?? '');
    if (source.length === 0 || !existsSync(source)) {
      push(out, 'CARD_SOURCE_MISSING', `sourceRef does not resolve to a file: ${card.sourceRef}`, card.id);
    }
    if (!TERMINAL_STATES.includes(card.status)) {
      push(out, 'CARD_STATUS_INVALID', `status "${card.status}" is not a terminal state of RCVAP`, card.id);
    }

    if (card.lane === 'waiting_owner' && card.status === 'COMPLETED') {
      push(out, 'LANE_STATUS_CONFLICT', 'waiting_owner cards cannot claim COMPLETED', card.id);
    }
    if (card.lane === 'waiting_owner' && !(card.blockedOn ?? '').trim()) {
      push(out, 'WAITING_OWNER_NO_DECISION', 'waiting_owner card must name the owner decision it waits for', card.id);
    }
    if (card.lane === 'in_progress' && card.status !== 'IN_PROGRESS') {
      push(out, 'LANE_STATUS_CONFLICT', 'in_progress card must hold status IN_PROGRESS', card.id);
    }

    const attacked = (card.challenger?.attackedSubstitution ?? '').trim();
    if ((card.lane === 'verify' || card.lane === 'done') && attacked.length < 10) {
      push(
        out,
        'ATTACK_NOT_RECORDED',
        'no self-certification: verify/done cards must record how the result could look successful while the goal stays unmet',
        card.id,
      );
    }

    const started = parseIso(card.startedAt);
    const closed = parseIso(card.closedAt);
    if (card.lane === 'done' && (started === null || closed === null)) {
      push(out, 'CARD_TIME_MISSING', 'done cards need startedAt and closedAt to make takt falsifiable', card.id);
    }
    if (started !== null && closed !== null && closed < started) {
      push(out, 'CARD_TIME_ORDER', 'closedAt precedes startedAt', card.id);
    }
    const cycle = board.leveling.maxCycleMsByClass[card.taskClass];
    if (started !== null && closed !== null && cycle !== undefined && closed - started > cycle) {
      push(
        out,
        'MURI_CYCLE_OVERFLOW',
        `cycle ${closed - started} ms exceeds the muri limit ${cycle} ms for class ${card.taskClass} — split the card`,
        card.id,
      );
    }

    if (card.lane === 'done') {
      validateDoneCard(board, card, andonById, kaizenIds, out);
    }
    if (started !== null && closed !== null && card.cycleTimeMs !== undefined) {
      const delta = closed - started;
      if (Math.abs(delta - card.cycleTimeMs) > CYCLE_TOLERANCE_MS) {
        push(
          out,
          'CYCLE_TIME_MISMATCH',
          `cycleTimeMs ${card.cycleTimeMs} contradicts timestamps (actual ${delta} ms)`,
          card.id,
        );
      }
    }
  }
}

function validateDoneCard(
  board: TpsBoard,
  card: TpsCard,
  andonById: Map<string, TpsAndonEvent>,
  kaizenIds: Set<string>,
  out: TpsViolation[],
): void {
  if (card.status !== 'COMPLETED') {
    push(out, 'DONE_STATUS_NOT_COMPLETED', `done card has status ${card.status}; promotion needs a factual run`, card.id);
  }
  const verification = card.verification;
  // The auditor marker is checked before the command list: an empty commands array must not
  // become a loophole that hides a self-certification claim (the ordering was a real gap).
  const auditor = ((verification?.auditor as string | undefined) ?? '').trim();
  if (!AUDITOR_PATTERN.test(auditor)) {
    push(
      out,
      'DONE_SELF_CERTIFICATION',
      'verification.auditor must start with "EXTERNAL <who>" or "SELF (same-pipeline)" (AGENTS.md No Self-Certification)',
      card.id,
    );
  }
  if (!verification || !Array.isArray(verification.commands) || verification.commands.length === 0) {
    push(out, 'DONE_NO_VERIFICATION', 'done without a recorded command run is narration, not verification', card.id);
    return;
  }
  for (const record of verification.commands) {
    if (record.exitCode !== 0) {
      push(out, 'DONE_COMMAND_FAILED', `recorded command exited ${record.exitCode}: ${record.command}`, card.id);
    }
    if (parseIso(record.measuredAt) === null) {
      push(out, 'DONE_COMMAND_UNSTAMPED', `verification command lacks a parseable measuredAt: ${record.command}`, card.id);
    }
  }
  const external = card.closure !== undefined;
  if (external && (card.closure?.closedBy ?? '').trim().length < 20) {
    push(
      out,
      'DONE_EXTERNAL_CLOSURE_UNSOURCED',
      'a card closed outside this flow must name the upstream source (commit/PR/run) — otherwise "closed elsewhere" is an untraceable claim',
      card.id,
    );
  }
  const requiredChecks = external
    ? (board.standardWork.requiredDoneChecksForExternalClosure ?? board.standardWork.requiredDoneChecks)
    : board.standardWork.requiredDoneChecks;
  for (const required of requiredChecks) {
    const matched = verification.commands.some((record) => record.command.includes(required));
    if (!matched) {
      push(out, 'DONE_MISSING_STANDARD_CHECK', `done requires the standard check "${required}"`, card.id);
    }
  }
  for (const andonId of card.andonIds ?? []) {
    const event = andonById.get(andonId);
    if (!event) {
      push(out, 'ANDON_ID_UNKNOWN', `card references andon ${andonId} which is not in the ledger`, card.id);
      continue;
    }
    if (event.state === 'OPEN') {
      push(out, 'DONE_WITH_OPEN_ANDON', `andon ${andonId} is still open while the card is marked done`, card.id);
    }
  }
  const linked = card.kaizenIds ?? [];
  if (linked.length === 0) {
    const disposition = card.kaizenDisposition;
    const reason = (disposition?.reason ?? '').trim();
    if (disposition?.disposition !== 'NONE_JUSTIFIED' || reason.length < MIN_REASON_LENGTH) {
      push(
        out,
        'KAIZEN_UNLINKED',
        'every closed card either feeds a kaizen item or records NONE_JUSTIFIED with a concrete reason',
        card.id,
      );
    }
  }
  for (const kaizenId of linked) {
    if (!kaizenIds.has(kaizenId)) {
      push(out, 'KAIZEN_ID_UNKNOWN', `card references kaizen ${kaizenId} which does not exist`, card.id);
    }
  }
}

function validateAndon(board: TpsBoard, repositoryRoot: string, out: TpsViolation[]): void {
  const ids = new Set<string>();
  for (const event of board.andon) {
    if (ids.has(event.id)) push(out, 'ANDON_DUPLICATE_ID', `duplicate andon id: ${event.id}`);
    ids.add(event.id);
    if (!ANDON_SEVERITIES.includes(event.severity)) {
      push(out, 'ANDON_SEVERITY_INVALID', `andon ${event.id} has severity "${event.severity}"`);
    }
    if (event.state === 'OPEN' && (event.severity === 'blocker' || event.severity === 'high')) {
      push(out, 'ANDON_OPEN_BLOCKER', `stop the line: andon ${event.id} (${event.severity}) is open — "${event.title}"`);
    }
    if ((event.fact ?? '').trim().length < MIN_REASON_LENGTH) {
      push(out, 'ANDON_FACT_MISSING', `andon ${event.id} needs the verbatim fact, not a paraphrase`);
    }
    if (parseIso(event.openedAt) === null) {
      push(out, 'ANDON_OPENED_AT_INVALID', `andon ${event.id} openedAt is not an ISO timestamp`);
    }
    if (event.state === 'OPEN') continue;

    if (event.whys.length < 3) {
      push(out, 'ANDON_ROOT_CAUSE_SHALLOW', `andon ${event.id} closed with ${event.whys.length} "why" steps (< 3)`);
    }
    if ((event.rootCause ?? '').trim().length < MIN_REASON_LENGTH) {
      push(out, 'ANDON_ROOT_CAUSE_MISSING', `andon ${event.id} closed without a stated root cause`);
    }
    if ((event.countermeasure ?? '').trim().length < MIN_REASON_LENGTH) {
      push(out, 'ANDON_COUNTERMEASURE_MISSING', `andon ${event.id} closed without a process countermeasure`);
    }
    if (!event.reverify || event.reverify.exitCode !== 0) {
      push(out, 'ANDON_REVERIFY_MISSING', `andon ${event.id} closed without a passing re-verification command`);
    }
    const closed = parseIso(event.closedAt);
    const opened = parseIso(event.openedAt);
    if (closed === null || (opened !== null && closed < opened)) {
      push(out, 'ANDON_TIME_ORDER', `andon ${event.id} needs closedAt not earlier than openedAt`);
    }
    if (event.severity === 'blocker' || event.severity === 'high') {
      const yokoten = event.yokoten ?? [];
      if (yokoten.length === 0) {
        push(out, 'ANDON_YOKOTEN_MISSING', `andon ${event.id} (${event.severity}) closed without yokoten — the same defect class must be swept horizontally`);
      }
      for (const entry of yokoten) {
        const target = repoPath(repositoryRoot, entry.target ?? '');
        if (target.length === 0 || !existsSync(target)) {
          push(out, 'ANDON_YOKOTEN_TARGET_MISSING', `andon ${event.id} yokoten target does not exist: ${entry.target}`);
        }
        if ((entry.checkedOutcome ?? '').trim().length < 10) {
          push(out, 'ANDON_YOKOTEN_OUTCOME_MISSING', `andon ${event.id} yokoten entry for ${entry.target} states no outcome`);
        }
      }
    }
    if (event.affectedCardId && !board.cards.some((card) => card.id === event.affectedCardId)) {
      push(out, 'ANDON_CARD_UNKNOWN', `andon ${event.id} references unknown card ${event.affectedCardId}`);
    }
  }
}

function validateKaizenAndMuda(board: TpsBoard, out: TpsViolation[]): void {
  const kaizenIds = new Set<string>();
  for (const item of board.kaizen) {
    if (kaizenIds.has(item.id)) push(out, 'KAIZEN_DUPLICATE_ID', `duplicate kaizen id: ${item.id}`);
    kaizenIds.add(item.id);
    if (!KAIZEN_STATES.includes(item.state)) {
      push(out, 'KAIZEN_STATE_INVALID', `kaizen ${item.id} state "${item.state}" is not one of ${KAIZEN_STATES.join('/')}`);
    }
    if ((item.expectedBenefit ?? '').trim().length < 10) {
      push(out, 'KAIZEN_BENEFIT_MISSING', `kaizen ${item.id} states no expected benefit`);
    }
    if (item.state === 'DONE') {
      if (!(item.verificationCommand ?? '').trim()) {
        push(out, 'KAIZEN_DONE_UNVERIFIED', `kaizen ${item.id} is DONE without a verification command — improvement without a check is intent`);
      } else if (item.verificationExitCode !== 0) {
        push(out, 'KAIZEN_DONE_UNVERIFIED', `kaizen ${item.id} is DONE but the verification command did not pass`);
      }
    }
    if (item.linkedAndonId && !board.andon.some((event) => event.id === item.linkedAndonId)) {
      push(out, 'KAIZEN_ANDON_UNKNOWN', `kaizen ${item.id} references unknown andon ${item.linkedAndonId}`);
    }
  }

  const cardIds = new Set(board.cards.map((card) => card.id));
  for (const entry of board.muda) {
    if (!MUDA_CLASSES.includes(entry.klass)) {
      push(out, 'MUDA_CLASS_INVALID', `muda ${entry.id} class "${entry.klass}" is not one of the seven`);
    }
    if ((entry.eliminationPlan ?? '').trim().length < MIN_REASON_LENGTH) {
      push(out, 'MUDA_NO_PLAN', `muda ${entry.id} is an observation without an elimination plan`);
    }
    if (!cardIds.has(entry.linkedCardId)) {
      push(out, 'MUDA_CARD_UNKNOWN', `muda ${entry.id} references unknown card ${entry.linkedCardId}`);
    }
    if (entry.resolution !== undefined && (entry.resolution ?? '').trim().length < 20) {
      push(out, 'MUDA_RESOLUTION_THIN', `muda ${entry.id} claims resolution in fewer than 20 chars — a loss is closed by a fact, not by the word "done"`);
    }
    if (entry.klass === 'defects' && !board.andon.some((event) => event.id === entry.linkedAndonId)) {
      push(out, 'MUDA_DEFECT_WITHOUT_ANDON', `muda ${entry.id} class "defects" must be pulled from an andon event`);
    }
  }
}

/** The registry document shape the guards depend on (prose lives in two different fields). */
export interface RegistryFinding {
  readonly id?: string;
  readonly severity?: string;
  readonly kind?: string;
  readonly title?: string;
  readonly resolution?: string;
  readonly status?: string;
  readonly affected?: readonly string[];
}

export interface FindingsRegistry {
  readonly registryVersion?: string;
  readonly title?: string;
  readonly classification?: Readonly<Record<string, string>>;
  readonly findings?: readonly RegistryFinding[];
  readonly artifacts?: readonly Record<string, unknown>[];
  readonly ciPolicy?: { readonly expectedFailures?: readonly { readonly artifactId?: string }[] };
  readonly pendingKernelRun?: readonly { readonly artifactId?: string; readonly status?: string; readonly job?: string }[];
}

/**
 * Single source of truth for "is this finding recorded as closed?" — shared by the pull guard and
 * by the generated findings digest, so the report can never disagree with the gate.
 *
 * The registry keeps closure wording in TWO prose fields, depending on when the finding was added:
 * `resolution` (F-01…F-08) and `status` (F-09…F-14, e.g. F-12 "ЗАКРЫТО ФАКТИЧЕСКИМ ПРОГОНОМ").
 * Reading only one of them makes the guard blind for half the repository's own data — that gap was
 * found while building the digest and is recorded as andon A-0009. A poka-yoke has to cover every
 * shape in which the fact is actually stored, not the one that was convenient to write.
 */
export function isFindingRecordedClosed(finding: RegistryFinding): boolean {
  return [finding.resolution ?? '', finding.status ?? ''].some((text) => {
    const trimmed = text.trim();
    return (
      trimmed.length > 0 && CLOSED_FINDING_VOCABULARY.some((marker) => trimmed.toUpperCase().startsWith(marker))
    );
  });
}

/**
 * Pull-side cross-check against the findings registry: a card that is being actively worked on must
 * not target a finding the registry already records as resolved. This is the overproduction guard —
 * the process caught a real duplicate here (takt 2 started an F-08 repair that upstream PR #47 had
 * already verified with a kernel run), and the rule now prevents the class instead of the instance.
 */
function validateFindingClosureAgainstRegistry(board: TpsBoard, repositoryRoot: string, out: TpsViolation[]): void {
  const registryPath = join(repositoryRoot, FINDINGS_REGISTRY_PATH);
  if (!existsSync(registryPath)) return; // absent registry is an infrastructure state, not a licence to skip

  let resolved: Set<string>;
  try {
    const parsed = JSON.parse(readFileSync(registryPath, 'utf8')) as FindingsRegistry;
    resolved = new Set<string>();
    for (const finding of parsed.findings ?? []) {
      if (isFindingRecordedClosed(finding)) resolved.add(finding.id ?? '');
    }
  } catch {
    push(out, 'FINDINGS_REGISTRY_UNPARSEABLE', `${FINDINGS_REGISTRY_PATH} is not readable JSON — the pull check is blind`);
    return;
  }

  const flowLanes = new Set(['ready', 'in_progress', 'verify', 'andon']);
  for (const card of board.cards) {
    if (!flowLanes.has(card.lane)) continue;
    const haystack = [card.title, card.originalGoal, ...(card.acceptanceCriteria ?? [])].join(' ');
    const referenced = [...haystack.matchAll(/\bF-\d{2}\b/gu)].map((match) => match[0]);
    for (const findingId of new Set(referenced)) {
      if (!resolved.has(findingId)) continue;
      const waived = (card.findingReferenceWaivers ?? []).some(
        (waiver) => waiver.findingId === findingId && (waiver.reason ?? '').trim().length >= MIN_REASON_LENGTH,
      );
      if (waived) continue;
      push(
        out,
        'CARD_FINDING_ALREADY_CLOSED',
        `card pulls ${findingId}, but ${FINDINGS_REGISTRY_PATH} already records it as resolved — this is overproduction; close the card upstream or declare findingReferenceWaivers with the remaining scope`,
        card.id,
      );
    }
  }
}

function validateTakt(board: TpsBoard, out: TpsViolation[]): void {
  const samples = board.takt?.samples ?? [];
  for (const sample of samples) {
    if (!Number.isFinite(sample.measuredMs) || sample.measuredMs <= 0) {
      push(out, 'TAKT_SAMPLE_INVALID', `takt sample "${sample.step}" has measuredMs ${sample.measuredMs}`);
    }
    if (!Number.isInteger(sample.sampleSize) || sample.sampleSize < 1) {
      push(out, 'TAKT_SAMPLE_SIZE_INVALID', `takt sample "${sample.step}" claims n=${sample.sampleSize}`);
    }
    if (parseIso(sample.measuredAt) === null) {
      push(out, 'TAKT_SAMPLE_UNSTAMPED', `takt sample "${sample.step}" has no measuredAt`);
    }
    if (!(sample.command ?? '').trim()) {
      push(out, 'TAKT_SAMPLE_COMMAND_MISSING', `takt sample "${sample.step}" names no command — time cannot be reproduced`);
    }
  }
  const hasClosedWork = board.cards.some((card) => card.lane === 'done');
  if (hasClosedWork && !samples.some((sample) => sample.step === 'test')) {
    push(out, 'TAKT_TEST_UNMEASURED', 'closed cards exist but the test gate time is unmeasured — the bottleneck must be measured, not estimated');
  }
}

/**
 * CI-asset guard. The minimum list is hardcoded in the standard (REQUIRED_WORKFLOWS) so a board
 * cannot exempt itself from the check by omitting data; the board may only tighten it.
 *
 * Why ignore-rule inspection exists: a tracked file is unaffected by .gitignore, so an ignore
 * pattern on a required workflow is invisible today and fatal later — after an accidental delete,
 * `git add -A` silently skips the restored file. The project has already lost the kernel-check
 * workflow that way (see ACTIVE_TASKS: F-07 / F-14 incident class, merge 142d744).
 */
export function validateCiAssets(repositoryRoot: string, board?: TpsBoard): TpsViolation[] {
  const out: TpsViolation[] = [];
  const required = new Set<string>(REQUIRED_WORKFLOWS);
  for (const extra of board?.ciAssets?.requiredWorkflows ?? []) required.add(extra);

  const ignoreFile = join(repositoryRoot, GITIGNORE_PATH);
  const patterns = existsSync(ignoreFile)
    ? readFileSync(ignoreFile, 'utf8')
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith('#'))
    : [];

  for (const asset of required) {
    if (!existsSync(join(repositoryRoot, asset))) {
      push(out, 'CI_WORKFLOW_MISSING', `required CI asset is absent: ${asset} — без него статусы, требующие прогона, безосновательны`);
    }
    for (const pattern of patterns) {
      const normalized = pattern.replace(/^\/+/, '').replace(/\/+$/, '');
      if (normalized.length === 0) continue;
      const expression = new RegExp(
        `^${normalized.split('*').map((part) => part.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')).join('.*')}$`,
        'u',
      );
      if (expression.test(asset)) {
        push(
          out,
          'CI_WORKFLOW_IGNORED',
          `${GITIGNORE_PATH} pattern "${pattern}" shadows required CI asset ${asset}: a restored copy after an accidental delete would be silently skipped by git add -A`,
        );
      }
    }
  }
  return out;
}

/**
 * Declared-vs-actual sweep for the documentation layer (AGENTS.md §9 applied to the docs tree).
 * Catches (a) a governance catalog pointing at a directory that does not exist, unless the row
 * explicitly marks it as a target structure, and (b) relative markdown links that resolve nowhere.
 */
export function validateDocumentationConsistency(repositoryRoot: string, out: TpsViolation[] = []): TpsViolation[] {
  const catalog = join(repositoryRoot, CATALOG_PATH);
  if (existsSync(catalog)) {
    const text = readFileSync(catalog, 'utf8');
    const rowPattern = /^\|\s*`(docs\/[^`]+)`\s*\|([^|\n]*)\|/gmu;
    let match: RegExpExecArray | null = rowPattern.exec(text);
    while (match !== null) {
      const [, directory = '', row = ''] = match;
      const normalized = directory.replace(/\/+$/u, '');
      const exists = existsSync(join(repositoryRoot, normalized));
      if (!exists && !row.includes(DECLARED_TARGET_MARKER)) {
        push(
          out,
          'CATALOG_PATH_MISSING',
          `${CATALOG_PATH} declares \`${directory}/\` as a current catalog while the path is absent; mark it "${DECLARED_TARGET_MARKER}" or create it`,
        );
      }
      match = rowPattern.exec(text);
    }
  }

  for (const file of collectMarkdown(repositoryRoot)) {
    const text = readFileSync(join(repositoryRoot, file), 'utf8');
    const linkPattern = /\[[^\]]*\]\((?!https?:|mailto:|#)([^)\s]+)\)/gu;
    let link: RegExpExecArray | null = linkPattern.exec(text);
    while (link !== null) {
      const raw = (link[1] ?? '').split('#')[0]!.trim();
      if (raw.length > 0) {
        const target = resolve(repositoryRoot, dirname(join(repositoryRoot, file)), raw);
        if (!existsSync(target)) {
          push(out, 'DOC_LINK_BROKEN', `${file} links to "${raw}", which does not exist`);
        }
      }
      link = linkPattern.exec(text);
    }
  }
  return out;
}

function collectMarkdown(repositoryRoot: string, dir = repositoryRoot, acc: string[] = []): string[] {
  const skip = new Set(['.git', 'node_modules', 'dist', 'build', 'out', 'coverage', '.next', '.turbo']);
  for (const entry of readdirSync(dir) as string[]) {
    if (skip.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      collectMarkdown(repositoryRoot, full, acc);
    } else if (entry.endsWith('.md')) {
      acc.push(full.slice(repositoryRoot.length + 1).split(/[\\/]/u).join('/'));
    }
  }
  return acc;
}

export function validateBoardAndLine(board: unknown, repositoryRoot: string): TpsViolation[] {
  const violations = validateBoard(board, repositoryRoot);
  const typedBoard = isRecord(board) ? (board as unknown as TpsBoard) : undefined;
  return [...violations, ...validateCiAssets(repositoryRoot, typedBoard)];
}

export function validateBoard(board: unknown, repositoryRoot: string): TpsViolation[] {
  const out: TpsViolation[] = [];
  if (!isRecord(board)) {
    return [{ code: 'BOARD_NOT_OBJECT', message: 'board document must be a JSON object' }];
  }
  const typed = board as unknown as TpsBoard;
  if (typeof typed.boardVersion !== 'string' || !/^\d+\.\d+\.\d+$/u.test(typed.boardVersion)) {
    push(out, 'BOARD_VERSION_INVALID', `boardVersion must be semver, received ${String(typed.boardVersion)}`);
  }
  for (const key of ['cards', 'andon', 'kaizen', 'muda'] as const) {
    if (!Array.isArray(typed[key])) push(out, 'BOARD_SECTION_MISSING', `board.${key} must be an array`);
  }
  if (out.length > 0 && !Array.isArray(typed.cards)) return out;
  const standardPath = repoPath(repositoryRoot, typed.standard ?? '');
  if (standardPath.length === 0 || !existsSync(standardPath)) {
    push(out, 'BOARD_STANDARD_MISSING', `board.standard must point at the governing standard file, received: ${typed.standard}`);
  }
  if (!typed.leveling || !Array.isArray(typed.leveling.classes)) {
    push(out, 'BOARD_LEVELING_MISSING', 'board.leveling.classes must declare heijunka classes');
  }
  if (!typed.standardWork || !Array.isArray(typed.standardWork.requiredDoneChecks)) {
    push(out, 'BOARD_STANDARDWORK_MISSING', 'board.standardWork.requiredDoneChecks must declare the end-of-line checks');
  }
  if (!Array.isArray(typed.takt?.samples)) {
    push(out, 'BOARD_TAKT_MISSING', 'board.takt.samples must exist (an empty array is an honest "not measured yet")');
  }
  validateLanes(typed, out);
  validateWipAndHeijunka(typed, out);
  validateCards(typed, repositoryRoot, out);
  validateAndon(typed, repositoryRoot, out);
  validateKaizenAndMuda(typed, out);
  validateFindingClosureAgainstRegistry(typed, repositoryRoot, out);
  validateTakt(typed, out);
  return out;
}

/** Renders the human-facing board (tps/BOARD.md). The file is generated: hand edits are drift. */
export function renderBoard(board: TpsBoard): string {
  const lines: string[] = [];
  lines.push('# TPS Kanban — RICIS-III Expansion Map');
  lines.push('');
  lines.push('> Сгенерировано из `board.json`: `npm run tps:board`. Правка вручную = дрейф, его ловит `tps:gate`.');
  lines.push('');
  lines.push(`**Стандарт:** [\`${board.standard}\`](../TOYOTA_TPS_WORKING_SYSTEM.md)  `);
  lines.push(`**Версия доски:** ${board.boardVersion} · **Снимок:** ${board.generatedAt}`);
  lines.push('');
  const openAndon = board.andon.filter((event) => event.state === 'OPEN');
  const blocking = openAndon.filter((event) => event.severity === 'blocker' || event.severity === 'high');
  lines.push('## Andon (состояние линии)');
  lines.push('');
  if (openAndon.length === 0) {
    lines.push('**ЛИНИЯ ИДЁТ** — открытых андон-событий нет.');
  } else {
    // Только blocker/high останавливают тягу (правило ANDON_OPEN_BLOCKER); рисовать
    // показывать «СТОП-ЛИНИЯ» из-за medium-события — та же подмена, что и раздувать статус:
    // витрина обязана отражать фактическую тяжесть, а не максимальную из мыслимых.
    lines.push(
      blocking.length > 0
        ? `**СТОП-ЛИНИЯ** — блокирующих событий: ${blocking.length} (${blocking.map((event) => event.id).join(', ')}); открыто всего: ${openAndon.length}`
        : `**ЛИНИЯ ИДЁТ** — блокирующих событий нет; открыто неблокирующих: ${openAndon.length} (тягу не останавливают, но видны в каждом прогоне)`,
    );
    for (const event of openAndon) {
      const effect = blocking.includes(event) ? 'блокирует тягу' : 'не блокирует линию';
      lines.push(`- \`${event.id}\` (${event.severity}, ${effect}) — ${event.title}`);
    }
  }
  lines.push('');
  for (const lane of board.lanes) {
    const cards = board.cards.filter((card) => card.lane === lane.id);
    const limit = lane.wipLimit === null ? '∞' : String(lane.wipLimit);
    lines.push(`## ${lane.name} — ${cards.length}/${limit}`);
    lines.push('');
    if (cards.length === 0) {
      lines.push('_пусто_');
      lines.push('');
      continue;
    }
    lines.push('| Карточка | Класс | Статус | Владелец | Цикл | Проверка | Anchor |');
    lines.push('|---|---|---|---|---|---|---|');
    for (const card of cards) {
      const cycle = card.cycleTimeMs === undefined ? '—' : `${Math.round(card.cycleTimeMs / 1000)} c`;
      const checks = card.verification?.commands?.length ? `${card.verification.commands.length} ком. / ${card.verification.auditor}` : '—';
      const andon = card.andonIds?.length ? ` +${card.andonIds.join(',')}` : '';
      lines.push(
        `| \`${card.id}\` ${card.title} | ${card.taskClass} | ${card.status} | ${card.owner} | ${cycle} | ${checks} | ${card.sourceRef}${andon} |`,
      );
    }
    lines.push('');
  }
  lines.push('## Kайдзен-реестр');
  lines.push('');
  lines.push('| ID | Улучшение | Состояние | Владелец | Проверка |');
  lines.push('|---|---|---|---|---|');
  for (const item of board.kaizen) {
    lines.push(
      `| \`${item.id}\` | ${item.title} | ${item.state} | ${item.owner} | ${item.verificationCommand ?? '—'} |`,
    );
  }
  lines.push('');
  lines.push('## Потери (muda)');
  lines.push('');
  lines.push('| ID | Вид | Наблюдение | План устранения | Связка |');
  lines.push('|---|---|---|---|---|');
  for (const entry of board.muda) {
    lines.push(
      `| \`${entry.id}\` | ${entry.klass} | ${entry.observation} | ${entry.eliminationPlan} | ${entry.linkedCardId}${entry.linkedAndonId ? ` / ${entry.linkedAndonId}` : ''} |`,
    );
  }
  lines.push('');
  lines.push('## Тактовое время (замеры, не оценки)');
  lines.push('');
  lines.push('| Шаг | Команда | Время | n | Когда |');
  lines.push('|---|---|---|---|---|');
  for (const sample of board.takt.samples) {
    lines.push(
      `| ${sample.step} | \`${sample.command}\` | ${(sample.measuredMs / 1000).toFixed(2)} c | ${sample.sampleSize} | ${sample.measuredAt} |`,
    );
  }
  lines.push('');
  lines.push('## Андон-журнал (полный)');
  lines.push('');
  for (const event of board.andon) {
    lines.push(`### \`${event.id}\` · ${event.severity} · ${event.state} — ${event.title}`);
    lines.push('');
    lines.push(`- **Факт:** ${event.fact}`);
    event.whys.forEach((why, index) => lines.push(`- **Почему ${index + 1}:** ${why}`));
    lines.push(`- **Корень:** ${event.rootCause}`);
    lines.push(`- **Контрмера:** ${event.countermeasure}`);
    if (event.reverify) lines.push(`- **Перепроверка:** \`${event.reverify.command}\` → exit ${event.reverify.exitCode}`);
    for (const entry of event.yokoten ?? []) lines.push(`- **Ёкотэн:** \`${entry.target}\` — ${entry.checkedOutcome}`);
    if (event.processChange) lines.push(`- **Изменение стандарта:** ${event.processChange}`);
    lines.push('');
  }
  lines.push('---');
  lines.push('');
  lines.push(`Lane semantics: ${board.lanes.map((lane) => `\`${lane.id}\`${lane.wipLimit === null ? '' : ` (WIP ${lane.wipLimit})`}`).join(', ')}.`);
  lines.push('');
  lines.push('**AUDITOR: SELF (same-pipeline)** — доска отражает состояние потока и не является независимой верификацией научных статусов.');
  lines.push('');
  return lines.join('\n');
}
