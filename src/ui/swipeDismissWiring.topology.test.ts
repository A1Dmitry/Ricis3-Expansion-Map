import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), 'utf8');

const mapSource = source('src/ui/Map3D.tsx');
const kinematicSource = source('src/ui/KinematicEnginePage.tsx');
const terminalSource = source('src/ui/RicisTerminalModal.tsx');
const editNodeSource = source('src/ui/EditNodeModal.tsx');
const wrapperSource = source('src/ui/components/SwipeDismissable.tsx');

describe('mobile swipe-to-close wiring across applet panels', () => {
  it('shares a single gesture implementation instead of per-panel ad-hoc listeners', () => {
    expect(wrapperSource).toContain("import { useSwipeToClose } from '../../hooks/useSwipeToClose';");
    expect(mapSource).toContain("import { SwipeDismissable } from './components/SwipeDismissable';");
    expect(mapSource).toContain("import { useSwipeToClose } from '../hooks/useSwipeToClose';");
    expect(mapSource).not.toMatch(/addEventListener\('touchstart'/u);
    expect(kinematicSource).not.toMatch(/addEventListener\('touchstart'/u);
    expect(terminalSource).not.toMatch(/addEventListener\('touchstart'/u);
  });

  it('gives the mobile shell screens a right-swipe back gesture', () => {
    expect(mapSource).toContain('const mobileBackSwipeHandlers = useSwipeToClose({');
    expect(mapSource).toContain("direction: 'right',");
    expect(mapSource).toContain('data-testid="mobile-menu-screen" {...mobileBackSwipeHandlers}');
    expect(mapSource).toContain('data-testid="mobile-details-screen" {...mobileBackSwipeHandlers}');
  });

  it('makes every additional Map3D overlay panel swipe-dismissable on mobile only', () => {
    expect(mapSource).toContain('<SwipeDismissable direction="right" onDismiss={closeSettings} enabled={isMobileLayout}>');
    expect(mapSource).toContain('<SwipeDismissable direction="down" onDismiss={() => setShowTelegramBot(false)} enabled={isMobileLayout}>');
    expect(mapSource).toContain('<SwipeDismissable direction="down" onDismiss={() => setShowAddNode(false)} enabled={isMobileLayout}>');
    expect(mapSource).toContain('<SwipeDismissable direction="down" onDismiss={() => setEditingNode(null)} enabled={isMobileLayout}>');
    expect(mapSource).toContain('<SwipeDismissable direction="down" onDismiss={() => setShowAgentLogs(false)} enabled={isMobileLayout}>');
    expect(mapSource).toContain('<SwipeDismissable direction="down" onDismiss={() => setShowProofConsole(false)} enabled={isMobileLayout}>');
    expect(mapSource).toContain('<SwipeDismissable direction="down" onDismiss={() => setShowVoynichModal(false)} enabled={isMobileLayout}>');
    expect(mapSource).toContain('<SwipeDismissable direction="down" onDismiss={() => setShowPatchImportModal(false)} enabled={isMobileLayout}>');
    expect(mapSource).toContain('<SwipeDismissable direction="down" onDismiss={() => setShowAutomatedTestingModal(false)} enabled={isMobileLayout}>');
    expect(mapSource).toContain('<SwipeDismissable direction="down" onDismiss={() => setShowAutoProverModal(false)} enabled={isMobileLayout}>');
    expect(mapSource).toContain('<SwipeDismissable direction="down" onDismiss={handleCloseCommunityReadiness} enabled={isMobileLayout}>');
    expect((mapSource.match(/<SwipeDismissable/gu) ?? []).length).toBeGreaterThanOrEqual(11);
    expect((mapSource.match(/enabled=\{isMobileLayout\}/gu) ?? []).length).toBeGreaterThanOrEqual(11);
  });

  it('wires the sandbox terminal overlay and its nested add-node modal', () => {
    expect(terminalSource).toContain("import { useSwipeToClose } from '../hooks/useSwipeToClose';");
    expect(terminalSource).toContain('const terminalSwipeHandlers = useSwipeToClose({');
    expect(terminalSource).toContain("direction: 'down',");
    expect(terminalSource).toContain('onDismiss: () => toggleTerminal(false)');
    expect(terminalSource).toContain('{...terminalSwipeHandlers}');
    expect(terminalSource).toContain('<SwipeDismissable direction="down" onDismiss={() => setShowAddModal(false)} enabled={isMobileLayout}>');
  });

  it('keeps the nested Lean passport dialog owner of its own dismiss gesture', () => {
    expect(editNodeSource).toContain("import { SwipeDismissable } from './components/SwipeDismissable';");
    expect(editNodeSource).toContain('<SwipeDismissable direction="down" onDismiss={() => setPassportSession(null)} enabled={isMobileLayout}>');
    expect(editNodeSource).toContain('<LeanPassportSessionDialog');
  });

  it('wires the kinematic applet QA overlay panel', () => {
    expect(kinematicSource).toContain("import { SwipeDismissable } from './components/SwipeDismissable';");
    expect(kinematicSource).toContain("import { useMobileLayout } from '../hooks/useMobileLayout';");
    expect(kinematicSource).toContain('const isMobileLayout = useMobileLayout();');
    expect(kinematicSource).toContain('<SwipeDismissable direction="down" onDismiss={() => setShowTestingModal(false)} enabled={isMobileLayout}>');
  });
});
