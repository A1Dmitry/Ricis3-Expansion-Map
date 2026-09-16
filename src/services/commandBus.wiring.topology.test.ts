import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RICIS_COMMAND_EVENTS } from './commandBus';

/**
 * BUG-02 regression guard: every command/event dispatched on the bus must have
 * a live subscriber. Before the fix, 13 toolbar/menu commands dispatched
 * `ricis:*` events that nobody listened to (dead buttons).
 *
 * Pages reference events via the RICIS_COMMAND_EVENTS constants, so wiring is
 * verified by looking for the constant usage (single source of truth).
 */

const readSource = (relativePath: string): string =>
  readFileSync(resolve(process.cwd(), relativePath), 'utf8');

const SUBSCRIBER_SOURCES = [
  'src/App.tsx',
  'src/ui/Map3D.tsx',
  'src/ui/KinematicEnginePage.tsx',
  'src/ui/RicisProofConsoleModal.tsx',
  'src/ui/AutoProverModal.tsx',
  'src/ui/RicisSeedPage.tsx',
];

const EMITTER_SOURCES = [
  'src/services/commandRegistry.ts',
  ...SUBSCRIBER_SOURCES,
];

const constantRef = (event: string): string => {
  const entry = Object.entries(RICIS_COMMAND_EVENTS).find(([, value]) => value === event);
  if (!entry) throw new Error(`Unknown bus event: ${event}`);
  return `RICIS_COMMAND_EVENTS.${entry[0]}`;
};

const COMMAND_EVENT_KEYS = [
  'resetCamera',
  'openSearch',
  'toggle3DPresentation',
  'kinematicTogglePlay',
  'kinematicReset',
  'kinematicStep',
  'terminalClear',
  'terminalLeanVerify',
  'qaRunFloodFill',
  'qaExportReport',
  'seedVerify',
  'seedDownloadLedger',
  'runDiagnostics',
] as const;

const FEEDBACK_EVENT_KEYS = [
  'presentationModeChanged',
  'kinematicRunningChanged',
  'qaRunningChanged',
] as const;

describe('command bus wiring topology (no dead events)', () => {
  it('every command event has at least one page/App subscriber', () => {
    const subscriberSources = SUBSCRIBER_SOURCES.map(readSource).join('\n');

    for (const key of COMMAND_EVENT_KEYS) {
      const reference = `RICIS_COMMAND_EVENTS.${key}`;
      expect(
        subscriberSources.includes(reference),
        `command event ${reference} ("${RICIS_COMMAND_EVENTS[key]}") must be subscribed via useRicisCommand/subscribeRicisCommand somewhere`,
      ).toBe(true);
    }
  });

  it('every state-feedback event is dispatched by its page and consumed by App', () => {
    const appSource = readSource('src/App.tsx');
    const emitterSources = EMITTER_SOURCES.map(readSource).join('\n');

    for (const key of FEEDBACK_EVENT_KEYS) {
      const reference = `RICIS_COMMAND_EVENTS.${key}`;
      expect(
        appSource.includes(reference),
        `feedback event ${reference} must be subscribed in App.tsx`,
      ).toBe(true);
      expect(
        emitterSources.includes(reference),
        `feedback event ${reference} must be dispatched somewhere`,
      ).toBe(true);
    }
  });

  it('no raw ricis: CustomEvent dispatch outside the command bus (single source of truth)', () => {
    const rawDispatchPattern = /new CustomEvent\(\s*['"]ricis:/u;
    for (const sourcePath of EMITTER_SOURCES) {
      const source = readSource(sourcePath);
      expect(
        rawDispatchPattern.test(source),
        `${sourcePath} must dispatch ricis:* events only via dispatchRicisCommand`,
      ).toBe(false);
    }
  });
});
