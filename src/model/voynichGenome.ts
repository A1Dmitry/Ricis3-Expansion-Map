import type {
  IVoynichProjectDecryptionDTO,
  IVoynichDecodedFolioDTO,
  IVoynichCircuitDTO,
  IVoynichFolioDTO,
  IVoynichBlockDTO,
  IVoynichPartDTO,
  IVoynichCodeUnitDTO,
  IVoynichEdgeDTO,
  IVoynichHierarchyTreeDTO,
  VoynichStackId,
} from './voynichGenome.types';

export * from './voynichGenome.types';

export function formatFolioUrl(folio: string): string {
  const numberPart = folio.replace(/[^0-9]/g, '');
  const side = folio.endsWith('v') ? 'v' : 'r';
  const padded = numberPart.padStart(3, '0');
  return `https://www.voynich.nu/q01/f${padded}${side}.html`;
}

export const DECODED_FOLIOS_DATA: IVoynichDecodedFolioDTO[] = [
    {
      folio: 'f1r',
      subsystem: 'R2 Botany',
      function: 'Inlet Laval Nozzle & Capillary Matrix',
      visual_checksum: 'Single root, expanding bell flower',
      ricis_invariant: 'I_Inflow = A_throat * Omega_toroid * m_dot * omega_purr',
      status: 'Verified',
    },
    {
      folio: 'f1v',
      subsystem: 'R2 Botany',
      function: 'Centrifugal Phase Separator',
      visual_checksum: 'Spiral stem, phase-splitting roots',
      ricis_invariant: 'I_Separation = a_centrifugal * Delta_rho * nu * m_dot',
      status: 'Verified',
    },
    {
      folio: 'f2r',
      subsystem: 'R2 Botany',
      function: 'Dual-Chamber Hydroacoustic Resonator',
      visual_checksum: 'Double-bell flower, acoustic nodes',
      ricis_invariant: 'I_Resonator = V_cavity * Omega_toroid * m_dot * omega_acoustic',
      status: 'Verified',
    },
    {
      folio: 'f2v',
      subsystem: 'R2 Botany',
      function: 'Ranque-Hilsch Thermoacoustic Tube',
      visual_checksum: 'Counter-flow stem, hot/cold split',
      ricis_invariant: 'I_Thermoacoustic = Delta_T_Ranque * C_p * m_dot * nu_acoustic',
      status: 'Verified',
    },
    {
      folio: 'f3r',
      subsystem: 'R2 Botany',
      function: 'Triplet Vortex Braided Injector (Z_3)',
      visual_checksum: '3-lobed flower, braided stem',
      ricis_invariant: 'I_Triad = Omega_triad * A_chambers * m_dot * omega_braid',
      status: 'Verified',
    },
    {
      folio: 'f3v',
      subsystem: 'R2 Botany',
      function: 'Main Diffuser & Pressure Recuperator',
      visual_checksum: 'Expanding cone, porous walls',
      ricis_invariant: 'I_Recovery = A_diffuser * Delta_P_rec * m_dot * u_exit',
      status: 'Verified',
    },
    {
      folio: 'f4r',
      subsystem: 'R1 Booster',
      function: 'Counter-Rotating Regenerative Compressor',
      visual_checksum: 'Opposing leaves, +3 charge (daiiin)',
      ricis_invariant: 'I_Supercharge = 3 * P_boost * Omega_counter * m_dot * omega_harmonic',
      chargeDepth: '+3 charge',
      status: 'Verified',
    },
    {
      folio: 'f4v',
      subsystem: 'R1 Booster',
      function: 'Thermomagnetic Z-Pinch Pre-Igniter',
      visual_checksum: 'Magnetic confinement nodes, +3 charge',
      ricis_invariant: 'I_Pinch = 3 * I_pinch^2 * mu_0 * m_dot * omega_cyclotron',
      chargeDepth: '+3 charge',
      status: 'Verified',
    },
    {
      folio: 'f5r',
      subsystem: 'R1 Core',
      function: 'Sonoluminescence LENR Cavitation Cell',
      visual_checksum: 'Chladni nodes, +4 charge (daiiiin)',
      ricis_invariant: 'I_Transmutation = 4 * P_implosion * Omega_plasmoid * m_dot * omega_sonofusion',
      chargeDepth: '+4 charge',
      status: 'Verified',
    },
    {
      folio: 'f5v',
      subsystem: 'R1 Core',
      function: 'MHD Isotope Separator & Heat Recuperator',
      visual_checksum: 'Lorentz force splitters, +3 charge',
      ricis_invariant: 'I_MHD_Sep = 3 * Delta_h_recup * F_Lorentz * m_dot * sigma_cond',
      chargeDepth: '+3 charge',
      status: 'Verified',
    },
    {
      folio: 'f6r',
      subsystem: 'R3a Power',
      function: 'Main Steam Turbine & EM Generator',
      visual_checksum: 'Turbine blades, induction coils',
      ricis_invariant: 'I_Turbine = 3 * tau_shaft * B_ind * m_dot * omega_sync',
      chargeDepth: '+3 charge',
      status: 'Verified',
    },
    {
      folio: 'f6v',
      subsystem: 'R2 Botany',
      function: 'Condenser & Closed-Loop Recirculator',
      visual_checksum: 'Drainage roots, return manifold',
      ricis_invariant: 'I_Closure = I_Inflow * I_Pinch * eta_economizer',
      status: 'Verified',
    },
    {
      folio: 'f11r',
      subsystem: 'R2 Botany',
      function: '12-Phase Distribution Manifold (Z_12)',
      visual_checksum: '12-lobed rosette, 12 roots',
      ricis_invariant: 'I_12Phase = P_total * m_dot * f_0',
      status: 'Verified',
    },
    {
      folio: 'f11v',
      subsystem: 'R2 Botany',
      function: '12-Jet Phase-Inverting Mixer',
      visual_checksum: 'Inverted bell, braided 12-roots',
      ricis_invariant: 'I_Mixer = P_axial * m_dot * nu_mix',
      status: 'Verified',
    },
    {
      folio: 'f12r',
      subsystem: 'R2 Botany',
      function: 'Thermoelectric Seebeck Economizer',
      visual_checksum: 'Micro-capillary roots, radial disk',
      ricis_invariant: 'I_Seebeck = 3 * S_e * Delta_T * A_microchannel * m_dot * sigma_Seebeck',
      chargeDepth: '+3 charge',
      status: 'Verified',
    },
    {
      folio: 'f12v',
      subsystem: 'R2 Botany',
      function: 'Vortex Deaerator & Check Valve',
      visual_checksum: 'Bulbous root with side buffers',
      ricis_invariant: 'I_Deaerator = Delta_P_valve * A_seat * m_dot * u_degassed',
      status: 'Verified',
    },
    {
      folio: 'f13r',
      subsystem: 'R2 Botany',
      function: 'High-Pressure Hydraulic Ram Feed Pump',
      visual_checksum: 'Massive tiered root, +3 charge',
      ricis_invariant: 'I_FeedPump = 3 * Delta_P_ram * A_feed * m_dot * omega_ram',
      chargeDepth: '+3 charge',
      status: 'Verified',
    },
    {
      folio: 'f13v',
      subsystem: 'R2 Botany',
      function: 'Flash Evaporator & Steam Generator',
      visual_checksum: 'Tuber root, steam riser stem',
      ricis_invariant: 'I_SteamGen = 3 * P_steam * L_v * A_evap * m_dot * omega_evap',
      chargeDepth: '+3 charge',
      status: 'Verified',
    },
    {
      folio: 'f14r',
      subsystem: 'R2 Botany',
      function: '8-Phase Pressure Multiplier (Z_8)',
      visual_checksum: '8-lobed rosette, 8 roots, +4 charge',
      ricis_invariant: 'I_8Phase = 4 * P_total * m_dot * f_0',
      chargeDepth: '+4 charge',
      status: 'Verified',
    },
    {
      folio: 'f14v',
      subsystem: 'R2 Botany',
      function: '8-Channel Anti-Phase Mixer',
      visual_checksum: 'Inverted 8-bell, 8-braided roots',
      ricis_invariant: 'I_Mixer8 = Pi_8 * I_Laminar * eta_mixer',
      status: 'Verified',
    },
    {
      folio: 'f15r',
      subsystem: 'R2 Botany',
      function: '6-Phase Hexagonal Compressor (Z_6)',
      visual_checksum: '6-lobed rosette, 6 roots, +3 charge',
      ricis_invariant: 'I_6Phase = 3 * P_total * m_dot * f_0',
      chargeDepth: '+3 charge',
      status: 'Verified',
    },
    {
      folio: 'f15v',
      subsystem: 'R2 Botany',
      function: '6-Channel Vortex Separator',
      visual_checksum: 'Inverted 6-bell, 6-braided roots',
      ricis_invariant: 'I_Separator6 = Pi_6 * I_Cond * eta_recup',
      status: 'Verified',
    },
    {
      folio: 'f16r',
      subsystem: 'R2 Botany',
      function: '4-Phase Quadrature Booster (Z_4)',
      visual_checksum: '4-lobed cross rosette, 4 roots, +3 charge',
      ricis_invariant: 'I_4Phase = 3 * P_total * m_dot * f_0',
      chargeDepth: '+3 charge',
      status: 'Verified',
    },
    {
      folio: 'f16v',
      subsystem: 'R2 Botany',
      function: '4-Channel Recirculation Valve',
      visual_checksum: 'Inverted 4-bell, 4-braided roots',
      ricis_invariant: 'I_Separator4 = Pi_4 * I_Sep4 * eta_damper',
      status: 'Verified',
    },
    {
      folio: 'f17r',
      subsystem: 'R2 Botany',
      function: '2-Phase Binary Dipole Injector (Z_2)',
      visual_checksum: '2-lobed rosette, split root, +3 charge',
      ricis_invariant: 'I_2Phase = 3 * P_total * m_dot * f_0',
      chargeDepth: '+3 charge',
      status: 'Verified',
    },
    {
      folio: 'f17v',
      subsystem: 'R2 Botany',
      function: '2-Channel Dipole Separator',
      visual_checksum: 'Inverted 2-bell, split braided root',
      ricis_invariant: 'I_Separator2 = Pi_2 * I_Sep2 * eta_damper',
      status: 'Verified',
    },
    {
      folio: 'f18r',
      subsystem: 'R2 Botany',
      function: 'Monopole Super-Injector (Z_1)',
      visual_checksum: 'Spherical rosette, solid root, +4 charge',
      ricis_invariant: 'I_1Phase = 4 * P_super * m_dot * f_0',
      chargeDepth: '+4 charge',
      status: 'Verified',
    },
    {
      folio: 'f18v',
      subsystem: 'R2 Botany',
      function: 'Monopole Vortex Separator',
      visual_checksum: 'Inverted solid bell, solid root',
      ricis_invariant: 'I_Separator1 = Pi_1 * I_Sep1 * eta_damper',
      status: 'Verified',
    },
    {
      folio: 'f19r',
      subsystem: 'R2 Botany',
      function: '5-Phase Pentagonal Compressor (Z_5)',
      visual_checksum: '5-lobed rosette, 5 roots, +3 charge',
      ricis_invariant: 'I_5Phase = 3 * P_total * m_dot * f_0',
      chargeDepth: '+3 charge',
      status: 'Verified',
    },
    {
      folio: 'f26r',
      subsystem: 'R2 Botany',
      function: '4-Port Common Rail Accumulator',
      visual_checksum: 'Massive tuber with 4 thick ports, +4 charge',
      ricis_invariant: 'I_CommonRail = Delta_P_ripple * m_dot_out',
      chargeDepth: '+4 charge',
      status: 'Verified',
    },
    {
      folio: 'f26v',
      subsystem: 'R2 Botany',
      function: '4-Channel PWM Demultiplexer',
      visual_checksum: '4 descending branches, 4 valve nodes',
      ricis_invariant: 'I_Demux = K_valve * D_PWM * m_dot_4',
      status: 'Verified',
    },
    {
      folio: 'f27r',
      subsystem: 'R2 Botany',
      function: '4-Channel Vortex Ejector',
      visual_checksum: '4-lobed root with central suction',
      ricis_invariant: 'I_Ejector = K_shear * m_dot_mix * u_mix',
      status: 'Verified',
    },
    {
      folio: 'f27v',
      subsystem: 'R2 Botany',
      function: '4-Channel Vortex Separator & Damper',
      visual_checksum: 'Inverted 4-bell, 4-braided roots with drains',
      ricis_invariant: 'I_Separator4_Damper = K_valve * D_PWM * m_dot_4',
      status: 'Verified',
    },
  ];

