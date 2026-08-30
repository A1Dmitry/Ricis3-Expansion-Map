import { IRicisCatalogExample, ExampleCategory, IExampleCatalogService, ICatalogFilterOptions } from '../types/exampleCatalog';

export const RICIS_EXAMPLE_CATALOG: ReadonlyArray<IRicisCatalogExample> = [
  { id: 'L0', title: 'Hyperbolic Pole', input: 'x => 10 / (x - 2)', category: 'singularity_inf_inf', singularityPoint: 2, defaultParamValue: 3, description: 'Simple first-order pole at x = 2' },
  { id: 'L1', title: 'Difference of Squares Removable Singularity', input: 'x => (x^2 - 25) / (x - 5)', category: 'singularity_zero_zero', singularityPoint: 5, expectedNumeric: 10, description: 'Axiom A4 / SP2 factorable 0/0 form resolving to 10' },
  { id: 'L2', title: 'Linear Rational Pole', input: 'x => 1 / (2*x - 6)', category: 'singularity_inf_inf', singularityPoint: 3, defaultParamValue: 4, description: 'Linear denominator pole at x = 3' },
  { id: 'L3', title: 'Quadratic Symmetric Singularity', input: 'x => 1 / (x^2 - 4)', category: 'singularity_inf_inf', singularityPoint: 2, defaultParamValue: 3, description: 'Bipolar quadratic singularity at x = ±2' },
  { id: 'L5', title: 'Tangent Ratio (sin/cos)', input: 'x => sin(x) / cos(x)', category: 'trigonometry_transcendental', defaultParamValue: 0, expectedNumeric: 0, description: 'Trigonometric quotient sin(x)/cos(x)' },
  { id: 'L6', title: 'Cardinal Sine (Sinc)', input: 'x => sin(x) / x', category: 'singularity_zero_zero', singularityPoint: 0, expectedNumeric: 1, description: 'Fundamental sinc singularity resolving to 1 via SP4 + A4' },
  { id: 'L7', title: 'Double Angle Ratio', input: 'x => sin(2*x) / cos(2*x)', category: 'trigonometry_transcendental', defaultParamValue: 0, expectedNumeric: 0, description: 'Double angle quotient resolving smoothly' },
  { id: 'L8', title: 'Quartic Factorization Singularity', input: 'x => (x*x*x*x - 1) / (x - 1)', category: 'singularity_zero_zero', singularityPoint: 1, expectedNumeric: 4, description: 'Factorization (x^4 - 1)/(x - 1) resolving to 4 at x = 1' },
  { id: 'L9', title: 'Logarithmic Pole', input: 'x => 1 / log(x)', category: 'singularity_inf_inf', singularityPoint: 1, defaultParamValue: 2, description: 'Logarithmic pole at x = 1 (log(1) = 0)' },
  { id: 'L10', title: 'Exponential Infinitesimal Ratio', input: 'x => (exp(x) - 1) / x', category: 'singularity_zero_zero', singularityPoint: 0, expectedNumeric: 1, description: 'First derivative of exp(x) at origin = 1' },
  { id: 'L11', title: 'Cosine Second-Order Dipole', input: 'x => (1 - cos(x)) / (x*x)', category: 'singularity_zero_zero', singularityPoint: 0, expectedNumeric: 0.5, description: 'Curvature of cosine at origin resolving to 1/2' },
  { id: 'L12', title: 'Tangent Ratio at Origin', input: 'x => tan(x) / x', category: 'singularity_zero_zero', singularityPoint: 0, expectedNumeric: 1, description: 'Tangent infinitesimal quotient resolving to 1' },
  { id: 'L13', title: 'Bipole Rational Function', input: 'x => 1 / (x * (x + 1))', category: 'singularity_inf_inf', singularityPoint: 0, defaultParamValue: 1, description: 'Product pole at x = 0 and x = -1' },
  { id: 'L14', title: 'Unit Circle Projection Pole', input: 'x => 1 / (1 - x*x)', category: 'singularity_inf_inf', singularityPoint: 1, defaultParamValue: 0.5, description: 'Singularity on unit boundary x = 1' },
  { id: 'L15', title: 'Essential Exponential Singularity', input: 'x => exp(1 / x)', category: 'singularity_inf_inf', singularityPoint: 0, defaultParamValue: 1, description: 'Essential singularity exp(1/x) at origin' },
  { id: 'L16', title: 'Unit Hyperbola', input: 'x => 1 / x', category: 'singularity_inf_inf', singularityPoint: 0, defaultParamValue: 1, description: 'Fundamental 1/x reciprocal map' },
  { id: 'L17', title: 'Inverse Square Monolith', input: 'x => 1 / (x*x)', category: 'singularity_inf_inf', singularityPoint: 0, defaultParamValue: 1, description: 'Coulomb / Gravitational potential singularity 1/x^2' },
  { id: 'L18', title: 'Natural Logarithm', input: 'x => log(x)', category: 'trigonometry_transcendental', defaultParamValue: 1, expectedNumeric: 0, description: 'Logarithmic fundamental scale' },
  { id: 'L19', title: 'Normalized Sinc Wave', input: 'x => sin(x) / x', category: 'singularity_zero_zero', singularityPoint: 0, expectedNumeric: 1, description: 'SP2 + SP4 normalized sinc' },
  { id: 'L20', title: 'Essential Transition Pole', input: 'x => exp(1 / x)', category: 'singularity_inf_inf', singularityPoint: 0, defaultParamValue: 2, description: 'Nonlinear exponential transition' },
  { id: 'L21', title: 'Harmonic Element', input: 'x => 1 / x', category: 'singularity_inf_inf', singularityPoint: 0, defaultParamValue: 5, description: 'Harmonic basis' },
  { id: 'L22', title: 'Geometric Series Pole', input: 'x => 1 / (1 - x)', category: 'singularity_inf_inf', singularityPoint: 1, defaultParamValue: 0, expectedNumeric: 1, description: 'Sum of geometric series generator' },
  { id: 'L23', title: 'Unit Step Potential', input: 'x => 1 / (1 - x)', category: 'singularity_inf_inf', singularityPoint: 1, defaultParamValue: 2, description: 'Reflection pole' },
  { id: 'L24', title: 'Linear Ratio Cancellation', input: 'x => x / (x*x)', category: 'singularity_zero_zero', singularityPoint: 0, defaultParamValue: 2, description: 'Algebraic SP2 reduction x/x^2 -> 1/x' },
  { id: 'L25', title: 'Trigonometric-Hyperbolic Resonator', input: 'x => 1 / (cos(x) * sinh(x) - 1)', category: 'trigonometry_transcendental', defaultParamValue: 0, description: 'Coupled oscillatory pole' },
  { id: 'L26', title: 'Cyclotomic Quartic Invariant', input: 'x => 1 / (pow(x, 4) - 1)', category: 'singularity_inf_inf', singularityPoint: 1, defaultParamValue: 2, description: 'Fourth roots of unity singularity' },
  { id: 'L27', title: 'Cubic Reciprocal Pole', input: 'x => 1 / (x*x*x)', category: 'singularity_inf_inf', singularityPoint: 0, defaultParamValue: 2, description: 'Volumetric cubic pole 1/x^3' },
  { id: 'L28', title: 'Difference of Cubes Ratio', input: 'x => (pow(x, 3) - 8) / (x - 2)', category: 'singularity_zero_zero', singularityPoint: 2, expectedNumeric: 12, description: 'Factorization (x^3 - 8)/(x - 2) = x^2 + 2x + 4 resolving to 12' },
  { id: 'L29', title: 'Multiple Order Pole', input: 'x => 1 / (x*x*(x - 1))', category: 'singularity_inf_inf', singularityPoint: 0, defaultParamValue: 2, description: 'Mixed second and first order pole' },
  { id: 'L30', title: 'Square Root Branch', input: 'x => sqrt(x)', category: 'trigonometry_transcendental', defaultParamValue: 4, expectedNumeric: 2, description: 'Branch point square root' },
  { id: 'L31', title: 'Pi-Scaled Sinc Pulse', input: 'x => sin(pi*x) / x', category: 'singularity_zero_zero', singularityPoint: 0, expectedNumeric: Math.PI, description: 'Sinc function scaled by π resolving to π at origin' },
  { id: 'L32', title: 'Bessel Asymptotic Wave', input: 'x => sqrt(2 / (pi*x)) * cos(x - pi/4)', category: 'physics_quantum', defaultParamValue: 1, description: 'Asymptotic expansion of Bessel function J_0' },
  { id: 'L33', title: 'Super-Exponential Gauge', input: 'x => exp(pow(x, 1.5))', category: 'physics_quantum', defaultParamValue: 1, expectedNumeric: Math.E, description: 'Fractal dimension growth profile' },
  { id: 'L34', title: 'Logarithmic Coupled Residue', input: 'x => 1 / (x - 1) + log(abs(x))', category: 'trigonometry_transcendental', defaultParamValue: 2, expectedNumeric: 1 + Math.log(2), description: 'Coupled pole and logarithmic branch' },
  { id: 'L35', title: 'Instanton Tunneling Rate', input: 'x => log(1 + exp(-1 / x)) / x', category: 'physics_quantum', defaultParamValue: 1, description: 'Non-perturbative instanton action rate' },
  { id: 'L36', title: 'Fractional Power Singularity', input: 'x => 1 / pow(1 - x, 2.0/3)', category: 'singularity_inf_inf', singularityPoint: 1, defaultParamValue: 0, expectedNumeric: 1, description: 'Branch cut fractional pole' },
  { id: 'L37', title: 'Epsilon-Shielded Field', input: 'x => 1 / sqrt(abs(x) + 2.220446049250313e-16)', category: 'physics_quantum', defaultParamValue: 1, expectedNumeric: 1, description: 'Machine precision shielded field potential' },
  { id: 'L38', title: 'Schwarzschild Horizon Metric', input: 'x => 1 / (1 - 2 / x)', category: 'physics_quantum', singularityPoint: 2, defaultParamValue: 4, expectedNumeric: 2, description: 'General Relativity Schwarzschild horizon radial factor g_rr' },
  { id: 'L39', title: 'Yang-Mills Instanton Action', input: 'x => exp(-8 * pi * pi / x)', category: 'physics_quantum', defaultParamValue: 1, description: 'Topological charge action amplitude exp(-8π²/g²)' },
  { id: 'L40', title: 'Linear Calibration Scale', input: 'x => 1 / (12 * x)', category: 'singularity_inf_inf', singularityPoint: 0, defaultParamValue: 1, expectedNumeric: 1/12, description: 'Gauge coefficient 1/12 scale' },
  { id: 'L41', title: 'Shielded Relativistic Energy', input: 'x => 1 / sqrt(x*x + 2.220446049250313e-16)', category: 'physics_quantum', defaultParamValue: 1, expectedNumeric: 1, description: 'Relativistic invariant energy momentum shield' },
  { id: 'L42', title: 'Taylor Third-Order Remainder', input: 'x => (x - sin(x)) / pow(x, 3)', category: 'singularity_zero_zero', singularityPoint: 0, expectedNumeric: 1/6, description: 'Infinitesimal Taylor expansion resolving to 1/6' },
  { id: 'L43', title: 'Hyperbolic Curvature Remainder', input: 'x => (sinh(x) - x) / pow(x, 3)', category: 'singularity_zero_zero', singularityPoint: 0, expectedNumeric: 1/6, description: 'Hyperbolic Taylor expansion resolving to 1/6' },
  { id: 'L44', title: 'Cauchy Distribution Density', input: 'x => 1 / (x*x + 1)', category: 'physics_quantum', defaultParamValue: 0, expectedNumeric: 1, description: 'Non-singular Lorentzian / Cauchy spectral profile' },
  { id: 'L45', title: 'Tangent Resonance Pole', input: 'x => 1 / (1 - tan(x))', category: 'trigonometry_transcendental', defaultParamValue: 0, expectedNumeric: 1, description: 'Resonance pole at x = π/4' },
  { id: 'L46', title: 'Gaussian Exponential Well', input: 'x => 1 / (exp(x*x) - 1)', category: 'physics_quantum', singularityPoint: 0, defaultParamValue: 1, description: 'Thermal Gaussian partition pole' },
  { id: 'L47', title: 'Logarithmic Density Pole', input: 'x => 1 / log(x)', category: 'trigonometry_transcendental', singularityPoint: 1, defaultParamValue: Math.E, expectedNumeric: 1, description: 'Natural log reciprocal' },
  { id: 'L48', title: 'Sub-Linear Logarithmic Ratio', input: 'x => log(x) / (1 / x)', category: 'singularity_zero_zero', defaultParamValue: 1, expectedNumeric: 0, description: 'x*log(x) asymptotic resolving to 0 at origin' },
  { id: 'L49', title: 'Fifth-Order Polynomial Pole', input: 'x => 1 / (pow(x, 5) - 32)', category: 'singularity_inf_inf', singularityPoint: 2, defaultParamValue: 3, description: 'Quintic root singularity at x = 2' },
  { id: 'L50', title: 'Ultra-Close Double Pole', input: 'x => 1 / ((x - 1) * (x - 1.0000001))', category: 'singularity_inf_inf', singularityPoint: 1, defaultParamValue: 2, description: 'Confluent double pole bifurcation test' },
  { id: 'L51', title: 'Symbolic Derivative (x^3)', input: 'x => derivative(x ^ 3)', category: 'differentiation', defaultParamValue: 2, expectedNumeric: 12, description: 'Symbolic AST Leibniz derivative d(x^3)/dx = 3x^2 = 12 at x = 2' },
  { id: 'L52', title: 'Definite Integral (x + 1)', input: 'x => integral(x + 1, 5)', category: 'integration', defaultParamValue: 2, expectedNumeric: 13.5, description: 'Discrete Monolith plane difference operator Δ_plane over [2, 5]' },
  { id: 'L53', title: 'Discrete Step Summation', input: 'x => sum(x, 1)', category: 'integration', defaultParamValue: 4, expectedNumeric: 5, description: 'Discrete recursive summation operator' },
  { id: 'L54', title: 'Compound Interest Formula', input: 'x => compoundInterest(100, 10, 2)', category: 'financial_helpers', defaultParamValue: 0, expectedNumeric: 121, description: 'A = P*(1 + r/n)^(nt) financial calculation' },
  { id: 'L55', title: 'Minimum Value Bounding', input: 'x => min(x, 0)', category: 'financial_helpers', defaultParamValue: 3, expectedNumeric: 0, description: 'Min selector boundary' },
  { id: 'L56', title: 'Positive Part Operator', input: 'x => positivePart(x)', category: 'financial_helpers', defaultParamValue: 5, expectedNumeric: 5, description: 'ReLU / positive envelope operator max(x, 0)' },
  { id: 'L57', title: 'Negative Part Operator', input: 'x => negativePart(x)', category: 'financial_helpers', defaultParamValue: -5, expectedNumeric: 5, description: 'Negative envelope operator max(-x, 0)' },
  { id: 'L58', title: 'Metric Euclidean Distance', input: 'x => distance(x, 5)', category: 'financial_helpers', defaultParamValue: 2, expectedNumeric: 3, description: 'Metric distance |x - 5| = 3 at x = 2' },
  { id: 'L59', title: 'Maximum Value Bounding', input: 'x => max(x, 5)', category: 'financial_helpers', defaultParamValue: 2, expectedNumeric: 5, description: 'Max selector boundary' },
  { id: 'L60', title: 'Clamping Function', input: 'x => clamp(x, -1, 1)', category: 'financial_helpers', defaultParamValue: 3, expectedNumeric: 1, description: 'Bounded range clamp[-1, 1]' },
  { id: 'L61', title: 'Hyperbolic Cosine', input: 'x => cosh(x)', category: 'trigonometry_transcendental', defaultParamValue: 0, expectedNumeric: 1, description: 'Hyperbolic basis cosh(0) = 1' },
  { id: 'L62', title: 'Hyperbolic Tangent', input: 'x => tanh(x)', category: 'trigonometry_transcendental', defaultParamValue: 0, expectedNumeric: 0, description: 'Hyperbolic sigmoid tanh(0) = 0' },
  { id: 'L63', title: 'Shielded Decimal Logarithm', input: 'x => log10(abs(x) + 1)', category: 'trigonometry_transcendental', defaultParamValue: 9, expectedNumeric: 1, description: 'Log10 scaling log10(9 + 1) = 1' },
  { id: 'L64', title: 'Signum Function', input: 'x => sign(x)', category: 'financial_helpers', defaultParamValue: -42, expectedNumeric: -1, description: 'Orientation signum' },
  { id: 'L65', title: 'Modulo Arithmetic', input: 'x => mod(x, 2)', category: 'financial_helpers', defaultParamValue: 5, expectedNumeric: 1, description: 'Discrete modulo operator 5 mod 2 = 1' },
  { id: 'L66', title: 'Cubic Monolith Power', input: 'x => pow(x, 3)', category: 'differentiation', defaultParamValue: 3, expectedNumeric: 27, description: 'Power basis 3^3 = 27' }
];

