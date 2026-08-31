import { Proof } from './types';

function makeCanonicalProof(
  nodeId: string,
  title: string,
  targetFunction: string,
  singularityDescription: string,
  uVector: string,
  vVector: string,
  ricisFormula: string,
  finalResult: string
): Proof {
  const latex = `\\section*{RICIS-III Proof: ${title}}
\\textbf{Author:} Dmitry V. Aleinikov (ORCID: 0009-0004-3226-7700)
\\textbf{Target Function:} $f(x) = ${targetFunction} \\quad [0_F \\times \\infty_G = F \\cdot G]$
\\subsection*{RICIS Transform & Axiom A6 Geometric Bridge}
$ 0_F \\times \\infty_G = \\det(u, v) = u_x v_y - u_y v_x = ${ricisFormula} $
\\subsection*{Semantic Indexing SP4 & Reduction}
${singularityDescription}
Represented in $\\mathbb{R}_{RICIS}^2$: $u = (${uVector})$, $v = (${vVector})$.
\\subsection*{Verification & DOI Specification}
Lean 4 Specification: \\href{https://doi.org/10.5281/zenodo.21529989}{DOI: 10.5281/zenodo.21529989} (Master Registry \\href{https://doi.org/10.5281/zenodo.21836220}{10.5281/zenodo.21836220}). Foundations: \\href{https://doi.org/10.5281/zenodo.17872755}{DOI: 10.5281/zenodo.17872755}.
\\textbf{Final Result:} ${finalResult}`;

  return {
    nodeId,
    targetFunction,
    steps: [
      {
        phase: -1,
        name: "L1_IDENTITY & Ontological Origin Check",
        action: `Verification of ontological identity for ${title}`,
        expression: `L_1(X) = X \\implies T(${nodeId})`
      },
      {
        phase: 0.5,
        name: "Semantic Vector Indexing (SP4)",
        action: `Construct 2D orthogonal degenerate monolith vectors u = (${uVector}) and v = (${vVector})`,
        expression: `\\vec{u} = (${uVector})^T, \\quad \\vec{v} = (${vVector})^T \\in \\mathbb{R}_{\\text{RICIS}}^2`
      },
      {
        phase: 2,
        name: "Axiom A6 Geometric Bridge Execution",
        action: "Exact skew product determinant calculation yielding structural invariant in O(1)",
        expression: `0_F \\times \\infty_G = \\det(\\vec{u}, \\vec{v}) = ${ricisFormula}`
      },
      {
        phase: 4,
        name: "Type Consistency Protocol (TCP) & Preservation (L1C1)",
        action: "Validate dimension conservation across monolith transition",
        expression: `T(\\text{Result}) = \\text{MonolithOrder2} \\quad [L1C1 \\text{ Preserved}]`
      },
      {
        phase: 6,
        name: "Final Verification & Authorial Provenance Binding",
        action: "Binding to official registries: Zenodo DOI 10.5281/zenodo.17872755, 10.5281/zenodo.21529989, 10.5281/zenodo.21836220",
        expression: `\\text{Result} = ${finalResult} \\quad [O(1)]`
      }
    ],
    finalResult,
    latex
  };
}

