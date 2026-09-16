// ============================================================================
// SETTINGS APPLET (BUG-03)
// Full-featured Settings surface reachable from the command bar
// (?applet=settings / Alt+9). Previously App rendered a stub SettingsModal
// with empty roles and no physics/panel sections. Now it composes exactly
// what Map3D does: shared adaptive-UI state, shared panel-visibility state,
// persisted physics parameters and the admin core snapshot.
// ============================================================================

import React, { useState } from 'react';
import { SettingsModal } from './SettingsModal';
import { useAdaptiveUI } from '../hooks/useAdaptiveUI';
import { useUserDisabledPanels } from '../hooks/useUserDisabledPanels';
import { UI_ELEMENTS } from '../domain/ui/uiElements';
import { physicsStorageService } from '../services/physicsStorage';
import { DEFAULT_PHYSICS_PARAMS, type PhysicsParams } from '../model/physics';
import { STATIC_ADMIN_CORE_SNAPSHOT } from '../adminCoreConnection/staticAdminCoreConnection';

interface SettingsAppletProps {
  readonly onClose: () => void;
}

export const SettingsApplet: React.FC<SettingsAppletProps> = ({ onClose }) => {
  const {
    currentRole,
    roles,
    switchRole,
    createRole,
  } = useAdaptiveUI({
    elements: UI_ELEMENTS,
    maxVisible: 3,
    decayInterval: 10,
    decayFactor: 0.9,
    hysteresisDelta: 0.03,
  });

  const [physicsParams, setPhysicsParams] = useState<PhysicsParams>(() => {
    return physicsStorageService.load() || DEFAULT_PHYSICS_PARAMS;
  });

  const [userDisabledPanelIds, togglePanelVisibility] = useUserDisabledPanels();

  return (
    <SettingsModal
      isOpen
      onClose={onClose}
      currentRoleId={currentRole.id}
      roles={roles}
      onSelectRole={switchRole}
      onCreateRole={createRole}
      uiElements={UI_ELEMENTS}
      hiddenElementIds={userDisabledPanelIds}
      onToggleElement={togglePanelVisibility}
      physicsParams={physicsParams}
      onPhysicsChange={setPhysicsParams}
      adminCoreSnapshot={STATIC_ADMIN_CORE_SNAPSHOT}
    />
  );
};
