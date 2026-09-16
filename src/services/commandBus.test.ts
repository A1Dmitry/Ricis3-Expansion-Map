import { describe, expect, it, vi } from 'vitest';
import {
  RICIS_COMMAND_EVENTS,
  dispatchRicisCommand,
  subscribeRicisCommand,
  type RicisCommandEventName,
} from './commandBus';
import { APP_COMMANDS, CommandRegistry } from './commandRegistry';
import type { AppletId } from '../types/appletRegistry';
import type { CommandContext } from '../types/commandTypes';

describe('commandBus', () => {
  it('delivers a dispatched command to subscribers with its detail payload', () => {
    const handler = vi.fn();
    const unsubscribe = subscribeRicisCommand(RICIS_COMMAND_EVENTS.kinematicRunningChanged, handler);

    dispatchRicisCommand(RICIS_COMMAND_EVENTS.kinematicRunningChanged, { isRunning: true });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ isRunning: true });

    unsubscribe();
  });

  it('stops delivering after unsubscribe', () => {
    const handler = vi.fn();
    const unsubscribe = subscribeRicisCommand(RICIS_COMMAND_EVENTS.resetCamera, handler);
    unsubscribe();

    dispatchRicisCommand(RICIS_COMMAND_EVENTS.resetCamera);

    expect(handler).not.toHaveBeenCalled();
  });

  it('does not leak events to unrelated subscribers', () => {
    const cameraHandler = vi.fn();
    subscribeRicisCommand(RICIS_COMMAND_EVENTS.resetCamera, cameraHandler);

    dispatchRicisCommand(RICIS_COMMAND_EVENTS.openSearch);

    expect(cameraHandler).not.toHaveBeenCalled();
  });
});

describe('command registry -> command bus contract (BUG-02 regression)', () => {
  const COMMANDS_WITHOUT_BUS_EVENT = new Set<string>([
    // Navigation commands act directly through onSelectApplet (no bus event by design).
    ...APP_COMMANDS.filter(cmd => cmd.id.startsWith('nav.')).map(cmd => cmd.id),
    // Share copies the URL directly; no applet-page subscriber required.
    'global.share',
  ]);

  const ALL_EVENT_NAMES: RicisCommandEventName[] = Object.values(RICIS_COMMAND_EVENTS);

  const contextFor = (applet: AppletId): CommandContext => ({
    activeApplet: applet,
    is3DMode: true,
    isSimulationRunning: false,
    isAutoProverRunning: false,
    onSelectApplet: () => undefined,
  });

  it('executing any action command dispatches exactly one bus event (no dead, no double dispatch)', () => {
    for (const command of APP_COMMANDS) {
      if (COMMANDS_WITHOUT_BUS_EVENT.has(command.id)) continue;

      const fired: string[] = [];
      const unsubscribers = ALL_EVENT_NAMES.map(event =>
        subscribeRicisCommand(event, () => {
          fired.push(event);
        }),
      );

      const scope = command.appletScope === 'all' ? 'map' : command.appletScope[0] ?? 'map';
      try {
        command.execute(contextFor(scope));
      } finally {
        unsubscribers.forEach(unsubscribe => unsubscribe());
      }

      expect(fired, `command "${command.id}" must fire exactly one bus event`).toHaveLength(1);
    }
  });

  it('every dispatched command id is reachable through CommandRegistry.getById', () => {
    for (const command of APP_COMMANDS) {
      expect(CommandRegistry.getById(command.id)).toBeDefined();
    }
  });
});
