export type AdminCoreBackendUnavailableReason =
  | 'SERVER_CONTROL_PLANE_NOT_CONFIGURED'
  | 'DURABLE_IDENTITY_REQUIRED'
  | 'HOST_REGISTRY_REQUIRED'
  | 'FRESH_AUTH_REQUIRED'
  | 'HOST_CHANNEL_REQUIRED'
  | 'CORE_COMPATIBILITY_VALIDATOR_REQUIRED';

export interface AdminCoreBackendUnavailable {
  readonly apiVersion: 'v1';
  readonly kind: 'backend_unconfigured';
  readonly authoritative: false;
  readonly reasonCode: AdminCoreBackendUnavailableReason;
  readonly messageKey: 'adminCore.backend.unconfigured';
}

export interface AdminCoreHostChannelUnavailable {
  readonly apiVersion: 'v1';
  readonly kind: 'host_channel_unavailable';
  readonly retryable: true;
  readonly messageKey: 'adminCore.host.channelUnavailable';
}

export type AdminCoreRuntimeCapabilitySnapshot =
  | { readonly kind: 'control_plane_unavailable'; readonly unavailable: AdminCoreBackendUnavailable }
  | { readonly kind: 'control_plane_ready' };

/**
 * A deployment composition port. It reports only coarse server capability and
 * must not probe the network, launch Core, read secrets, or hold host state.
 */
export interface IAdminCoreRuntimeCapabilities {
  inspect(): Promise<AdminCoreRuntimeCapabilitySnapshot>;
}
