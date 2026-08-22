import type express from 'express';
import type {
  AdminCoreBackendUnavailable,
  AdminCoreBackendUnavailableReason,
  AdminCoreRuntimeCapabilitySnapshot,
  IAdminCoreRuntimeCapabilities,
} from './adminCoreRuntimeCapabilities';

const DEFAULT_UNAVAILABLE_REASON: AdminCoreBackendUnavailableReason = 'SERVER_CONTROL_PLANE_NOT_CONFIGURED';

function unavailableStatus(reasonCode: AdminCoreBackendUnavailableReason = DEFAULT_UNAVAILABLE_REASON): AdminCoreBackendUnavailable {
  return {
    apiVersion: 'v1',
    kind: 'backend_unconfigured',
    authoritative: false,
    reasonCode,
    messageKey: 'adminCore.backend.unconfigured',
  };
}

/**
 * Pure default deployment capability: no environment, network, process, secret
 * or persistent state is required to construct the optional HTTP namespace.
 */
export class UnconfiguredAdminCoreRuntimeCapabilities implements IAdminCoreRuntimeCapabilities {
  public async inspect(): Promise<AdminCoreRuntimeCapabilitySnapshot> {
    return { kind: 'control_plane_unavailable', unavailable: unavailableStatus() };
  }
}

async function safeUnavailableStatus(
  capabilities: IAdminCoreRuntimeCapabilities,
): Promise<AdminCoreBackendUnavailable> {
  try {
    const snapshot = await capabilities.inspect();
    return snapshot.kind === 'control_plane_unavailable'
      ? snapshot.unavailable
      : unavailableStatus();
  } catch {
    // Optional capability inspection must never block server startup or leak error detail.
    return unavailableStatus();
  }
}

/**
 * Registers the future Admin Core namespace without claiming a control plane is
 * active. Every route intentionally fails closed until a separate server
 * composition injects a real authorised application registrar.
 */
export function registerAdminCoreUnavailableRoutes(
  app: express.Express,
  capabilities: IAdminCoreRuntimeCapabilities = new UnconfiguredAdminCoreRuntimeCapabilities(),
): void {
  const respondUnavailable = async (_request: express.Request, response: express.Response): Promise<void> => {
    response.status(503).json(await safeUnavailableStatus(capabilities));
  };

  app.get('/api/admin-core/v1/status', respondUnavailable);
  app.use('/api/admin-core/v1', respondUnavailable);
}