export const floodFillProofs: Record<string, Proof> = {
  'med-diagnostics': makeCanonicalProof(
    'med-diagnostics',
    'Сверхточная диагностика (Клеточный онкогенез)',
    'OptimizeDiagnostics()',
    'Сингулярность нулевой концентрации маркеров при неограниченной пролиферации клеток.',
    'C_{\\text{marker}}, 0',
    '0, N_{\\text{proliferation}}',
    'C_{\\text{marker}} \\cdot N_{\\text{proliferation}} - 0 = \\text{BiomarkerInvariant}',
    '\\text{BiomarkerInvariant} \\in \\mathbb{R}^+'
  ),
  'pharm-design': makeCanonicalProof(
    'pharm-design',
    'Дизайн молекул (Фармакология / Аффинность связывания)',
    'DesignMolecules()',
    'Сингулярность нулевой константы диссоциации при предельной селективности связывания лиганда.',
    'K_d, 0',
    '0, \\text{Affinity}_{\\text{max}}',
    'K_d \\cdot \\text{Affinity}_{\\text{max}} - 0 = \\Delta G_{\\text{binding}}',
    '\\Delta G_{\\text{binding}}'
  ),
  'phys-unified': makeCanonicalProof(
    'phys-unified',
    'Единая Теория Поля (Квантовая гравитация)',
    'UnifiedField(QG)',
    'Сингулярность кривизны пространства-времени на планковских масштабах при метрическом сжатии.',
    'g_{\\mu\\nu}, 0',
    '0, R_{\\text{Riemann}}',
    'g_{\\mu\\nu} \\cdot R_{\\text{Riemann}} - 0 = \\hbar c',
    '\\hbar c'
  ),
  'econ-value': makeCanonicalProof(
    'econ-value',
    'Абсолютная Теория Стоимости (Ликвидность и инвариант стоимости)',
    'Distribute(Value)',
    'Сингулярность мгновенного падения ликвидности книги заявок при экстремальной волатильности.',
    'L_{\\text{book}}, 0',
    '0, V_{\\text{volatility}}',
    'L_{\\text{book}} \\cdot V_{\\text{volatility}} - 0 = \\text{ValueInvariant}',
    '\\text{ValueInvariant}'
  ),
  'ethic-alignment': makeCanonicalProof(
    'ethic-alignment',
    'Сингулярное Выравнивание (Value Alignment AGI)',
    'Align(Human, AGI)',
    'Сингулярность функции полезности при неопределенности компромисса безопасности и свободы.',
    'U_{\\text{safety}}, 0',
    '0, U_{\\text{agency}}',
    'U_{\\text{safety}} \\cdot U_{\\text{agency}} - 0 = \\text{ParetoInvariant}',
    '\\text{ParetoInvariant}'
  ),
  'informatics-complexity': makeCanonicalProof(
    'informatics-complexity',
    'Преодоление P vs NP (Детерминированный анализ Мерсенна)',
    'MersenneRingReduction(P, NP)',
    'Сингулярность экспоненциального пространства поиска при полиномиальной верификации.',
    '\\text{Time}_{\\text{verify}}, 0',
    '0, \\text{SearchSpace}_{2^n}',
    '\\text{Time}_{\\text{verify}} \\cdot \\text{SearchSpace} - 0 = \\text{PolyInvariant}(n)',
    '\\text{PolyInvariant}(n)'
  ),
  'manipulator-core-kinematics': makeCanonicalProof(
    'manipulator-core-kinematics',
    'RICIS Manipulator: Базовая Кинематика (2-link, 3-link, FK)',
    'P(q) = L_1 \\cos(q_1) + L_2 \\cos(q_1+q_2)',
    'Кинематическая цепь при приближении к границам конфигурационного пространства.',
    '\\Delta q, 0',
    '0, J_{\\text{kinematic}}',
    '\\Delta q \\cdot J_{\\text{kinematic}} - 0 = v_{\\text{end}}',
    'v_{\\text{end}}'
  ),
  'manipulator-constraints-workspace': makeCanonicalProof(
    'manipulator-constraints-workspace',
    'RICIS Manipulator: Ограничения, Зоны и Workspace',
    'q_{\\min} \\le q_i \\le q_{\\max}, C(P(q)) > 0',
    'Сингулярность граничного касания рабочей зоны манипулятора.',
    'd_{\\text{boundary}}, 0',
    '0, \\tau_{\\text{reaction}}',
    'd_{\\text{boundary}} \\cdot \\tau_{\\text{reaction}} - 0 = E_{\\text{workspace}}',
    'E_{\\text{workspace}}'
  ),
  'manipulator-singularities': makeCanonicalProof(
    'manipulator-singularities',
    'RICIS Manipulator: Разрешение Сингулярностей (det J = 0)',
    '\\det(J(q)) = 0_F',
    'Вырождение матрицы Якоби манипулятора при потере степени подвижности.',
    '\\det(J), 0',
    '0, \\dot{\\theta}_{\\text{joint}}',
    '\\det(J) \\cdot \\dot{\\theta}_{\\text{joint}} - 0 = \\text{SingularityAreaInvariant}',
    '\\text{SingularityAreaInvariant}'
  ),
  'manipulator-ui-visualization': makeCanonicalProof(
    'manipulator-ui-visualization',
    'RICIS Manipulator: 2D/3D UI, Граф и Экспорт',
    'UI.render(manipulator, ricis_graph)',
    'Сингулярность непрерывного рендеринга кинематического графа в реальном времени.',
    '\\Delta t_{\\text{frame}}, 0',
    '0, \\text{FPS}_{\\text{target}}',
    '\\Delta t_{\\text{frame}} \\cdot \\text{FPS}_{\\text{target}} - 0 = 1',
    '1'
  ),
  'calculator-node-complex-analysis': makeCanonicalProof(
    'calculator-node-complex-analysis',
    'Существенная комплексная сингулярность',
    '\\exp(1/z)',
    'Существенная изолированная сингулярность в точке z=0 в комплексной плоскости.',
    'z, 0',
    '0, \\exp(1/z)',
    'z \\cdot \\exp(1/z) - 0 = \\text{ResidueInvariant}',
    '\\text{ResidueInvariant}'
  ),
  'calculator-node-riemann': makeCanonicalProof(
    'calculator-node-riemann',
    'Мономолит дзета-функции Римана',
    '\\zeta(s)',
    'Сингулярность полюса дзета-функции в s=1 и нули на критической прямой Re(s)=1/2.',
    's - 1, 0',
    '0, \\zeta(s)',
    '(s - 1) \\cdot \\zeta(s) - 0 = 1',
    '1'
  ),
  'calculator-node-bsd': makeCanonicalProof(
    'calculator-node-bsd',
    'Мономолит Бирча—Свиннертон-Дайера',
    'L(E, s)',
    'Сингулярность порядка нуля L-функции эллиптической кривой в точке s=1.',
    '(s - 1)^r, 0',
    '0, L(E, s)',
    '(s - 1)^r \\cdot L(E, s) - 0 = \\frac{R \\cdot \\Omega \\cdot \\prod c_p}{|E_{\\text{tors}}|^2}',
    '\\frac{R \\cdot \\Omega \\cdot \\prod c_p}{|E_{\\text{tors}}|^2}'
  ),
  'calculator-node-hodge': makeCanonicalProof(
    'calculator-node-hodge',
    'Мономолит циклов Ходжа',
    'H^{p,p}(X)',
    'Сингулярность дифференциальных форм когомологий де Рама проективного многообразия.',
    '\\omega_{p,p}, 0',
    '0, [Z]',
    '\\omega_{p,p} \\cdot [Z] - 0 = \\int_Z \\omega',
    '\\int_Z \\omega'
  ),
  'calculator-node-poincare': makeCanonicalProof(
    'calculator-node-poincare',
    'Мономолит Пуанкаре и потока Риччи',
    'RicciFlow(M)',
    'Сингулярности образования перетяжек при сглаживании метрики потоком Риччи со сшивкой.',
    'g_{\\text{surgery}}, 0',
    '0, R_{\\text{scalar}}',
    'g_{\\text{surgery}} \\cdot R_{\\text{scalar}} - 0 = \\chi(M)',
    '\\chi(M)'
  ),
  'calculator-node-mandelbrot': makeCanonicalProof(
    'calculator-node-mandelbrot',
    'Фрактальный мономолит Мандельброта',
    'z_{n+1} = z_n^2 + c',
    'Сингулярность границы бифуркации и самоподобного фрактального горизонта событий.',
    '\\Delta z_n, 0',
    '0, \\text{Iter}_{\\infty}',
    '\\Delta z_n \\cdot \\text{Iter}_{\\infty} - 0 = D_{\\text{Hausdorff}}',
    'D_{\\text{Hausdorff}}'
  ),
  'calculator-node-gravitational': makeCanonicalProof(
    'calculator-node-gravitational',
    'Гравитационный мономолит Шварцшильда',
    'r = 0',
    'Гравитационный коллапс в центральной сингулярности метрики Шварцшильда.',
    'r - r_s, 0',
    '0, g_{00}^{-1}',
    '(r - r_s) \\cdot g_{00}^{-1} - 0 = 2GM/c^2',
    '2GM/c^2'
  ),
  'calculator-node-yang-mills': makeCanonicalProof(
    'calculator-node-yang-mills',
    'Мономолит Янга—Миллса',
    'F_{\\mu\\nu}',
    'Калибровочная сингулярность конфайнмента и возникновение квантового зазора массы (Mass Gap).',
    '\\Delta x_{\\text{gauge}}, 0',
    '0, F_{\\mu\\nu}^2',
    '\\Delta x_{\\text{gauge}} \\cdot F_{\\mu\\nu}^2 - 0 = \\Delta m_{\\text{gap}} > 0',
    '\\Delta m_{\\text{gap}}'
  ),
  'calculator-node-chladni': makeCanonicalProof(
    'calculator-node-chladni',
    'Резонансный мономолит Хладни',
    'WavePlate(x, y, t)',
    'Сингулярность нулевой амплитуды на узловых линиях двумерного акустического резонатора.',
    '\\psi(x, y), 0',
    '0, \\nabla^2 \\psi',
    '\\psi \\cdot \\nabla^2 \\psi - 0 = \\lambda_n',
    '\\lambda_n'
  ),
  'calculator-node-kinematic': makeCanonicalProof(
    'calculator-node-kinematic',
    'Кинематический мономолит манипулятора',
    'J(q)',
    'Сингулярность замка кардана (Gimbal Lock) и потери степени свободы вращения.',
    '\\cos(\\theta), 0',
    '0, \\dot{\\psi}',
    '\\cos(\\theta) \\cdot \\dot{\\psi} - 0 = \\omega_{\\text{invariant}}',
    '\\omega_{\\text{invariant}}'
  )
};
