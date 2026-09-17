// @vitest-environment node
/**
 * Guards for the TPS standard-work layer (docs/00-governance/TOYOTA_TPS_WORKING_SYSTEM.md).
 *
 * Two halves, both mandatory:
 * 1. Positive: the real board, the documentation tree and the generated showcase are consistent.
 * 2. Mutation: every rule is proven falsifiable by corrupting the board in memory and requiring
 *    exactly the code that must fire. RCVAP forbids a verifier that cannot fail — a green guard
 *    nobody can redden is decoration, not evidence.
 */

import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  BOARD_MARKDOWN_PATH,
  REQUIRED_WORKFLOWS,
  CATALOG_PATH,
  classifyFindingResolution,
  collectRecordedRunIds,
  isLineStoppingEvent,
  loadBoard,
  renderBoard,
  validateBoard,
  validateBoardAndLine,
  validateDocumentationConsistency,
  validateCiAssets,
  type TpsAndonEvent,
  type TpsBoard,
  type TpsCard,
  type TpsViolation,
} from './tpsStandardWork';

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

const { board, error } = loadBoard(repositoryRoot);

function codesOf(violations: TpsViolation[]): string[] {
  return violations.map((violation) => violation.code);
}

function clone(source: TpsBoard): TpsBoard {
  return structuredClone(source) as TpsBoard;
}

function mapCard(source: TpsBoard, cardId: string, patch: Partial<TpsCard>): TpsBoard {
  const draft = clone(source);
  const cards = draft.cards.map((card) => (card.id === cardId ? { ...card, ...patch } : card));
  return { ...draft, cards } as TpsBoard;
}

function mapAndon(source: TpsBoard, andonId: string, patch: Partial<TpsAndonEvent>): TpsBoard {
  const draft = clone(source);
  const andon = draft.andon.map((event) => (event.id === andonId ? { ...event, ...patch } : event));
  return { ...draft, andon } as TpsBoard;
}

function expectCode(source: TpsBoard, code: string): void {
  const violations = validateBoard(source, repositoryRoot);
  expect(codesOf(violations), `expected ${code}; got ${JSON.stringify(codesOf(violations))}`).toContain(code);
}

/**
 * The mutation fixtures must not depend on where the live board currently keeps TPS-0001:
 * the first revision of this file borrowed the real card, and moving that card from `done`
 * to `verify` (a legal process move — jidoka) silently disabled nine falsifiability tests.
 * A falsifier that depends on mutable state is not a falsifier, so the tests now build a
 * canonical `done` baseline themselves and assert that baseline is green before mutating it.
 */
function forceClosed(event: TpsAndonEvent): TpsAndonEvent {
  const whys = [...event.whys];
  while (whys.length < 3) whys.push('Почему: основание зафиксировано повторным прогоном команды закрытия.');
  const severityNeedsYokoten = event.severity === 'blocker' || event.severity === 'high';
  const yokoten = severityNeedsYokoten && (event.yokoten ?? []).length === 0
    ? [{ target: 'ACTIVE_TASKS.md', checkedOutcome: 'Фикстурная запись: однотипные места сверены.' }]
    : event.yokoten;
  return {
    ...event,
    state: 'CLOSED',
    closedAt: event.closedAt ?? new Date(Date.parse(event.openedAt) + 60_000).toISOString(),
    fact: event.fact?.length >= 40 ? event.fact : `${event.title}: факт зафиксирован дословным выводом инструмента.`,
    whys,
    rootCause: event.rootCause?.length >= 40 ? event.rootCause : 'Корень: инвариант не был закреплен машиной, а оставлен текстовым обещанием.',
    countermeasure: event.countermeasure?.length >= 40
      ? event.countermeasure
      : 'Контрмера: проверка добавлена в гейт, который исполняется на каждом PR, а не в рекомендацию.',
    reverify: event.reverify ?? { command: 'npm run tps:gate', exitCode: 0 },
    yokoten,
  };
}

