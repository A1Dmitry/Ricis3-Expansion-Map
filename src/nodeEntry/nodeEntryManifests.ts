import type {
  NodeEntryManifest,
  NodeEntryNodeId,
  NodeEntrySlug,
} from './contracts';

const slug = (value: string) => value as NodeEntrySlug;
const nodeId = (value: string) => value as NodeEntryNodeId;

/**
 * Editorial source of the four reviewed peripheral entry pages.
 * Catalog data remains the authority for graph title, state, type, hints and edges.
 */
export const NODE_ENTRY_MANIFESTS: readonly NodeEntryManifest[] = [
  {
    slug: slug('physics-hydrodynamic-singularities'),
    locale: 'ru',
    nodeId: nodeId('real-catalog-38'),
    discipline: 'physics',
    publicTitle: 'Сингулярности в гидродинамике: исследовательский узел RICIS',
    searchDescription: 'Исследовательская точка входа в узел RICIS о гидродинамических сингулярностях, разрыве струи и связях задачи в общем графе.',
    readerQuestion: 'Как карта RICIS связывает гидродинамические сингулярности с соседними математическими и физическими исследовательскими узлами?',
    editorialSummary: 'Этот входной узел помогает исследовать, как в модели карты представлены локальные режимы разрыва и образования капель. Он показывает связи проблемы в графе, а не выдаёт новое физическое предсказание или решение уравнений.',
    sourceReferences: [
      {
        citationKey: 'clay-navier-stokes',
        title: 'Clay Mathematics Institute — Navier–Stokes Equation',
        url: 'https://www.claymath.org/millennium-problems/navier-stokes-equation/',
        sourceKind: 'official',
      },
      {
        citationKey: 'ricis-catalog-real-catalog-38',
        title: 'RICIS Expansion Map catalog: Сингулярности в гидродинамике',
        url: 'https://github.com/A1Dmitry/Ricis3-Expansion-Map/blob/main/src/model/catalog.ts',
        sourceKind: 'catalog_provenance',
      },
    ],
    review: {
      reviewedAt: 1_787_000_000_000,
      reviewerRole: 'subject_editor',
      editorialPolicyVersion: 'node-entry-v1',
    },
    safetyNotices: ['research_only', 'not_a_formal_proof'],
    trustFraming: 'research_node_unresolved',
    publicationState: 'published',
  },
  {
    slug: slug('number-theory-riemann-hypothesis'),
    locale: 'ru',
    nodeId: nodeId('real-catalog-3'),
    discipline: 'number_theory',
    publicTitle: 'Гипотеза Римана: исследовательский узел RICIS',
    searchDescription: 'Точка входа в узел RICIS о гипотезе Римана: критическая прямая, полюс при s=1 и зависимости исследовательской карты.',
    readerQuestion: 'Как устроен контекст узла гипотезы Римана и какие зависимости показываются в общем графе RICIS?',
    editorialSummary: 'Страница даёт навигационный контекст для открытой математической задачи и связывает её с зависимостями в карте. Она не является доказательством гипотезы Римана и не меняет её статус в каталоге.',
    sourceReferences: [
      {
        citationKey: 'clay-riemann',
        title: 'Clay Mathematics Institute — Riemann Hypothesis',
        url: 'https://www.claymath.org/millennium-problems/riemann-hypothesis/',
        sourceKind: 'official',
      },
      {
        citationKey: 'ricis-catalog-real-catalog-3',
        title: 'RICIS Expansion Map catalog: Гипотеза Римана',
        url: 'https://github.com/A1Dmitry/Ricis3-Expansion-Map/blob/main/src/model/catalog.ts',
        sourceKind: 'catalog_provenance',
      },
    ],
    review: {
      reviewedAt: 1_787_000_000_000,
      reviewerRole: 'formal_methods_reviewer',
      editorialPolicyVersion: 'node-entry-v1',
    },
    safetyNotices: ['research_only', 'not_a_formal_proof'],
    trustFraming: 'kernel_checked_evidence',
    publicationState: 'published',
  },
  {
    slug: slug('agi-intelligence-singularity'),
    locale: 'ru',
    nodeId: nodeId('real-catalog-57'),
    discipline: 'agi',
    publicTitle: 'Сингулярность ИИ: исследовательский узел RICIS',
    searchDescription: 'Исследовательская точка входа в узел RICIS о гипотезе сингулярности ИИ, вычислительных ограничениях и связях с общим графом.',
    readerQuestion: 'Как карта RICIS отделяет гипотезу о росте интеллекта от вычислительных ограничений и связанных исследовательских вопросов?',
    editorialSummary: 'Этот узел — навигационная рамка для гипотезы и связанных вычислительных ограничений. Он не предсказывает появление AGI, не подтверждает достижение AGI и не утверждает, что проблема выравнивания решена.',
    sourceReferences: [
      {
        citationKey: 'vinge-singularity',
        title: 'Vernor Vinge — The Coming Technological Singularity',
        url: 'https://edoras.sdsu.edu/~vinge/misc/singularity.html',
        sourceKind: 'primary',
      },
      {
        citationKey: 'ricis-catalog-real-catalog-57',
        title: 'RICIS Expansion Map catalog: Сингулярность ИИ',
        url: 'https://github.com/A1Dmitry/Ricis3-Expansion-Map/blob/main/src/model/catalog.ts',
        sourceKind: 'catalog_provenance',
      },
    ],
    review: {
      reviewedAt: 1_787_000_000_000,
      reviewerRole: 'subject_editor',
      editorialPolicyVersion: 'node-entry-v1',
    },
    safetyNotices: ['research_only', 'hypothesis_not_prediction', 'not_a_formal_proof'],
    trustFraming: 'research_node_unresolved',
    publicationState: 'published',
  },
  {
    slug: slug('pharmacy-blood-brain-barrier-delivery'),
    locale: 'ru',
    nodeId: nodeId('real-catalog-79'),
    discipline: 'pharmacy',
    publicTitle: 'Гематоэнцефалический барьер: исследовательский узел RICIS',
    searchDescription: 'Исследовательская точка входа в узел RICIS о гематоэнцефалическом барьере и моделировании ограничений доставки лекарств в мозг.',
    readerQuestion: 'Как граф RICIS показывает исследовательский узел о барьерах доставки лекарств в мозг и его соседние зависимости?',
    editorialSummary: 'Страница предназначена для навигации по исследовательской теме барьеров доставки лекарств в мозг. Это не клинический инструмент, не диагностика и не рекомендация лечения, дозировки, препарата или безопасности.',
    sourceReferences: [
      {
        citationKey: 'ncbi-bbb',
        title: 'NCBI Bookshelf — The Blood–Brain Barrier',
        url: 'https://www.ncbi.nlm.nih.gov/books/NBK519556/',
        sourceKind: 'academic',
      },
      {
        citationKey: 'ricis-catalog-real-catalog-79',
        title: 'RICIS Expansion Map catalog: Гематоэнцефалический барьер',
        url: 'https://github.com/A1Dmitry/Ricis3-Expansion-Map/blob/main/src/model/catalog.ts',
        sourceKind: 'catalog_provenance',
      },
    ],
    review: {
      reviewedAt: 1_787_000_000_000,
      reviewerRole: 'medical_editor',
      editorialPolicyVersion: 'node-entry-v1',
    },
    safetyNotices: ['research_only', 'not_medical_advice', 'not_a_formal_proof'],
    trustFraming: 'research_node_unresolved',
    publicationState: 'published',
  },
] as const;