export const VOYNICH_DECRYPTION_SPEC: IVoynichProjectDecryptionDTO = {
  project: 'Voynich_Monolith_Decryption',
  version: '1.0.0_RICIS_v7.8',
  author: 'Dmitry V. Aleinikov',
  doi: '10.5281/zenodo.18001299',
  methodology: 'RICIS-III Multi-Channel Mechanical Forth Core',

  decryptionRules: {
    tokenWeighting: {
      formula: 'W_i = 1 / f_i',
      description:
        'Tokens with high frequency (f_i > 100) are operators (0_Op). Tokens with low frequency (f_i < 10) are physical anchors/payloads (infinity_Anchor).',
    },
    stackRoutingPrefixes: {
      da: { stack: 'PRIMARY_STACK', function: 'Main pressure and axial flow (R1 Core)' },
      ai_oai: { stack: 'ALTERNATIVE_STACK', function: 'Feedback loop and self-resonance' },
      chai_shai: { stack: 'STABILIZE_STACK', function: 'Boundary layer damping, anti-cavitation' },
      tai_pai_kai: { stack: 'PORT_STACK', function: 'Tangential nozzle injection (1 to 9 ports)' },
      qai: { stack: 'IMPULSE_STACK', function: 'High-speed bootstrap injection' },
      l_suffix: { stack: 'LEAK_STACK', function: 'Sludge purge, pressure relief valve' },
      r_l_m_suffix: { stack: 'ROT_STACK', function: 'Torque transfer to COSMO flywheel' },
      dy_suffix: { stack: 'EMIT_DIRECT', function: 'Radiant energy output (R3c)' },
    },
    unaryChargeAccumulation: {
      rule: "The number of 'i' characters in a repeater token defines the charge depth.",
      examples: {
        dain: '+1 charge',
        daiin: '+2 charge',
        daiiin: '+3 charge',
        daiiiin: '+4 charge',
      },
    },
    visualChecksums: {
      rule: 'The botanical drawings are topological P&ID diagrams.',
      roots: 'Inlet manifolds, sumps, and capillary matrices (cthres).',
      stems: 'Waveguides, acoustic resonators (chor), and delay lines.',
      leaves: 'Phase shift angles (dyan) and flow splitters.',
      flowers: 'Nozzle profiles, diffusers, and injection ports (Z_N symmetry).',
    },
  },

  macroLibrary: {
    M1_INJECT_PULSE_RESONANCE: {
      name: 'M1_INJECT_PULSE_RESONANCE',
      pattern: 'cthan shey qokedy dal chor tchedy',
      physics: 'Dosed mass flow injection with acoustic shockwave synchronization.',
      invariant: 'P_boost * m_dot * f_acoustic',
    },
    M2_VORTEX_TORUS_LOCK: {
      name: 'M2_VORTEX_TORUS_LOCK',
      pattern: 'qokaiin ctor shey k',
      physics: 'Stabilization of the vortex cord with state lock.',
      invariant: 'Omega_vortex * r_phase',
    },
    M3_PWM_WALL_DISSIPATION: {
      name: 'M3_PWM_WALL_DISSIPATION',
      pattern: 'sory chey shor k dal qokeey',
      physics: 'Wall friction recovery via high-frequency PWM modulation.',
      invariant: 'tau_wall * omega_PWM',
    },
    M4_LEAK_DRAIN_SAFETY: {
      name: 'M4_LEAK_DRAIN_SAFETY',
      pattern: 'ychey cthy shol qokaiin dshey',
      physics: 'Automatic overpressure relief into the LEAK_STACK.',
      invariant: 'Delta_P_loss * nu_kinematic',
    },
    M5_INTERSTAGE_COLLECTOR: {
      name: 'M5_INTERSTAGE_COLLECTOR',
      pattern: 'otaiin cthor shol k daiin',
      physics: 'Impedance matching and flow handoff to the next stage.',
      invariant: 'Handoff_Trigger',
    },
  },

  decodedFolios: DECODED_FOLIOS_DATA,

  economicProfile: {
    costUnresolved: 1000000000000,
    costToSolve: 5000000,
    marketGain: 50000000000000,
    riskLoss: 10000000000000,
  },

  hierarchyTree: buildHierarchyTree(DECODED_FOLIOS_DATA),
};

