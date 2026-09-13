import { describe, it, expect, vi } from 'vitest';
import { CommandRegistry, APP_COMMANDS } from './commandRegistry';
import type { CommandContext } from '../types/commandTypes';

describe('CommandRegistry', () => {
  const dummyContext = (applet: any): CommandContext => ({
    activeApplet: applet,
    is3DMode: true,
    isSimulationRunning: false,
    onSelectApplet: vi.fn(),
    onToggle3DMode: vi.fn(),
    onResetCamera: vi.fn(),
    onToggleSimulation: vi.fn(),
    onResetSimulation: vi.fn(),
    onStepSimulation: vi.fn(),
    onSearchNodes: vi.fn(),
    onRunProver: vi.fn(),
    onClearTerminal: vi.fn(),
    onRunDiagnostics: vi.fn(),
  });

  it('contains all registered commands with required metadata', () => {
    const all = CommandRegistry.getAll();
    expect(all.length).toBeGreaterThan(10);

    for (const cmd of all) {
      expect(cmd.id).toBeDefined();
      expect(cmd.label).toBeTruthy();
      expect(cmd.tooltip).toBeTruthy();
      expect(cmd.iconName).toBeTruthy();
      expect(typeof cmd.isEnabled).toBe('function');
      expect(typeof cmd.execute).toBe('function');
    }
  });

  it('finds commands by ID', () => {
    const navMap = CommandRegistry.getById('nav.map');
    expect(navMap).toBeDefined();
    expect(navMap?.label).toBe('3D Граф Сингулярностей');
  });

  it('filters commands by applet scope', () => {
    const mapCommands = CommandRegistry.getForApplet('map');
    expect(mapCommands.some(c => c.id === 'view.toggle3D')).toBe(true);

    const kinematicCommands = CommandRegistry.getForApplet('kinematic');
    expect(kinematicCommands.some(c => c.id === 'kinematic.toggleSimulation')).toBe(true);
  });

  it('evaluates dynamic enable/disable state based on applet context', () => {
    const toggle3D = CommandRegistry.getById('view.toggle3D')!;
    const simPlay = CommandRegistry.getById('kinematic.toggleSimulation')!;

    const mapCtx = dummyContext('map');
    const kinCtx = dummyContext('kinematic');

    // 3D toggle is enabled in map, disabled in kinematic
    expect(toggle3D.isEnabled(mapCtx)).toBe(true);
    expect(toggle3D.isEnabled(kinCtx)).toBe(false);

    // Simulation toggle is enabled in kinematic, disabled in map
    expect(simPlay.isEnabled(kinCtx)).toBe(true);
    expect(simPlay.isEnabled(mapCtx)).toBe(false);
  });

  it('executes command action callback correctly', () => {
    const mapCtx = dummyContext('map');
    const resetCam = CommandRegistry.getById('view.resetCamera')!;

    resetCam.execute(mapCtx);
    expect(mapCtx.onResetCamera).toHaveBeenCalledTimes(1);
  });
});
