export type SolutionMonolithId = string;

export type UIControlKind =
  | 'BUTTON'
  | 'INPUT'
  | 'SLIDER'
  | 'TOGGLE'
  | 'MODAL_TRIGGER'
  | 'CANVAS_3D'
  | 'EDITOR';

export type UIControlLayer = 'FRONTEND_STORE' | 'BACKEND_REST' | 'WASM_CORE' | 'LOCAL_STATE';

export type UIExecutionStatus = 'IDLE' | 'PENDING' | 'SUCCESS' | 'WARNING' | 'FAILED';

/** DTO элемента управления UI для сквозной проверки связности */
export interface IUIControlDescriptorDTO {
  readonly id: string;
  readonly name: string;
  readonly componentFile: string;
  readonly kind: UIControlKind;
  readonly targetLayer: UIControlLayer;
  readonly boundStoreAction?: string;
  readonly boundEndpoint?: string;
  readonly isActive: boolean;
  readonly boundMonolithId?: SolutionMonolithId;
}

/** Запись журнала сквозной проверки элемента управления */
export interface IUIControlVerificationLogDTO {
  readonly controlId: string;
  readonly timestamp: number;
  readonly status: UIExecutionStatus;
  readonly latencyMs: number;
  readonly payloadSummary?: string;
  readonly errorMessage?: string;
  readonly structuralInvariantPreserved: boolean;
}

/** Результат полного аудита подключенности элементов UI */
export interface IUIAuditReportDTO {
  readonly totalControlsCount: number;
  readonly activeControlsCount: number;
  readonly verifiedControlsCount: number;
  readonly failedControlsCount: number;
  readonly verificationLogs: ReadonlyArray<IUIControlVerificationLogDTO>;
  readonly overallStatus: 'ALL_WIRED_AND_OPERATIONAL' | 'DEGRADED' | 'DISCONNECTED';
}

/** Контракт сервиса сквозного аудита элементов управления UI */
export interface IUIControlRegistryService {
  getAllDescriptors(): ReadonlyArray<IUIControlDescriptorDTO>;
  verifyControlWiring(controlId: string): Promise<boolean>;
  runFullUIAudit(): Promise<IUIAuditReportDTO>;
}
