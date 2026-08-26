export type VoynichStackId =
  | 'PRIMARY_STACK'
  | 'ALTERNATIVE_STACK'
  | 'STABILIZE_STACK'
  | 'PORT_STACK'
  | 'IMPULSE_STACK'
  | 'LEAK_STACK'
  | 'ROT_STACK'
  | 'EMIT_DIRECT'
  | 'MODULATOR_STACK'
  | 'PARAMETER_STACK';

export interface IVoynichStackConfigDTO {
  stack: VoynichStackId;
  function: string;
}

export interface IVoynichUnaryChargeRuleDTO {
  rule: string;
  examples: Record<string, string>;
}

export interface IVoynichVisualChecksumRuleDTO {
  rule: string;
  roots: string;
  stems: string;
  leaves: string;
  flowers: string;
}

export interface IVoynichDecryptionRulesDTO {
  tokenWeighting: {
    formula: string;
    description: string;
  };
  stackRoutingPrefixes: Record<string, IVoynichStackConfigDTO>;
  unaryChargeAccumulation: IVoynichUnaryChargeRuleDTO;
  visualChecksums: IVoynichVisualChecksumRuleDTO;
}

export interface IVoynichMacroDTO {
  name: string;
  pattern: string;
  physics: string;
  invariant: string;
}

export interface IVoynichDecodedFolioDTO {
  folio: string;
  subsystem: string;
  function: string;
  visual_checksum: string;
  ricis_invariant: string;
  chargeDepth?: string;
  status: 'Verified' | 'Pending' | 'Draft';
}

export interface IVoynichEconomicProfileDTO {
  costUnresolved: number;
  costToSolve: number;
  marketGain: number;
  riskLoss: number;
}

export interface IVoynichModernAnalogueDTO {
  name: string;
  category: string;
  mechanism: string;
  doiOrUrl?: string;
}

export type VoynichEdgeType =
  | 'hierarchy_containment'  // Vertically contains (L0->L1, L1->L2, L2->L3, L3->L4)
  | 'recirculation_pandid'   // Direct fluid/acoustic feedback circuit (e.g., f6v -> f1r)
  | 'token_flow'             // Forth control token routing flow (e.g. 'daiin', 'qokedy')
  | 'macro_cross_reference'; // Cross-call macro invocation (M1-M5)

export interface IVoynichEdgeDTO {
  id: string;
  fromId: string;
  toId: string;
  type: VoynichEdgeType;
  label?: string;
  strength: number; // 0.1 .. 1.0
  economicInfluence?: number;
  tokenContext?: string;
}

/** Уровень 0: Гидравлический контур P&ID (Circuit Monolith) */
export interface IVoynichCircuitDTO {
  id: string; // e.g., 'circuit-r1-core'
  level: 0;
  name: string;
  description: string;
  subsystemCode: 'R1_CORE' | 'R2_BOTANY' | 'R1_BOOSTER' | 'R3A_POWER' | 'ZN_MANIFOLD';
  folioIds: string[];
  ricisInvariant: string;
  color: string;
}

/** Уровень 1: Страница Манускрипта Войнича (Folio Monolith) */
export interface IVoynichFolioDTO {
  id: string; // e.g., 'voynich-f5r'
  level: 1;
  folio: string; // 'f5r'
  circuitId: string; // 'circuit-r1-core'
  subsystem: string; // 'R1 Core'
  function: string; // 'Sonoluminescence LENR Cavitation Cell'
  visualChecksum: string;
  ricisInvariant: string;
  chargeDepth?: string;
  evaSourceUrl: string; // 'https://www.voynich.nu/q01/f005r.html'
  doiUrl: string; // 'https://doi.org/10.5281/zenodo.18001299'
  blockIds: string[];
  evaSentences: string[];
  status: 'Verified' | 'Pending' | 'Draft';
  modernAnalogue?: IVoynichModernAnalogueDTO;
}

/** Уровень 2: Функциональный Блок Агрегата (Block Monolith) */
export interface IVoynichBlockDTO {
  id: string; // e.g., 'block-f5r-cavitation-chamber'
  level: 2;
  folioId: string; // 'voynich-f5r'
  circuitId: string; // 'circuit-r1-core'
  name: string;
  description: string;
  partIds: string[];
  pandidCode: string;
  modernAnalogue?: IVoynichModernAnalogueDTO;
}

/** Уровень 3: Физическая Деталь / Резонатор (Part Monolith) */
export interface IVoynichPartDTO {
  id: string; // e.g., 'part-f5r-chladni-reflector'
  level: 3;
  blockId: string; // 'block-f5r-cavitation-chamber'
  folioId: string; // 'voynich-f5r'
  circuitId: string; // 'circuit-r1-core'
  name: string;
  material: string;
  pandidDescription: string;
  visualChecksum: string;
  ricisInvariant: string;
  codeUnitIds: string[];
  operatingFrequency: string;
  modernAnalogue?: IVoynichModernAnalogueDTO;
}

/** Уровень 4: Исполняемый EVA Forth Код (EVA Code Unit Monolith) */
export interface IVoynichCodeUnitDTO {
  id: string; // e.g., 'eva-code-f5r-l1'
  level: 4;
  partId: string; // 'part-f5r-chladni-reflector'
  blockId: string; // 'block-f5r-cavitation-chamber'
  folioId: string; // 'voynich-f5r'
  circuitId: string; // 'circuit-r1-core'
  evaLineNumber: number;
  evaSentence: string;
  forthStackOperations: string[];
  unaryCharge: number;
  targetStack: VoynichStackId;
  tokenWeight?: number; // W_i = 1 / f_i lazy database evaluation weight
  ricisTransformationLog: {
    inputState: string;
    transformation: string;
    outputInvariant: string;
  };
}

/** Композитное дерево 5 уровней */
export interface IVoynichHierarchyTreeDTO {
  circuits: IVoynichCircuitDTO[];
  folios: IVoynichFolioDTO[];
  blocks: IVoynichBlockDTO[];
  parts: IVoynichPartDTO[];
  codeUnits: IVoynichCodeUnitDTO[];
  edges: IVoynichEdgeDTO[];
}

export interface IVoynichProjectDecryptionDTO {
  project: string;
  version: string;
  author: string;
  doi: string;
  methodology: string;
  decryptionRules: IVoynichDecryptionRulesDTO;
  macroLibrary: Record<string, IVoynichMacroDTO>;
  decodedFolios: IVoynichDecodedFolioDTO[];
  hierarchyTree: IVoynichHierarchyTreeDTO;
  economicProfile: IVoynichEconomicProfileDTO;
}