export class ExampleCatalogService implements IExampleCatalogService {
  public getAllExamples(): ReadonlyArray<IRicisCatalogExample> {
    return RICIS_EXAMPLE_CATALOG;
  }

  public getExampleById(id: string): IRicisCatalogExample | undefined {
    return RICIS_EXAMPLE_CATALOG.find(e => e.id.toLowerCase() === id.toLowerCase());
  }

  public getFilteredExamples(options: ICatalogFilterOptions): ReadonlyArray<IRicisCatalogExample> {
    let result = RICIS_EXAMPLE_CATALOG;

    if (options.category && options.category !== 'all') {
      result = result.filter(e => e.category === options.category);
    }

    if (options.searchQuery && options.searchQuery.trim().length > 0) {
      const q = options.searchQuery.toLowerCase().trim();
      result = result.filter(e =>
        e.id.toLowerCase().includes(q) ||
        e.title.toLowerCase().includes(q) ||
        e.input.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q))
      );
    }

    return result;
  }

  public getCategories(): ReadonlyArray<{ id: ExampleCategory; label: string; count: number }> {
    const cats: { id: ExampleCategory; label: string }[] = [
      { id: 'singularity_zero_zero', label: '0/0 Singularities (A4 / SP4)' },
      { id: 'singularity_inf_inf', label: 'Poles & ∞/∞ (A1 / A5)' },
      { id: 'differentiation', label: 'Symbolic Derivatives D(f)' },
      { id: 'integration', label: 'Monolith Integrals Δ_plane' },
      { id: 'physics_quantum', label: 'Quantum & Relativity Metrics' },
      { id: 'trigonometry_transcendental', label: 'Trigonometric & Transcendental' },
      { id: 'financial_helpers', label: 'Financial & Operators' }
    ];

    return cats.map(c => ({
      ...c,
      count: RICIS_EXAMPLE_CATALOG.filter(e => e.category === c.id).length
    }));
  }
}

export const exampleCatalogService = new ExampleCatalogService();
