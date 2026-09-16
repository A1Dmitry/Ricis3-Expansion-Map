// ============================================================================
// SETTINGS APPLET PAGE (full workspace surface for ?applet=settings)
// BUG-03: previously App.tsx rendered SettingsModal as a stub (roles={[]},
// no-op callbacks, no panel/physics wiring). This page provides the same
// real wiring Map3D uses: adaptive roles, panel visibility, physics params
// and the admin core snapshot — all persisted in the same storage keys.
// ============================================================================

import React, { useState } from 'react';
import { SettingsModal } from './SettingsModal';
import { useAdaptiveUI } from '../hooks/useAdaptiveUI';
import { useDisabledPanelIds } from '../hooks/useDisabledPanelIds';
import {
  SETTINGS_ADAPTIVE_UI_CONFIG,
  SETTINGS_PANEL_ELEMENTS,
} from '../domain/ui/settingsElements';
import { physicsStorageService } from '../services/physicsStorage';
import { DEFAULT_PHYSICS_PARAMS, type PhysicsParams } from '../model/physics';
import { STATIC_ADMIN_CORE_SNAPSHOT } from '../adminCoreConnection/staticAdminCoreConnection';

interface SettingsAppletPageProps {
  readonly onBackToMap: () => void;
}

export function SettingsAppletPage({ onBackToMap }: SettingsAppletPageProps): React.JSX.Element {
  const { currentRole, roles, switchRole, createRole } = useAdaptiveUI(SETTINGS_ADAPTIVE_UI_CONFIG);
  const { userDisabledPanelIds, togglePanelVisibility } = useDisabledPanelIds();
  const [physicsParams, setPhysicsParams] = useState<PhysicsParams>(
    () => physicsStorageService.load() || DEFAULT_PHYSICS_PARAMS,
  );

  return (
    <div className="w-full h-full overflow-y-auto p-4 bg-[#070b14]">
      <div className="mx-auto mb-4 flex max-w-6xl items-center justify-between">
        <button
          type="button"
          onClick={onBackToMap}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 font-mono text-xs text-cyan-300 transition-colors hover:bg-slate-700"
        >
          ← Вернуться к 3D Карте
        </button>
      </div>
      <SettingsModal
        isOpen
        onClose={onBackToMap}
        currentRoleId={currentRole.id}
        roles={roles}
        onSelectRole={switchRole}
        onCreateRole={createRole}
        uiElements={SETTINGS_PANEL_ELEMENTS}
        hiddenElementIds={userDisabledPanelIds}
        onToggleElement={togglePanelVisibility}
        physicsParams={physicsParams}
        onPhysicsChange={setPhysicsParams}
        adminCoreSnapshot={STATIC_ADMIN_CORE_SNAPSHOT}
      />
    </div>
  );
}