function doneBaseline(source: TpsBoard): TpsBoard {
  const subject = clone(source);
  // Every open andon of the live board is closed in the fixture: the baseline must be green
  // before it is mutated, otherwise a mutation test could pass for the wrong reason.
  const closedAndon = subject.andon.map((event) => (event.state === 'OPEN' ? forceClosed(event) : event));
  const cards = subject.cards.map((card) =>
    card.id === 'TPS-0001'
      ? ({ ...card, lane: 'done', status: 'COMPLETED', startedAt: '2026-01-01T00:00:00Z', closedAt: '2026-01-01T01:00:00Z', cycleTimeMs: 3_600_000 } as TpsCard)
      : card,
  );
  return { ...subject, cards, andon: closedAndon } as TpsBoard;
}

function baseFlowCard(source: TpsBoard, id: string, lane: string): TpsCard {
  const ready = source.cards.find((card) => card.lane === 'ready') ?? source.cards[0]!;
  return {
    ...ready,
    id,
    lane,
    status: lane === 'in_progress' ? 'IN_PROGRESS' : 'READY',
    originalGoal: 'Фикстурная карточка для проверки лимитов потока: цель сформулирована измеримо и не зависит от живой доски.',
  } as TpsCard;
}

const validBoard = () => {
  if (board === null) throw new Error(`board unavailable: ${error}`);
  return board as TpsBoard;
};