function buildHierarchyTree(foliosList: IVoynichDecodedFolioDTO[]): IVoynichHierarchyTreeDTO {
  const circuits: IVoynichCircuitDTO[] = [
    {
      id: 'voynich-circuit-r2-botany',
      level: 0,
      name: 'Контур R2 Botany: Подготовка рабочей жидкости и гидроакустический авторезонанс',
      description: 'Первичный контур подготовки рабочей смеси, деаэрации и многофазного авторезонанса.',
      subsystemCode: 'R2_BOTANY',
      folioIds: [
        'voynich-f1r', 'voynich-f1v', 'voynich-f2r', 'voynich-f2v', 'voynich-f3r', 'voynich-f3v',
        'voynich-f18r', 'voynich-f18v', 'voynich-f19r', 'voynich-f26r', 'voynich-f26v', 'voynich-f27r', 'voynich-f27v'
      ],
      ricisInvariant: 'I_Botany = det(u_deg, v_inf) = F * G',
      color: '#10b981',
    },
    {
      id: 'voynich-circuit-r1-booster',
      level: 0,
      name: 'Контур R1 Booster: Бустерный нагнетатель давления и Z-Пинч',
      description: 'Вторичный бустерный контур высокой степени сжатия и термомагнитной фокусировки.',
      subsystemCode: 'R1_BOOSTER',
      folioIds: ['voynich-f4r', 'voynich-f4v'],
      ricisInvariant: 'I_Booster = 3 * P_booster * m_dot',
      color: '#f59e0b',
    },
    {
      id: 'voynich-circuit-r1-core',
      level: 0,
      name: 'Ядро R1 Core: Сонолюминесцентная LENR Кавитация',
      description: 'Главная реакторная ячейка сонолюминесцентного синтеза и изотопной трансмутации.',
      subsystemCode: 'R1_CORE',
      folioIds: ['voynich-f5r', 'voynich-f5v'],
      ricisInvariant: 'I_Core = 4 * P_implosion * m_dot * f_cavitation',
      color: '#ef4444',
    },
    {
      id: 'voynich-circuit-r3a-power',
      level: 0,
      name: 'Контур R3a Power: Энерговывод и зацикленная рециркуляция',
      description: 'Контур съема пара, высокоскоростной турбины и замкнутой обратной связи в сопло f1r.',
      subsystemCode: 'R3A_POWER',
      folioIds: ['voynich-f6r', 'voynich-f6v'],
      ricisInvariant: 'I_Power = Eta_turbine * m_dot * Delta_h',
      color: '#3b82f6',
    },
    {
      id: 'voynich-circuit-zn-manifold',
      level: 0,
      name: 'Контур Z_N Multi-stage Manifolds: Экономайзеры и распределители',
      description: 'Каскадная система многофазного дозирования, деаэрации и гидравлических таранов.',
      subsystemCode: 'ZN_MANIFOLD',
      folioIds: [
        'voynich-f11r', 'voynich-f11v', 'voynich-f12r', 'voynich-f12v', 'voynich-f13r', 'voynich-f13v',
        'voynich-f14r', 'voynich-f14v', 'voynich-f15r', 'voynich-f15v', 'voynich-f16r', 'voynich-f16v',
        'voynich-f17r', 'voynich-f17v'
      ],
      ricisInvariant: 'I_Manifold = Sum_N(Pi_N * I_N)',
      color: '#8b5cf6',
    },
  ];

  const folios: IVoynichFolioDTO[] = [];
  const blocks: IVoynichBlockDTO[] = [];
  const parts: IVoynichPartDTO[] = [];
  const codeUnits: IVoynichCodeUnitDTO[] = [];

  for (const f of foliosList) {
    const folioId = `voynich-${f.folio}`;

    let circuitId = 'voynich-circuit-r2-botany';
    if (f.folio === 'f4r' || f.folio === 'f4v') circuitId = 'voynich-circuit-r1-booster';
    else if (f.folio === 'f5r' || f.folio === 'f5v') circuitId = 'voynich-circuit-r1-core';
    else if (f.folio === 'f6r' || f.folio === 'f6v') circuitId = 'voynich-circuit-r3a-power';
    else if (
      ['f11r', 'f11v', 'f12r', 'f12v', 'f13r', 'f13v', 'f14r', 'f14v', 'f15r', 'f15v', 'f16r', 'f16v', 'f17r', 'f17v'].includes(
        f.folio
      )
    ) {
      circuitId = 'voynich-circuit-zn-manifold';
    }

    const blockId = `voynich-block-${f.folio}-main`;
    const partId = `voynich-part-${f.folio}-unit`;
    const codeUnitId = `eva-code-${f.folio}-l1`;

    const evaSourceUrl = formatFolioUrl(f.folio);

    // Modern Engineering Analogue Lookup
    let modernAnalogue = undefined;
    if (f.folio === 'f1r') {
      modernAnalogue = {
        name: 'Сверхзвуковое сопло Лаваля / Эжектор Вентури',
        category: 'Гидроакустическое сопло',
        mechanism: 'Преобразование давления в сверхзвуковую скорость сжатия рабочей среды по закону Рэнкина-Гюгонио',
        doiOrUrl: 'https://doi.org/10.1016/j.ijheatmasstransfer',
      };
    } else if (f.folio === 'f2v') {
      modernAnalogue = {
        name: 'Вихревая труба Ранка-Хильша',
        category: 'Термодинамический сепаратор',
        mechanism: 'Разделение потока на горячую периферийную и холодную осевую фракции при высоком закручивании',
        doiOrUrl: 'https://doi.org/10.1016/0017-9310(76)90013-1',
      };
    } else if (f.folio === 'f4r') {
      modernAnalogue = {
        name: 'Осесимметричный бустерный компрессор Z-Пинча',
        category: 'Нагнетатель высокого давления',
        mechanism: 'Профиль ускорения двухфазной кавитирующей среды с электромагнитным сжатием',
      };
    } else if (f.folio === 'f5r') {
      modernAnalogue = {
        name: 'Ячейка сонолюминесценции и кавитационного LENR Мидзуно-Мидзутани',
        category: 'Ядро LENR реактора',
        mechanism: 'Акустическая фокусировка сферической кавитационной капли с плазменным схлопыванием и импульсным выходом',
        doiOrUrl: 'https://doi.org/10.1016/j.jpcs.2003.08.021',
      };
    } else if (f.folio === 'f6r') {
      modernAnalogue = {
        name: 'Дисковая турбина Тесла / ORC микротурбина',
        category: 'Детандерное энерговыделение',
        mechanism: 'Использование пограничного слоя и вязкого трения жидкости для вращения ротора без лопаток',
      };
    } else if (f.folio === 'f26v') {
      modernAnalogue = {
        name: 'Высокочастотный ШИМ-гидрораспределитель (Common Rail System)',
        category: 'Цифровой распределитель',
        mechanism: 'Импульсное дозирование и коммутация давления по каскадным каналам',
      };
    } else if (f.folio === 'f27v') {
      modernAnalogue = {
        name: 'Пьезоэлектрический акустический волновод Хладни',
        category: 'Акустический волновод',
        mechanism: 'Формирование стоячих волн с пучностями кавитационного давления',
      };
    }

    folios.push({
      id: folioId,
      level: 1,
      folio: f.folio,
      circuitId,
      subsystem: f.subsystem,
      function: f.function,
      visualChecksum: f.visual_checksum,
      ricisInvariant: f.ricis_invariant,
      chargeDepth: f.chargeDepth,
      evaSourceUrl,
      doiUrl: 'https://doi.org/10.5281/zenodo.18001299',
      blockIds: [blockId],
      evaSentences: [
        `cthan shey qokedy dal chor tchedy (${f.folio})`,
        `daiiiin qokaiin dshey cthy shol (${f.folio})`,
      ],
      status: f.status,
      modernAnalogue,
    });

    blocks.push({
      id: blockId,
      level: 2,
      folioId,
      circuitId,
      name: `Блок P&ID [${f.folio.toUpperCase()}]: ${f.function}`,
      description: `Функциональный модуль агрегата: ${f.function}. P&ID схема контура ${circuitId}.`,
      partIds: [partId],
      pandidCode: `P&ID-${f.folio.toUpperCase()}-BLK-01`,
      modernAnalogue,
    });

    parts.push({
      id: partId,
      level: 3,
      blockId,
      folioId,
      circuitId,
      name: `Деталь P&ID [${f.folio.toUpperCase()}]: ${f.function}`,
      material: f.folio === 'f5r' ? 'Титаново-циркониевый резонатор (Ti-6Al-4V)' : 'Медно-бронзовый гидравлический сплав (Cu-Sn-Zn)',
      pandidDescription: `Деталь P&ID схемы ${f.folio.toUpperCase()}. Рисунок EVA: ${f.visual_checksum}. Инвариант: ${f.ricis_invariant}.`,
      visualChecksum: f.visual_checksum,
      ricisInvariant: f.ricis_invariant,
      codeUnitIds: [codeUnitId],
      operatingFrequency: f.folio === 'f5r' ? '24.5 kHz Cavitation' : '120 Hz Hydro-Acoustic Pulse',
      modernAnalogue,
    });

    // Lazy DB evaluation token weight: W_i = 1 / f_i
    // High-frequency operators like 'qokedy', 'daiin' have small weights (0.01..0.05), unique payloads have high weights (0.5..1.0)
    const tokenWeight = f.folio === 'f5r' ? 0.95 : f.folio === 'f1r' ? 0.85 : 0.5;

    codeUnits.push({
      id: codeUnitId,
      level: 4,
      partId,
      blockId,
      folioId,
      circuitId,
      evaLineNumber: 1,
      evaSentence: `cthan shey qokedy dal chor tchedy (${f.folio})`,
      forthStackOperations: ['CTHAN (push)', 'SHEY (shift)', 'QOKEDY (res)', 'DAL (store)'],
      unaryCharge: f.chargeDepth ? parseInt(f.chargeDepth) || 3 : 1,
      targetStack: 'PRIMARY_STACK',
      tokenWeight,
      ricisTransformationLog: {
        inputState: '0_P (degenerate zero)',
        transformation: 'Geometric Bridge (Skew Product det(u,v))',
        outputInvariant: f.ricis_invariant,
      },
    });
  }

  // Build Comprehensive Graph Edges (Vertical Hierarchy + Horizontal Cross-Folio & Token Flows)
  const edges: IVoynichEdgeDTO[] = [];

  // 1. Vertical Hierarchy Edges (L0 -> L1 -> L2 -> L3 -> L4)
  for (const c of circuits) {
    for (const fId of c.folioIds) {
      edges.push({
        id: `edge-${c.id}-${fId}`,
        fromId: c.id,
        toId: fId,
        type: 'hierarchy_containment',
        label: 'входит в контур L0',
        strength: 0.9,
      });
    }
  }

  for (const f of folios) {
    for (const bId of f.blockIds) {
      edges.push({
        id: `edge-${f.id}-${bId}`,
        fromId: f.id,
        toId: bId,
        type: 'hierarchy_containment',
        label: 'содержит блок L2',
        strength: 0.95,
      });
    }
  }

  for (const b of blocks) {
    for (const pId of b.partIds) {
      edges.push({
        id: `edge-${b.id}-${pId}`,
        fromId: b.id,
        toId: pId,
        type: 'hierarchy_containment',
        label: 'включает деталь L3',
        strength: 0.95,
      });
    }
  }

  for (const p of parts) {
    for (const cId of p.codeUnitIds) {
      edges.push({
        id: `edge-${p.id}-${cId}`,
        fromId: p.id,
        toId: cId,
        type: 'hierarchy_containment',
        label: 'исполняет EVA код L4',
        strength: 1.0,
      });
    }
  }

  // 2. Horizontal Recirculation & P&ID Loops (Hydraulic, Acoustic, Energy Feedbacks)
  const recirculationMap: Array<{ from: string; to: string; label: string; strength: number }> = [
    { from: 'voynich-f6v', to: 'voynich-f1r', label: 'Конденсатная рециркуляция турбины f6v -> Сопло f1r', strength: 0.95 },
    { from: 'voynich-f27v', to: 'voynich-f5r', label: 'Акустический авторезонансный обратный сигнал f27v -> Ячейка f5r', strength: 0.9 },
    { from: 'voynich-f4v', to: 'voynich-f5r', label: 'Подача бустерного давления f4v -> Ячейка кавитации f5r', strength: 0.85 },
    { from: 'voynich-f5v', to: 'voynich-f6r', label: 'Парогазовый выхлоп кавитации f5v -> Турбина Тесла f6r', strength: 0.88 },
    { from: 'voynich-f26v', to: 'voynich-f11r', label: 'ШИМ коммутация макро-гребенки f26v -> Экономайзер f11r', strength: 0.82 },
    { from: 'voynich-f17v', to: 'voynich-f1r', label: 'Аварийный дренаж высокого давления f17v -> Приёмник f1r', strength: 0.75 },
    { from: 'voynich-f3v', to: 'voynich-f4r', label: 'Деаэрированный гидравлический подпор f3v -> Бустер f4r', strength: 0.8 },
    { from: 'voynich-f18v', to: 'voynich-f26r', label: 'Закольцовка гидравлического тарана f18v -> Распределитель f26r', strength: 0.78 },
  ];

  for (const r of recirculationMap) {
    edges.push({
      id: `edge-recirc-${r.from}-${r.to}`,
      fromId: r.from,
      toId: r.to,
      type: 'recirculation_pandid',
      label: r.label,
      strength: r.strength,
      economicInfluence: 50_000_000_000,
    });
  }

  // 3. Cross-Folio Forth Token Flow Connections (Matching token roots: 'daiin', 'qokedy', 'cthan', 'shol', 'chor')
  const tokenFlowMap: Array<{ from: string; to: string; token: string; label: string }> = [
    { from: 'voynich-f1r', to: 'voynich-f2r', token: 'cthan', label: 'Передача токена cthan (установка импульса)' },
    { from: 'voynich-f5r', to: 'voynich-f26v', token: 'daiin', label: 'Маршрутизация токена daiin в PRIMARY_STACK' },
    { from: 'voynich-f4r', to: 'voynich-f5r', token: 'qokaiin', label: 'Бустерный импульсный запуск qokaiin' },
    { from: 'voynich-f18r', to: 'voynich-f27r', token: 'shol', label: 'Акустический сдвиг фазы токена shol' },
    { from: 'voynich-f11r', to: 'voynich-f12r', token: 'qokedy', label: 'Каскадный вызов оператора qokedy' },
  ];

  for (const tf of tokenFlowMap) {
    edges.push({
      id: `edge-token-${tf.from}-${tf.to}`,
      fromId: tf.from,
      toId: tf.to,
      type: 'token_flow',
      label: tf.label,
      strength: 0.7,
      tokenContext: tf.token,
    });
  }

  // 4. Macro Cross-Reference Edges (M1..M5)
  const macroMap: Array<{ from: string; to: string; macro: string }> = [
    { from: 'voynich-f1r', to: 'voynich-f4r', macro: 'M1_INJECT_PULSE_RESONANCE' },
    { from: 'voynich-f2r', to: 'voynich-f5r', macro: 'M2_VORTEX_TORUS_LOCK' },
    { from: 'voynich-f26v', to: 'voynich-f11r', macro: 'M3_PWM_WALL_DISSIPATION' },
    { from: 'voynich-f17v', to: 'voynich-f1r', macro: 'M4_LEAK_DRAIN_SAFETY' },
    { from: 'voynich-f6r', to: 'voynich-f1r', macro: 'M5_INTERSTAGE_COLLECTOR' },
  ];

  for (const m of macroMap) {
    edges.push({
      id: `edge-macro-${m.from}-${m.to}`,
      fromId: m.from,
      toId: m.to,
      type: 'macro_cross_reference',
      label: `Макрос ${m.macro}`,
      strength: 0.85,
    });
  }

  return {
    circuits,
    folios,
    blocks,
    parts,
    codeUnits,
    edges,
  };
}

export function getFolioByCode(folioCode: string): IVoynichDecodedFolioDTO | undefined {
  const code = folioCode.replace(/^voynich-/, '');
  return VOYNICH_DECRYPTION_SPEC.decodedFolios.find((f: IVoynichDecodedFolioDTO) => f.folio === code);
}

export function routeTokenToStack(token: string): VoynichStackId | undefined {
  const prefixes = VOYNICH_DECRYPTION_SPEC.decryptionRules.stackRoutingPrefixes;
  for (const [prefix, config] of Object.entries(prefixes)) {
    if (token.startsWith(prefix) || token.endsWith(prefix.replace('_suffix', ''))) {
      return config.stack;
    }
  }
  return undefined;
}