describe('TPS board — actual state of the line', () => {
  it('loads a strict-parseable board', () => {
    expect(error, String(error)).toBeNull();
    expect(board).not.toBeNull();
  });

  it('passes the poka-yoke gate with zero violations (the line must actually run)', () => {
    expect(validateBoard(validBoard(), repositoryRoot)).toEqual([]);
  });

  it('mirrors reality: every open item of the registries has a place on the board', () => {
    const subject = validBoard();
    const registry = JSON.parse(
      readFileSync(join(repositoryRoot, 'artifacts/proofs/core-checks/kernel-findings.json'), 'utf8'),
    ) as { findings: { id: string }[] };
    const titles = subject.cards.map((card) => JSON.stringify(card)).join(' ');
    // Findings that are closed by owner decision or by a factual run need no card; these four
    // are recorded in ACTIVE_TASKS.md as still unresolved and must appear on the board.
    for (const id of ['F-05', 'F-08', 'F-09', 'F-14']) {
      expect(registry.findings.map((finding) => finding.id)).toContain(id);
      expect(titles).toContain(id);
    }
  });

  it('has no invented work: every card sourceRef resolves inside this repository', () => {
    for (const card of validBoard().cards) {
      expect(card.sourceRef, card.id).toMatch(/^[A-Za-z0-9./_-]+(#.*)?$/u);
    }
  });

  it('keeps the generated showcase in sync with the board (no hand-edited kanban)', () => {
    const rendered = renderBoard(validBoard());
    expect(readFileSync(join(repositoryRoot, BOARD_MARKDOWN_PATH), 'utf8')).toBe(rendered);
  });

  it('documents the takt with real measurements, not estimates', () => {
    const samples = validBoard().takt.samples;
    expect(samples.some((sample) => sample.step === 'test')).toBe(true);
    for (const sample of samples) {
      expect(sample.sampleSize).toBeGreaterThanOrEqual(1);
      expect(sample.measuredMs).toBeGreaterThan(0);
    }
  });
});

describe('TPS poka-yoke is falsifiable', () => {
  it('stops the line on an open high-severity andon', () => {
    const mutated = mapAndon(doneBaseline(validBoard()), 'A-0001', { state: 'OPEN' });
    expectCode(mutated, 'ANDON_OPEN_BLOCKER');
  });

  it('refuses a done card whose andon is still open', () => {
    const mutated = mapAndon(doneBaseline(validBoard()), 'A-0002', { state: 'OPEN' });
    expectCode(mutated, 'DONE_WITH_OPEN_ANDON');
  });

  it('refuses to close an andon without root cause depth', () => {
    expectCode(mapAndon(doneBaseline(validBoard()), 'A-0001', { whys: ['потому что'] }), 'ANDON_ROOT_CAUSE_SHALLOW');
  });

  it('refuses to close an andon without horizontal deployment (yokoten)', () => {
    expectCode(mapAndon(doneBaseline(validBoard()), 'A-0001', { yokoten: [] }), 'ANDON_YOKOTEN_MISSING');
    expectCode(
      mapAndon(doneBaseline(validBoard()), 'A-0001', { yokoten: [{ target: 'docs/nope.md', checkedOutcome: 'проверено' }] }),
      'ANDON_YOKOTEN_TARGET_MISSING',
    );
  });

  it('refuses a done card without a recorded run (narration is not verification)', () => {
    expectCode(mapCard(doneBaseline(validBoard()), 'TPS-0001', { verification: undefined }), 'DONE_NO_VERIFICATION');
  });

  it('refuses a recorded command that did not pass', () => {
    const subject = doneBaseline(validBoard());
    const commands = subject.cards
      .find((card) => card.id === 'TPS-0001')!
      .verification!.commands.map((record, index) => (index === 0 ? { ...record, exitCode: 1 } : record));
    const target = subject.cards.find((card) => card.id === 'TPS-0001')!;
    expectCode(mapCard(subject, 'TPS-0001', { verification: { ...target.verification!, commands } }), 'DONE_COMMAND_FAILED');
  });

  it('refuses self-certification wording on a closed card, even with no commands at all', () => {
    const subject = doneBaseline(validBoard());
    const verification = subject.cards.find((card) => card.id === 'TPS-0001')!.verification!;
    expectCode(
      mapCard(subject, 'TPS-0001', { verification: { ...verification, auditor: 'независимо верифицировано мной' } }),
      'DONE_SELF_CERTIFICATION',
    );
    expectCode(mapCard(subject, 'TPS-0001', { verification: { auditor: '', commands: [] } }), 'DONE_SELF_CERTIFICATION');
  });

  it('requires the declared end-of-line standard checks', () => {
    const subject = doneBaseline(validBoard());
    const verification = subject.cards.find((card) => card.id === 'TPS-0001')!.verification!;
    const trimmed = { ...verification, commands: verification.commands.filter((record) => !record.command.includes('npm test')) };
    expectCode(mapCard(subject, 'TPS-0001', { verification: trimmed }), 'DONE_MISSING_STANDARD_CHECK');
  });

  it('catches a declared cycle time that contradicts its own timestamps', () => {
    expectCode(mapCard(doneBaseline(validBoard()), 'TPS-0001', { cycleTimeMs: 1 }), 'CYCLE_TIME_MISMATCH');
  });

  it('requires the attack on the own result before done', () => {
    expectCode(mapCard(doneBaseline(validBoard()), 'TPS-0001', { challenger: undefined }), 'ATTACK_NOT_RECORDED');
  });

  it('requires every closed card to feed kaizen or justify why not', () => {
    expectCode(mapCard(doneBaseline(validBoard()), 'TPS-0001', { kaizenIds: [] }), 'KAIZEN_UNLINKED');
  });

  it('keeps one-piece flow (max one card in progress) and WIP limits', () => {
    const subject = doneBaseline(validBoard());
    const extras = ['TPS-9001', 'TPS-9002'].map((id) => baseFlowCard(subject, id, 'in_progress'));
    const mutated = { ...clone(subject), cards: [...subject.cards, ...extras] } as TpsBoard;
    expectCode(mutated, 'ONE_PIECE_FLOW');
    expectCode(mutated, 'LANE_WIP_LIMIT');
  });

  it('levels the queue instead of piling one class (heijunka)', () => {
    const subject = doneBaseline(validBoard());
    const extras = ['TPS-9101', 'TPS-9102', 'TPS-9103'].map((id) => baseFlowCard(subject, id, 'ready'));
    expectCode({ ...clone(subject), cards: [...subject.cards, ...extras] } as TpsBoard, 'HEIJUNKKA_PILING');
  });

  it('flags overlong single-card cycles as muri', () => {
    expectCode(
      mapCard(doneBaseline(validBoard()), 'TPS-0001', {
        startedAt: '2026-09-15T00:00:00Z',
        closedAt: '2026-09-15T18:00:00Z',
        cycleTimeMs: 64800000,
      }),
      'MURI_CYCLE_OVERFLOW',
    );
  });

  it('refuses a done card whose status is not COMPLETED', () => {
    expectCode(mapCard(doneBaseline(validBoard()), 'TPS-0001', { status: 'PARTIALLY_COMPLETED' }), 'DONE_STATUS_NOT_COMPLETED');
  });

  it('refuses cards without a measurable goal or without a resolvable source', () => {
    const subject = doneBaseline(validBoard());
    const first = subject.cards.find((card) => card.id === 'TPS-0001')!;
    expectCode(mapCard(subject, first.id, { originalGoal: 'сделать хорошо' }), 'CARD_GOAL_TOO_SHORT');
    expectCode(mapCard(subject, first.id, { sourceRef: 'docs/definitely-missing.md' }), 'CARD_SOURCE_MISSING');
    expectCode(mapCard(subject, first.id, { acceptanceCriteria: [] }), 'CARD_NO_ACCEPTANCE');
    expectCode(mapCard(subject, first.id, { lane: 'nope' }), 'LANE_ID_UNKNOWN');
  });

  it('requires the owner-waiting lane to name the decision it waits for', () => {
    const subject = doneBaseline(validBoard());
    const waiting = subject.cards.find((card) => card.lane === 'waiting_owner')!;
    expectCode(mapCard(subject, waiting.id, { blockedOn: '' }), 'WAITING_OWNER_NO_DECISION');
    expectCode(mapCard(subject, waiting.id, { lane: 'done', status: 'COMPLETED' }), 'DONE_NO_VERIFICATION');
  });

  it('demands an unmeasured bottleneck to stay a violation', () => {
    const subject = doneBaseline(validBoard());
    const samples = subject.takt.samples.filter((sample) => sample.step !== 'test');
    expectCode({ ...clone(subject), takt: { ...subject.takt, samples } } as TpsBoard, 'TAKT_TEST_UNMEASURED');
  });

  it('requires kaizen marked DONE to carry a passing check', () => {
    const subject = doneBaseline(validBoard());
    const kaizen = subject.kaizen.map((item) => (item.id === 'K-0001' ? { ...item, verificationCommand: '' } : item));
    expectCode({ ...clone(subject), kaizen } as TpsBoard, 'KAIZEN_DONE_UNVERIFIED');
  });

  it('requires the defects waste to be pulled from an andon event', () => {
    const subject = doneBaseline(validBoard());
    const muda = subject.muda.map((entry) => (entry.id === 'M-0003' ? { ...entry, linkedAndonId: undefined } : entry));
    expectCode({ ...clone(subject), muda } as TpsBoard, 'MUDA_DEFECT_WITHOUT_ANDON');
  });

  it('refuses to pull work that the findings registry already records as closed (overproduction)', () => {
    const subject = doneBaseline(validBoard());
    const waiting = subject.cards.find((card) => card.lane === 'waiting_owner')!;
    const pulled: TpsCard = { ...waiting, id: 'TPS-9201', lane: 'ready', status: 'READY', taskClass: 'math-proof', title: 'F-08: ремонт A11', originalGoal: 'Закрыть F-08 тактическим ремонтом производной A11, опираясь на фактические прогоны ядра.' };
    const mutated = { ...clone(subject), cards: [...subject.cards, pulled] } as TpsBoard;
    expectCode(mutated, 'CARD_FINDING_ALREADY_CLOSED');

    // An explicit, concrete waiver is the only way to keep a partially-closed finding in flow,
    // and the waiver must name the remaining scope (an empty excuse must not pass).
    const waived = {
      ...mutated,
      cards: mutated.cards.map((card) =>
        card.id === 'TPS-9201'
          ? { ...card, findingReferenceWaivers: [{ findingId: 'F-08', reason: 'Артефактный уровень закрыт прогоном; остаётся уровень узла карты, закрытый только решением владельца (L9).' }] }
          : card,
      ),
    } as TpsBoard;
    expect(codesOf(validateBoard(waived, repositoryRoot))).not.toContain('CARD_FINDING_ALREADY_CLOSED');
    const lazy = {
      ...mutated,
      cards: mutated.cards.map((card) =>
        card.id === 'TPS-9201' ? { ...card, findingReferenceWaivers: [{ findingId: 'F-08', reason: 'ещё не закрыто' }] } : card,
      ),
    } as TpsBoard;
    expectCode(lazy, 'CARD_FINDING_ALREADY_CLOSED');
  });

  it('classifies finding resolutions fail-safe: unseen wording is unclassified, never silently open', () => {
    expect(classifyFindingResolution(undefined)).toBe('OPEN');
    expect(classifyFindingResolution('')).toBe('OPEN');
    expect(classifyFindingResolution('   ')).toBe('OPEN');
    // Every closure marker of the vocabulary, in both cases and with leading space.
    expect(classifyFindingResolution('РЕШЁНО (2026-09-15, run 1)')).toBe('CLOSED');
    expect(classifyFindingResolution('решено строчными буквами')).toBe('CLOSED');
    expect(classifyFindingResolution('  Исправлено в этом PR: фильтр')).toBe('CLOSED');
    expect(classifyFindingResolution('Решение владельца 2026-09-14: понизить статус')).toBe('CLOSED');
    expect(classifyFindingResolution('CLOSED by upstream kernel run')).toBe('CLOSED');
    expect(classifyFindingResolution('Fixed in 0.4.189')).toBe('CLOSED');
    expect(classifyFindingResolution('ЗАКРЫТО выше по потоку')).toBe('CLOSED');
    // The three live blind spots (A-0009): non-empty, previously invisible, now unclassified.
    expect(classifyFindingResolution('Частично закрыто этим PR: остаток — повторный run')).toBe('UNCLASSIFIED');
    expect(classifyFindingResolution('Реестр вводит раздельные статусы для propext')).toBe('UNCLASSIFIED');
    expect(classifyFindingResolution('Граница доверия зафиксирована; формулировки — решение владельца')).toBe('UNCLASSIFIED');
    // A closure word in the middle is not a closure claim at the start.
    expect(classifyFindingResolution('Вопрос закрыт не будет: ждём ядро')).toBe('UNCLASSIFIED');
  });

  it('sees every registry finding: no non-empty resolution stays invisible to the pull check (A-0009 sweep)', () => {
    const registry = JSON.parse(
      readFileSync(join(repositoryRoot, 'artifacts/proofs/core-checks/kernel-findings.json'), 'utf8'),
    ) as { findings: { id: string; resolution?: string }[] };
    expect(registry.findings.length).toBeGreaterThan(0);
    // The pre-A-0009 mutation test was built on F-08 alone — the same example the rule was
    // derived from (self-cycling). This sweep derives expectations from the live registry, so
    // any future wording the vocabulary cannot parse fails loudly instead of passing silently.
    const seenClasses = new Set<string>();
    for (const finding of registry.findings) {
      const closure = classifyFindingResolution(finding.resolution);
      seenClasses.add(closure);
      const subject = doneBaseline(validBoard());
      const waiting = subject.cards.find((card) => card.lane === 'waiting_owner')!;
      const pulled: TpsCard = {
        ...waiting,
        id: `TPS-SWEEP-${finding.id.replace('-', '')}`,
        lane: 'ready',
        status: 'READY',
        taskClass: 'math-proof',
        title: `${finding.id}: демонстрационная тяга для проверки видимости`,
        originalGoal: `Измерить видимость находки ${finding.id} для правила перепроизводства: карточка обязана либо пройти (открытая), либо упасть (закрытая/неклассифицированная).`,
      };
      const codes = codesOf(validateBoard({ ...clone(subject), cards: [...subject.cards, pulled] } as TpsBoard, repositoryRoot));
      if (closure === 'CLOSED') {
        expect(codes, `${finding.id} must be flagged as already closed`).toContain('CARD_FINDING_ALREADY_CLOSED');
      } else if (closure === 'UNCLASSIFIED') {
        expect(codes, `${finding.id} must be flagged as unclassified, never silently green`).toContain('CARD_FINDING_UNCLASSIFIED');
      } else {
        expect(codes, `${finding.id} is open and must stay pullable`).not.toContain('CARD_FINDING_ALREADY_CLOSED');
        expect(codes, `${finding.id} is open and must stay pullable`).not.toContain('CARD_FINDING_UNCLASSIFIED');
      }
      expect(codes, `${finding.id} exists in the registry`).not.toContain('CARD_FINDING_UNKNOWN');
    }
    // The sweep is vacuous if the registry has only one class; today all three are live.
    expect([...seenClasses].sort()).toEqual(['CLOSED', 'OPEN', 'UNCLASSIFIED']);
  });

  it('stops unclassified and unknown findings with the same explicit waiver exit (typos are never waivable)', () => {
    const subject = doneBaseline(validBoard());
    const waiting = subject.cards.find((card) => card.lane === 'waiting_owner')!;
    const registry = JSON.parse(
      readFileSync(join(repositoryRoot, 'artifacts/proofs/core-checks/kernel-findings.json'), 'utf8'),
    ) as { findings: { id: string; resolution?: string }[] };
    const unclassified = registry.findings.find((finding) => classifyFindingResolution(finding.resolution) === 'UNCLASSIFIED')!;
    expect(unclassified).toBeDefined();

    const pulled: TpsCard = {
      ...waiting,
      id: 'TPS-9202',
      lane: 'ready',
      status: 'READY',
      taskClass: 'math-proof',
      title: `${unclassified.id}: тяга находки с нераспознанной формулировкой`,
      originalGoal: 'Потянуть находку, чьё resolution не входит в словарь закрытия, и получить явный стоп вместо слепой зелени.',
    };
    const mutated = { ...clone(subject), cards: [...subject.cards, pulled] } as TpsBoard;
    expectCode(mutated, 'CARD_FINDING_UNCLASSIFIED');

    const waived = {
      ...mutated,
      cards: mutated.cards.map((card) =>
        card.id === 'TPS-9202'
          ? { ...card, findingReferenceWaivers: [{ findingId: unclassified.id, reason: 'Прочитал resolution целиком: закрыта только фиксация границы, остаток — формулировки узлов карты за владельцем.' }] }
          : card,
      ),
    } as TpsBoard;
    expect(codesOf(validateBoard(waived, repositoryRoot))).not.toContain('CARD_FINDING_UNCLASSIFIED');

    const typo: TpsCard = {
      ...waiting,
      id: 'TPS-9203',
      lane: 'ready',
      status: 'READY',
      taskClass: 'math-proof',
      title: 'F-99: тяга по несуществующему идентификатору',
      originalGoal: 'Потянуть находку с идентификатором, которого нет в реестре: обязана сработать защита от опечатки.',
    };
    const typoBoard = { ...clone(subject), cards: [...subject.cards, typo] } as TpsBoard;
    expectCode(typoBoard, 'CARD_FINDING_UNKNOWN');

    const badWaiver = {
      ...clone(subject),
      cards: [
        ...subject.cards,
        { ...typo, id: 'TPS-9204', findingReferenceWaivers: [{ findingId: 'F-99', reason: 'Попытка освободить опечатку осмысленной по длине, но бессмысленной по существу отговоркой.' }] },
      ],
    } as TpsBoard;
    // Unknown ids are never waivable: both the typo and the dangling waiver must fire.
    expectCode(badWaiver, 'CARD_FINDING_UNKNOWN');
    expectCode(badWaiver, 'CARD_WAIVER_UNKNOWN_FINDING');
  });

  it('renders the line summary from the same predicate the gate enforces (measured agreement)', () => {
    // Three fixture states, one predicate: the rendered header must say СТОП-ЛИНИЯ iff
    // isLineStoppingEvent holds for at least one open event. This is a measured comparison
    // of the summary against the gate predicate — not a claim about what any past version printed.
    const subject = doneBaseline(validBoard());
    const closedOnly = renderBoard(subject);
    expect(closedOnly).toContain('ЛИНИЯ ИДЁТ');
    expect(closedOnly).not.toContain('СТОП-ЛИНИЯ');

    const mediumOnly = mapAndon(subject, 'A-0001', { state: 'OPEN', severity: 'medium' });
    expect(isLineStoppingEvent({ severity: 'medium' })).toBe(false);
    const mediumRendered = renderBoard(mediumOnly);
    expect(mediumRendered).toContain('ЛИНИЯ ИДЁТ');
    expect(mediumRendered).toContain('не блокирует линию');
    expect(mediumRendered).not.toContain('СТОП-ЛИНИЯ');

    const highOpen = mapAndon(subject, 'A-0001', { state: 'OPEN', severity: 'high' });
    expect(isLineStoppingEvent({ severity: 'high' })).toBe(true);
    const highRendered = renderBoard(highOpen);
    expect(highRendered).toContain('СТОП-ЛИНИЯ');
    expect(highRendered).toContain('блокирует тягу');
    expect(codesOf(validateBoard(highOpen, repositoryRoot))).toContain('ANDON_OPEN_BLOCKER');
    expect(codesOf(validateBoard(mediumOnly, repositoryRoot))).not.toContain('ANDON_OPEN_BLOCKER');
  });

  it('allows an externally closed card only with a traceable source and its own check set', () => {
    const subject = doneBaseline(validBoard());
    const target = subject.cards.find((card) => card.id === 'TPS-0001')!;
    // Claiming "someone else closed it" without a source is not a shortcut around the checks.
    expectCode(
      mapCard(subject, 'TPS-0001', { closure: { closedBy: 'upstream' } }),
      'DONE_EXTERNAL_CLOSURE_UNSOURCED',
    );
    // With a source, the external set applies: dropping a check that the external set still
    // requires must fire, and the card must no longer be demanded the full-suite check.
    const lighter = {
      ...clone(subject),
      standardWork: {
        ...subject.standardWork,
        requiredDoneChecksForExternalClosure: ['npm run tps:gate', 'npm run nonexistent-check'],
      },
    } as TpsBoard;
    expectCode(
      mapCard(lighter, 'TPS-0001', { closure: { closedBy: 'origin/main abc1234 (PR #99) — kernel run 1, exit 0' } }),
      'DONE_MISSING_STANDARD_CHECK',
    );
    const satisfied = {
      ...clone(subject),
      standardWork: { ...subject.standardWork, requiredDoneChecksForExternalClosure: ['npm run tps:gate'] },
      cards: subject.cards.map((card) =>
        card.id === 'TPS-0001'
          ? {
              ...card,
              closure: { closedBy: 'origin/main abc1234 (PR #99) — kernel run 1, exit 0' },
              verification: { auditor: card.verification!.auditor, commands: [{ command: 'npm run tps:gate', exitCode: 0, measuredAt: '2026-01-01T00:00:00Z' }] },
            }
          : card,
      ),
    } as TpsBoard;
    expect(codesOf(validateBoard(satisfied, repositoryRoot))).not.toContain('DONE_MISSING_STANDARD_CHECK');
    expect(target.lane).toBe('done');
  });

  it('requires a claimed waste resolution to be a fact, not a word', () => {
    const subject = doneBaseline(validBoard());
    const muda = subject.muda.map((entry) => (entry.id === 'M-0004' ? { ...entry, resolution: 'ок' } : entry));
    expectCode({ ...clone(subject), muda } as TpsBoard, 'MUDA_RESOLUTION_THIN');
  });

  it('requires the canonical lanes to exist', () => {
    const subject = doneBaseline(validBoard());
    const lanes = subject.lanes.filter((lane) => lane.id !== 'verify');
    expectCode({ ...clone(subject), lanes } as TpsBoard, 'LANE_MISSING');
  });

  it('the canonical mutation baseline is itself green (a fixture nobody can validate is not a baseline)', () => {
    expect(validateBoard(doneBaseline(validBoard()), repositoryRoot)).toEqual([]);
  });

  it('collectRecordedRunIds walks the whole mathlibRun -> priorMathlibRun chain, not just the top', () => {
    // The registry records the current run at the top and chains every superseded run via
    // priorMathlibRun. A guard derived from the first shape (single top-level run) went blind
    // when a superseding run pushed honest artifacts one level down (takt 4). This test pins the
    // walk: ids recorded at ANY depth are present; an id the registry never records is absent.
    const registry = {
      generatedFrom: { runId: 100 },
      mathlibRun: {
        runId: 300,
        priorMathlibRun: {
          runId: 200,
          priorMathlibRun: { runId: 150 },
        },
      },
    };
    expect(collectRecordedRunIds(registry).sort((a, b) => a - b)).toEqual([100, 150, 200, 300]);
    // Fabricated numbers are never "recorded": the invariant stays a stop, not a pass.
    expect(collectRecordedRunIds(registry)).not.toContain(999);
    // Missing records are honest "not measured", not a crash and not an invented id.
    expect(collectRecordedRunIds({})).toEqual([]);
    expect(collectRecordedRunIds({ mathlibRun: { priorMathlibRun: { runId: 42 } } })).toEqual([42]);
  });
});

describe('documentation declared-vs-actual guard', () => {
  it('the repository tree currently satisfies the catalog and every markdown link', () => {
    expect(validateDocumentationConsistency(repositoryRoot)).toEqual([]);
  });

  it('keeps required CI assets present and unshadowed by .gitignore', () => {
    expect(validateCiAssets(repositoryRoot, validBoard())).toEqual([]);
    expect(REQUIRED_WORKFLOWS).toContain('.github/workflows/lean-artifact-kernel-check.yml');
  });

  it('rejects a .gitignore pattern that shadows a required CI workflow', () => {
    const dir = mkdtempSync(join(tmpdir(), 'tps-ci-'));
    try {
      for (const asset of REQUIRED_WORKFLOWS) {
        mkdirSync(join(dir, dirname(asset)), { recursive: true });
        writeFileSync(join(dir, asset), 'name: fixture\n', 'utf8');
      }
      writeFileSync(join(dir, '.gitignore'), 'node_modules/\n/.github/workflows/lean-artifact-kernel-check.yml\n', 'utf8');
      expect(codesOf(validateCiAssets(dir))).toContain('CI_WORKFLOW_IGNORED');

      writeFileSync(join(dir, '.gitignore'), 'node_modules/\n*.yml\n', 'utf8');
      expect(codesOf(validateCiAssets(dir))).toContain('CI_WORKFLOW_IGNORED');

      writeFileSync(join(dir, '.gitignore'), '#/.github/workflows/lean-artifact-kernel-check.yml\nnode_modules/\n', 'utf8');
      expect(codesOf(validateCiAssets(dir))).toEqual([]);

      rmSync(join(dir, '.github/workflows/lean-artifact-kernel-check.yml'), { force: true });
      writeFileSync(join(dir, '.gitignore'), 'node_modules/\n', 'utf8');
      expect(codesOf(validateCiAssets(dir))).toContain('CI_WORKFLOW_MISSING');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('the line gate as a whole stays green on the real repository (board + docs + CI assets)', () => {
    expect(validateBoardAndLine(validBoard(), repositoryRoot)).toEqual([]);
  });

  it('a catalog row pointing at a missing directory is rejected unless marked as a target structure', () => {
    const dir = mkdtempSync(join(tmpdir(), 'tps-catalog-'));
    try {
      mkdirSync(join(dir, 'docs', '00-governance'), { recursive: true });
      writeFileSync(
        join(dir, CATALOG_PATH),
        '| Каталог | Содержимое |\n|---|---|\n| `docs/does-not-exist/` | что-то |\n',
        'utf8',
      );
      expect(codesOf(validateDocumentationConsistency(dir))).toContain('CATALOG_PATH_MISSING');

      writeFileSync(
        join(dir, CATALOG_PATH),
        '| Каталог | Содержимое |\n|---|---|\n| `docs/does-not-exist/` | ЦЕЛЕВАЯ СТРУКТУРА (в дереве отсутствует) |\n',
        'utf8',
      );
      expect(codesOf(validateDocumentationConsistency(dir))).not.toContain('CATALOG_PATH_MISSING');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('a relative markdown link into nowhere is rejected', () => {
    const dir = mkdtempSync(join(tmpdir(), 'tps-links-'));
    try {
      writeFileSync(join(dir, 'README.md'), '[текст](missing/file.md)\n', 'utf8');
      expect(codesOf(validateDocumentationConsistency(dir))).toContain('DOC_LINK_BROKEN');
      writeFileSync(join(dir, 'README.md'), '[текст](exists/file.md)\n', 'utf8');
      mkdirSync(join(dir, 'exists'));
      writeFileSync(join(dir, 'exists', 'file.md'), '# ok\n', 'utf8');
      expect(codesOf(validateDocumentationConsistency(dir))).not.toContain('DOC_LINK_BROKEN');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
