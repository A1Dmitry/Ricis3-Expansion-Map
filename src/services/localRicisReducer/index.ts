import {
  toLocalRecoveryContext,
  type LocalAnalysisResult,
  type LocalExpressionNode,
  type LocalSemanticIndexEntry,
  type SourceExpression,
} from '../localRicisAnalyzer/contracts';
import type { CoreExecutionFailure } from '../ricisCore/IRicisCoreEngine';
import type {
  FiniteStructuralKey,
  ILocalStructuralReducer,
  ILocalStructuralReductionApplicationService,
  IStructuralExpressionMapper,
  IStructuralReductionAdmissionPolicy,
  LocalStructuralAssessment,
  LocalStructuralExternalRequirement,
  LocalStructuralNonApplicable,
  LocalStructuralNonApplicabilityReason,
  LocalStructuralNotAdmitted,
  LocalStructuralProvenance,
  LocalStructuralReducerDependencies,
  LocalStructuralReducerLimits,
  LocalStructuralReductionCommand,
  LocalStructuralReductionResult,
  LocalStructuralRule,
  LocalStructuralRequiresCoreOrLean,
  StructuralBinaryExpression,
  StructuralDerivationStep,
  StructuralExpression,
  StructuralIdentity,
  StructuralIndex,
  StructuralMappingInput,
  StructuralMappingResult,
  StructuralOrigin,
  StructuralPrecondition,
  StructuralRuleAuthority,
  StructuralSourceReference,
  StructuralTypeTag,
} from './contracts';

const RICIS_AUTHORITY: StructuralRuleAuthority = 'RICIS_III_EXPLICIT';
const INHERITED_AUTHORITY: StructuralRuleAuthority = 'INHERITED_CLASSICAL_STRUCTURAL_ALGEBRA_GEOMETRY';

function freeze<T>(value: T): T {
  return Object.freeze(value);
}

function frozenArray<T>(values: readonly T[]): readonly T[] {
  return freeze([...values]);
}

function isFiniteKey(value: FiniteStructuralKey): boolean {
  return value.key.length > 0 && value.key.length <= 512 && value.sourceHash.length > 0 && value.sourceCanonical.length > 0;
}

function uniqueKeys(values: readonly FiniteStructuralKey[]): readonly FiniteStructuralKey[] {
  const seen = new Set<string>();
  const output: FiniteStructuralKey[] = [];
  for (const value of values) {
    const fingerprint = `${value.kind}:${value.key}:${value.sourceHash}:${value.sourceCanonical}`;
    if (seen.has(fingerprint)) continue;
    seen.add(fingerprint);
    output.push(freeze({ ...value }));
  }
  return frozenArray(output);
}

function binarySymbol(operator: StructuralBinaryExpression['operator']): string {
  return ({ ADD: '+', SUBTRACT: '-', MULTIPLY: '*', DIVIDE: '/' } as const)[operator];
}

function precedence(expression: StructuralExpression): number {
  if (expression.kind !== 'BINARY') return 3;
  return expression.operator === 'MULTIPLY' || expression.operator === 'DIVIDE' ? 2 : 1;
}

function renderOperand(expression: StructuralExpression, parentOperator: StructuralBinaryExpression['operator'], right: boolean): string {
  const parentPrecedence = parentOperator === 'MULTIPLY' || parentOperator === 'DIVIDE' ? 2 : 1;
  const childPrecedence = precedence(expression);
  if (childPrecedence < parentPrecedence) return `(${expression.identity.canonical})`;
  if (right && expression.kind === 'BINARY' && (parentOperator === 'DIVIDE' || parentOperator === 'SUBTRACT') && childPrecedence === parentPrecedence) {
    return `(${expression.identity.canonical})`;
  }
  return expression.identity.canonical;
}

function renderBinary(operator: StructuralBinaryExpression['operator'], left: StructuralExpression, right: StructuralExpression): string {
  return `${renderOperand(left, operator, false)} ${binarySymbol(operator)} ${renderOperand(right, operator, true)}`;
}

function sourceReference(
  sourceHash: string,
  sourceCanonical: string,
  start: number,
  endExclusive: number,
  origin: StructuralOrigin,
): StructuralSourceReference {
  return freeze({
    sourceHash,
    sourceCanonical,
    sourceSpan: freeze({ start, endExclusive }),
    origin,
  });
}

function structuralHash(typeTag: StructuralTypeTag, canonical: string, source: StructuralSourceReference): string {
  return `structural-v1:${typeTag}:${source.sourceHash}:${canonical}`;
}

function identity(typeTag: StructuralTypeTag, canonical: string, source: StructuralSourceReference): StructuralIdentity {
  return freeze({
    structuralHash: structuralHash(typeTag, canonical, source),
    canonical,
    typeTag,
    source,
  });
}

function inheritedSource(expression: StructuralExpression, canonical: string): StructuralSourceReference {
  const previous = expression.identity.source;
  return sourceReference(
    previous.sourceHash,
    previous.sourceCanonical,
    previous.sourceSpan.start,
    previous.sourceSpan.endExclusive,
    'DERIVED_RICIS_RULE',
  );
}

function makeBinary(
  operator: StructuralBinaryExpression['operator'],
  left: StructuralExpression,
  right: StructuralExpression,
  source: StructuralSourceReference,
  typeTag: StructuralTypeTag = left.identity.typeTag,
): StructuralBinaryExpression {
  const canonical = renderBinary(operator, left, right);
  return freeze({
    kind: 'BINARY',
    operator,
    left,
    right,
    identity: identity(typeTag, canonical, source),
    semanticKeys: uniqueKeys([...left.semanticKeys, ...right.semanticKeys]),
  });
}

function makeFiniteLiteral(lexeme: '0' | '1', reference: StructuralExpression): StructuralExpression {
  const source = inheritedSource(reference, lexeme);
  return freeze({
    kind: 'FINITE_LITERAL',
    lexeme,
    identity: identity(reference.identity.typeTag, lexeme, source),
    semanticKeys: frozenArray([]),
  });
}

function makeIndexed(
  kind: 'INDEXED_ZERO' | 'INDEXED_INFINITY',
  payload: StructuralExpression,
): StructuralExpression {
  const source = inheritedSource(payload, kind === 'INDEXED_ZERO' ? `0_{${payload.identity.canonical}}` : `inf_{${payload.identity.canonical}}`);
  const index: StructuralIndex = freeze({
    basis: 'SP4_SOURCE_EXPRESSION',
    payloadHash: payload.identity.structuralHash,
    payloadCanonical: payload.identity.canonical,
    payloadTypeTag: payload.identity.typeTag,
    sourceHash: payload.identity.source.sourceHash,
    semanticKeys: payload.semanticKeys,
  });
  const canonical = kind === 'INDEXED_ZERO' ? `0_{${payload.identity.canonical}}` : `inf_{${payload.identity.canonical}}`;
  return freeze({
    kind,
    payload,
    index,
    identity: identity(payload.identity.typeTag, canonical, source),
    semanticKeys: payload.semanticKeys,
  });
}

function isOrdinaryZero(expression: StructuralExpression): boolean {
  return expression.kind === 'FINITE_LITERAL' && expression.lexeme === '0';
}

function isOrdinaryOne(expression: StructuralExpression): boolean {
  return expression.kind === 'FINITE_LITERAL' && expression.lexeme === '1';
}

function hasIndexedExpression(expression: StructuralExpression): boolean {
  switch (expression.kind) {
    case 'INDEXED_ZERO':
    case 'INDEXED_INFINITY':
      return true;
    case 'UNARY':
      return hasIndexedExpression(expression.operand);
    case 'BINARY':
      return hasIndexedExpression(expression.left) || hasIndexedExpression(expression.right);
    default:
      return false;
  }
}

function structuralEqual(left: StructuralExpression, right: StructuralExpression): boolean {
  if (left.kind !== right.kind || left.identity.typeTag !== right.identity.typeTag || left.identity.structuralHash !== right.identity.structuralHash) return false;
  switch (left.kind) {
    case 'IDENTIFIER':
      return right.kind === 'IDENTIFIER' && left.name === right.name;
    case 'FINITE_LITERAL':
      return right.kind === 'FINITE_LITERAL' && left.lexeme === right.lexeme;
    case 'UNARY':
      return right.kind === 'UNARY' && left.operator === right.operator && structuralEqual(left.operand, right.operand);
    case 'BINARY':
      return right.kind === 'BINARY' && left.operator === right.operator && structuralEqual(left.left, right.left) && structuralEqual(left.right, right.right);
    case 'INDEXED_ZERO':
    case 'INDEXED_INFINITY':
      return right.kind === left.kind && structuralEqual(left.payload, right.payload) &&
        left.index.payloadHash === right.index.payloadHash &&
        left.index.payloadTypeTag === right.index.payloadTypeTag &&
        left.index.sourceHash === right.index.sourceHash;
  }
}

function flattenProduct(expression: StructuralExpression): readonly StructuralExpression[] {
  if (expression.kind !== 'BINARY' || expression.operator !== 'MULTIPLY') return frozenArray([expression]);
  return frozenArray([...flattenProduct(expression.left), ...flattenProduct(expression.right)]);
}

function buildProduct(factors: readonly StructuralExpression[], reference: StructuralExpression): StructuralExpression {
  if (factors.length === 0) return makeFiniteLiteral('1', reference);
  let result = factors[0]!;
  for (let index = 1; index < factors.length; index += 1) {
    result = makeBinary('MULTIPLY', result, factors[index]!, inheritedSource(reference, result.identity.canonical));
  }
  return result;
}

function structuralDepth(expression: StructuralExpression): number {
  switch (expression.kind) {
    case 'UNARY':
      return 1 + structuralDepth(expression.operand);
    case 'BINARY':
      return 1 + Math.max(structuralDepth(expression.left), structuralDepth(expression.right));
    case 'INDEXED_ZERO':
    case 'INDEXED_INFINITY':
      return 1 + structuralDepth(expression.payload);
    default:
      return 1;
  }
}

function everyKeyIsFinite(expression: StructuralExpression, limits: LocalStructuralReducerLimits): boolean {
  if (expression.semanticKeys.length > limits.maxSemanticKeysPerExpression || !expression.semanticKeys.every(isFiniteKey)) return false;
  switch (expression.kind) {
    case 'UNARY':
      return everyKeyIsFinite(expression.operand, limits);
    case 'BINARY':
      return everyKeyIsFinite(expression.left, limits) && everyKeyIsFinite(expression.right, limits);
    case 'INDEXED_ZERO':
    case 'INDEXED_INFINITY':
      return expression.index.semanticKeys.length <= limits.maxSemanticKeysPerExpression &&
        expression.index.semanticKeys.every(isFiniteKey) && everyKeyIsFinite(expression.payload, limits);
    default:
      return true;
  }
}

class DerivationJournal {
  private readonly entries: StructuralDerivationStep[] = [];

  public constructor(private readonly limits: LocalStructuralReducerLimits) {}

  public add(
    phase: StructuralDerivationStep['phase'],
    rule: LocalStructuralRule,
    authority: StructuralRuleAuthority,
    outcome: StructuralDerivationStep['outcome'],
    input: StructuralExpression,
    output: StructuralExpression,
    prerequisites: readonly StructuralPrecondition[],
    rationaleCode: string,
  ): boolean {
    if (this.entries.length >= this.limits.maxDerivationSteps) return false;
    this.entries.push(freeze({
      sequence: this.entries.length + 1,
      phase,
      rule,
      authority,
      outcome,
      inputHash: input.identity.structuralHash,
      outputHash: output.identity.structuralHash,
      prerequisites: frozenArray(prerequisites),
      rationaleCode,
    }));
    return true;
  }

  public values(): readonly StructuralDerivationStep[] {
    return frozenArray(this.entries);
  }
}

function provenance(sourceHash: string): LocalStructuralProvenance {
  return freeze({
    producer: 'LOCAL_TYPED_STRUCTURAL_REDUCER',
    sourceHash,
    analysisContractVersion: 'v1',
    reducerContractVersion: 'v1',
    localOnly: true,
    coreResultCreated: false,
    leanEvidenceCreated: false,
    proofCreated: false,
    trustStateChanged: false,
  });
}

function mappingKeys(
  source: SourceExpression,
  node: LocalExpressionNode,
  semanticIndex: readonly LocalSemanticIndexEntry[],
): readonly FiniteStructuralKey[] {
  return uniqueKeys(semanticIndex
    .filter(entry => entry.span.start >= node.span.start && entry.span.endExclusive <= node.span.endExclusive)
    .map(entry => freeze({
      key: entry.key,
      kind: entry.kind,
      sourceHash: source.sourceHash,
      sourceCanonical: entry.canonicalFragment,
    })));
}

export class StructuralExpressionMapper implements IStructuralExpressionMapper {
  public constructor(private readonly limits: LocalStructuralReducerLimits) {}

  public map(input: StructuralMappingInput): StructuralMappingResult {
    if (input.semanticIndex.length > this.limits.maxSemanticKeysPerExpression) {
      return freeze({ status: 'NON_APPLICABLE', reason: 'STRUCTURAL_LIMIT_REACHED' });
    }
    return this.mapNode(input.source, input.ast, input.semanticIndex, 1);
  }

  private mapNode(
    source: SourceExpression,
    node: LocalExpressionNode,
    semanticIndex: readonly LocalSemanticIndexEntry[],
    depth: number,
  ): StructuralMappingResult {
    if (depth > this.limits.maxStructuralDepth) return freeze({ status: 'NON_APPLICABLE', reason: 'STRUCTURAL_LIMIT_REACHED' });
    if (node.kind === 'SINGULARITY_SYMBOL') return freeze({ status: 'NON_APPLICABLE', reason: 'LABEL_ONLY_INDEXED_OPERAND' });

    const reference = sourceReference(source.sourceHash, node.canonical, node.span.start, node.span.endExclusive, 'ANALYZER_AST');
    const semanticKeys = mappingKeys(source, node, semanticIndex);
    if (semanticKeys.length > this.limits.maxSemanticKeysPerExpression || !semanticKeys.every(isFiniteKey)) {
      return freeze({ status: 'NON_APPLICABLE', reason: 'SEMANTIC_KEY_INVALID' });
    }

    if (node.kind === 'IDENTIFIER') {
      return freeze({ status: 'MAPPED', expression: freeze({ kind: 'IDENTIFIER', name: node.name, identity: identity('scalar', node.canonical, reference), semanticKeys }) });
    }
    if (node.kind === 'FINITE_LITERAL') {
      return freeze({ status: 'MAPPED', expression: freeze({ kind: 'FINITE_LITERAL', lexeme: node.lexeme, identity: identity('scalar', node.canonical, reference), semanticKeys }) });
    }
    if (node.kind === 'PARENTHESIZED') return this.mapNode(source, node.expression, semanticIndex, depth + 1);
    if (node.kind === 'UNARY') {
      const operand = this.mapNode(source, node.operand, semanticIndex, depth + 1);
      if (operand.status !== 'MAPPED') return operand;
      const canonical = node.operator === '-' ? `-${operand.expression.identity.canonical}` : operand.expression.identity.canonical;
      return freeze({ status: 'MAPPED', expression: freeze({
        kind: 'UNARY',
        operator: 'NEGATE',
        operand: operand.expression,
        identity: identity('scalar', canonical, reference),
        semanticKeys,
      }) });
    }
    const left = this.mapNode(source, node.left, semanticIndex, depth + 1);
    if (left.status !== 'MAPPED') return left;
    const right = this.mapNode(source, node.right, semanticIndex, depth + 1);
    if (right.status !== 'MAPPED') return right;
    const operator = ({ '+': 'ADD', '-': 'SUBTRACT', '*': 'MULTIPLY', '/': 'DIVIDE' } as const)[node.operator];
    return freeze({ status: 'MAPPED', expression: freeze({
      kind: 'BINARY',
      operator,
      left: left.expression,
      right: right.expression,
      identity: identity('scalar', renderBinary(operator, left.expression, right.expression), reference),
      semanticKeys,
    }) });
  }
}

type NodeReduction =
  | { readonly kind: 'REDUCED'; readonly expression: StructuralExpression }
  | { readonly kind: 'NON_APPLICABLE'; readonly reason: LocalStructuralNonApplicabilityReason; readonly expression: StructuralExpression }
  | { readonly kind: 'DEFERRED'; readonly requirement: LocalStructuralExternalRequirement; readonly expression: StructuralExpression };

export class StructuralReducer implements ILocalStructuralReducer {
  public constructor(private readonly limits: LocalStructuralReducerLimits) {}

  public reduce(input: { readonly source: SourceExpression; readonly input: StructuralExpression }): LocalStructuralReductionResult {
    const journal = new DerivationJournal(this.limits);
    const baseProvenance = provenance(input.source.sourceHash);
    if (input.input.identity.source.sourceHash !== input.source.sourceHash) {
      return this.nonApplicable(input.source, input.input, journal, baseProvenance, 'SEMANTIC_KEY_INVALID');
    }
    if (structuralDepth(input.input) > this.limits.maxStructuralDepth || !everyKeyIsFinite(input.input, this.limits)) {
      return this.nonApplicable(input.source, input.input, journal, baseProvenance, 'STRUCTURAL_LIMIT_REACHED');
    }
    if (!journal.add('L0', 'L0_PAYLOAD_PRESERVATION', RICIS_AUTHORITY, 'APPLIED', input.input, input.input, ['SOURCE_HASH_PRESERVED'], 'localReducer.l0.payloadPreserved')) {
      return this.nonApplicable(input.source, input.input, journal, baseProvenance, 'STRUCTURAL_LIMIT_REACHED');
    }

    const reduced = this.reduceNode(input.input, journal);
    if (reduced.kind === 'NON_APPLICABLE') return this.nonApplicable(input.source, reduced.expression, journal, baseProvenance, reduced.reason);
    if (reduced.kind === 'DEFERRED') return freeze({
      status: 'REQUIRES_CORE_OR_LEAN',
      source: input.source,
      requirement: reduced.requirement,
      preservedExpression: reduced.expression,
      derivation: journal.values(),
      provenance: baseProvenance,
    });
    return freeze({
      status: 'LOCAL_STRUCTURAL_ASSESSMENT',
      source: input.source,
      input: input.input,
      reduced: reduced.expression,
      derivation: journal.values(),
      provenance: baseProvenance,
    });
  }

  private nonApplicable(
    source: SourceExpression,
    expression: StructuralExpression,
    journal: DerivationJournal,
    baseProvenance: LocalStructuralProvenance,
    reason: LocalStructuralNonApplicabilityReason,
  ): LocalStructuralNonApplicable {
    journal.add('NON_DECISION', 'L0_PAYLOAD_PRESERVATION', RICIS_AUTHORITY, 'NOT_APPLICABLE', expression, expression, ['SOURCE_HASH_PRESERVED'], `localReducer.nonApplicable.${reason}`);
    return freeze({
      status: 'NON_APPLICABLE',
      source,
      reason,
      derivation: journal.values(),
      provenance: baseProvenance,
    });
  }

  private reduceNode(expression: StructuralExpression, journal: DerivationJournal): NodeReduction {
    if (expression.kind === 'IDENTIFIER' || expression.kind === 'FINITE_LITERAL') return freeze({ kind: 'REDUCED', expression });
    if (expression.kind === 'UNARY') {
      const operand = this.reduceNode(expression.operand, journal);
      if (operand.kind !== 'REDUCED') return operand;
      return freeze({ kind: 'REDUCED', expression: freeze({ ...expression, operand: operand.expression }) });
    }
    if (expression.kind === 'INDEXED_ZERO' || expression.kind === 'INDEXED_INFINITY') {
      const payload = this.reduceNode(expression.payload, journal);
      if (payload.kind !== 'REDUCED') return payload;
      return freeze({ kind: 'REDUCED', expression: makeIndexed(expression.kind, payload.expression) });
    }

    const left = this.reduceNode(expression.left, journal);
    if (left.kind !== 'REDUCED') return left;
    const right = this.reduceNode(expression.right, journal);
    if (right.kind !== 'REDUCED') return right;
    const rebuilt = makeBinary(expression.operator, left.expression, right.expression, expression.identity.source, expression.identity.typeTag);

    const singular = this.applySingularityFirst(rebuilt, journal);
    if (singular) return singular;
    return this.applyInheritedStructuralAlgebra(rebuilt, journal);
  }

  private applySingularityFirst(expression: StructuralBinaryExpression, journal: DerivationJournal): NodeReduction | undefined {
    const left = expression.left;
    const right = expression.right;
    if (expression.operator === 'DIVIDE' && left.kind === 'INDEXED_ZERO' && right.kind === 'INDEXED_ZERO') {
      return this.discloseIndexedQuotient(expression, left, right, 'A4_INDEXED_ZERO_OVER_INDEXED_ZERO', journal);
    }
    if (expression.operator === 'DIVIDE' && left.kind === 'INDEXED_INFINITY' && right.kind === 'INDEXED_INFINITY') {
      return this.discloseIndexedQuotient(expression, left, right, 'A5_INDEXED_INFINITY_OVER_INDEXED_INFINITY', journal);
    }
    if (expression.operator === 'MULTIPLY' && left.kind === 'INDEXED_ZERO' && right.kind === 'INDEXED_INFINITY') {
      journal.add('A1_A4_A10', 'A6_ZERO_TIMES_INFINITY_DEFERRED', RICIS_AUTHORITY, 'DEFERRED', expression, expression, ['PAYLOAD_CHILDREN_REDUCED'], 'localReducer.defer.a6');
      return freeze({ kind: 'DEFERRED', requirement: 'A6_ZERO_TIMES_INFINITY_DEFERRED', expression });
    }
    if (expression.operator === 'MULTIPLY' && left.kind === 'INDEXED_INFINITY' && right.kind === 'INDEXED_ZERO') {
      journal.add('A1_A4_A10', 'A6_ZERO_TIMES_INFINITY_DEFERRED', RICIS_AUTHORITY, 'DEFERRED', expression, expression, ['PAYLOAD_CHILDREN_REDUCED'], 'localReducer.defer.a6');
      return freeze({ kind: 'DEFERRED', requirement: 'A6_ZERO_TIMES_INFINITY_DEFERRED', expression });
    }
    if (expression.operator === 'SUBTRACT' && left.kind === 'INDEXED_INFINITY' && right.kind === 'INDEXED_INFINITY') {
      journal.add('A1_A4_A10', 'A7_INFINITY_MINUS_INFINITY_DEFERRED', RICIS_AUTHORITY, 'DEFERRED', expression, expression, ['PAYLOAD_CHILDREN_REDUCED'], 'localReducer.defer.a7');
      return freeze({ kind: 'DEFERRED', requirement: 'A7_INFINITY_MINUS_INFINITY_DEFERRED', expression });
    }
    if (expression.operator === 'MULTIPLY' && isOrdinaryZero(right)) return this.createIndexed(expression, left, 'INDEXED_ZERO', 'A10_FINITE_TIMES_ZERO', journal);
    if (expression.operator === 'MULTIPLY' && isOrdinaryZero(left)) return this.createIndexed(expression, right, 'INDEXED_ZERO', 'A10_FINITE_TIMES_ZERO', journal);
    if (expression.operator === 'DIVIDE' && isOrdinaryZero(right)) return this.createIndexed(expression, left, 'INDEXED_INFINITY', 'A1_FINITE_OVER_ZERO', journal);
    return undefined;
  }

  private discloseIndexedQuotient(
    input: StructuralBinaryExpression,
    left: Extract<StructuralExpression, { readonly kind: 'INDEXED_ZERO' | 'INDEXED_INFINITY' }>,
    right: Extract<StructuralExpression, { readonly kind: 'INDEXED_ZERO' | 'INDEXED_INFINITY' }>,
    rule: 'A4_INDEXED_ZERO_OVER_INDEXED_ZERO' | 'A5_INDEXED_INFINITY_OVER_INDEXED_INFINITY',
    journal: DerivationJournal,
  ): NodeReduction {
    if (left.payload.identity.typeTag !== right.payload.identity.typeTag) {
      return freeze({ kind: 'NON_APPLICABLE', reason: 'TYPE_TAG_MISMATCH', expression: input });
    }
    if (!everyKeyIsFinite(left.payload, this.limits) || !everyKeyIsFinite(right.payload, this.limits)) {
      return freeze({ kind: 'NON_APPLICABLE', reason: 'SEMANTIC_KEY_INVALID', expression: input });
    }
    const validation = journal.add('SP3', 'SP3_EXACT_TYPE_AND_FINITE_KEY_CHECK', RICIS_AUTHORITY, 'APPLIED', input, input, ['EXACT_TYPE_EQUALITY', 'FINITE_SEMANTIC_KEYS'], 'localReducer.sp3.indexedQuotient');
    if (!validation) return freeze({ kind: 'NON_APPLICABLE', reason: 'STRUCTURAL_LIMIT_REACHED', expression: input });
    const disclosed = makeBinary('DIVIDE', left.payload, right.payload, inheritedSource(input, input.identity.canonical), left.payload.identity.typeTag);
    const disclosedStep = journal.add('A1_A4_A10', rule, RICIS_AUTHORITY, 'APPLIED', input, disclosed, ['PAYLOAD_CHILDREN_REDUCED', 'EXACT_TYPE_EQUALITY', 'FINITE_SEMANTIC_KEYS'], rule === 'A4_INDEXED_ZERO_OVER_INDEXED_ZERO' ? 'localReducer.a4.disclosePayloadRatio' : 'localReducer.a5.disclosePayloadRatio');
    if (!disclosedStep) return freeze({ kind: 'NON_APPLICABLE', reason: 'STRUCTURAL_LIMIT_REACHED', expression: input });
    return this.applyInheritedStructuralAlgebra(disclosed, journal);
  }

  private createIndexed(
    input: StructuralBinaryExpression,
    payload: StructuralExpression,
    kind: 'INDEXED_ZERO' | 'INDEXED_INFINITY',
    rule: 'A10_FINITE_TIMES_ZERO' | 'A1_FINITE_OVER_ZERO',
    journal: DerivationJournal,
  ): NodeReduction {
    const indexed = makeIndexed(kind, payload);
    const applied = journal.add('A1_A4_A10', rule, RICIS_AUTHORITY, 'APPLIED', input, indexed, ['PAYLOAD_CHILDREN_REDUCED'], rule === 'A10_FINITE_TIMES_ZERO' ? 'localReducer.a10.createIndexedZero' : 'localReducer.a1.createIndexedInfinity');
    if (!applied) return freeze({ kind: 'NON_APPLICABLE', reason: 'STRUCTURAL_LIMIT_REACHED', expression: input });
    const indexedStep = journal.add('SP4', 'SP4_SOURCE_EXPRESSION_INDEX', RICIS_AUTHORITY, 'APPLIED', indexed, indexed, ['SP4_SOURCE_INDEX_AVAILABLE'], 'localReducer.sp4.retainPayloadIndex');
    if (!indexedStep) return freeze({ kind: 'NON_APPLICABLE', reason: 'STRUCTURAL_LIMIT_REACHED', expression: input });
    return freeze({ kind: 'REDUCED', expression: indexed });
  }

  private applyInheritedStructuralAlgebra(expression: StructuralBinaryExpression, journal: DerivationJournal): NodeReduction {
    if (expression.operator !== 'DIVIDE') return freeze({ kind: 'REDUCED', expression });
    if (isOrdinaryOne(expression.right)) {
      const applied = journal.add('SP2', 'SP2_DIVIDE_BY_UNIT', INHERITED_AUTHORITY, 'APPLIED', expression, expression.left, ['PAYLOAD_CHILDREN_REDUCED'], 'localReducer.sp2.divideByUnit');
      return applied
        ? freeze({ kind: 'REDUCED', expression: expression.left })
        : freeze({ kind: 'NON_APPLICABLE', reason: 'STRUCTURAL_LIMIT_REACHED', expression });
    }
    if (structuralEqual(expression.left, expression.right)) {
      const unit = makeFiniteLiteral('1', expression);
      const applied = journal.add('L1', 'L1_IDENTICAL_DIVISION', RICIS_AUTHORITY, 'APPLIED', expression, unit, ['EXACT_STRUCTURAL_IDENTITY'], 'localReducer.l1.identicalDivision');
      return applied
        ? freeze({ kind: 'REDUCED', expression: unit })
        : freeze({ kind: 'NON_APPLICABLE', reason: 'STRUCTURAL_LIMIT_REACHED', expression });
    }
    if (hasIndexedExpression(expression.left) || hasIndexedExpression(expression.right)) {
      journal.add('SP2', 'SP2_ASSOCIATIVE_FACTOR_CANCELLATION', INHERITED_AUTHORITY, 'NOT_APPLICABLE', expression, expression, ['PAYLOAD_CHILDREN_REDUCED'], 'localReducer.sp2.indexedFactorDeferred');
      return freeze({ kind: 'REDUCED', expression });
    }
    const numeratorFactors = [...flattenProduct(expression.left)];
    const denominatorFactors = [...flattenProduct(expression.right)];
    if (numeratorFactors.length > this.limits.maxFactorsPerProduct || denominatorFactors.length > this.limits.maxFactorsPerProduct) {
      return freeze({ kind: 'NON_APPLICABLE', reason: 'STRUCTURAL_LIMIT_REACHED', expression });
    }
    const remainingNumerator = [...numeratorFactors];
    const remainingDenominator = [...denominatorFactors];
    let cancelled = 0;
    for (let index = remainingDenominator.length - 1; index >= 0; index -= 1) {
      const match = remainingNumerator.findIndex(candidate => structuralEqual(candidate, remainingDenominator[index]!));
      if (match < 0) continue;
      remainingNumerator.splice(match, 1);
      remainingDenominator.splice(index, 1);
      cancelled += 1;
    }
    if (cancelled === 0) {
      journal.add('SP2', 'SP2_ASSOCIATIVE_FACTOR_CANCELLATION', INHERITED_AUTHORITY, 'NOT_APPLICABLE', expression, expression, ['PAYLOAD_CHILDREN_REDUCED'], 'localReducer.sp2.noExactFactorMatch');
      return freeze({ kind: 'REDUCED', expression });
    }
    const numerator = buildProduct(remainingNumerator, expression);
    const denominator = buildProduct(remainingDenominator, expression);
    const output = isOrdinaryOne(denominator)
      ? numerator
      : makeBinary('DIVIDE', numerator, denominator, inheritedSource(expression, expression.identity.canonical), expression.identity.typeTag);
    const applied = journal.add('SP2', 'SP2_ASSOCIATIVE_FACTOR_CANCELLATION', INHERITED_AUTHORITY, 'APPLIED', expression, output, ['PAYLOAD_CHILDREN_REDUCED', 'EXACT_STRUCTURAL_IDENTITY'], 'localReducer.sp2.exactFactorCancellation');
    return applied
      ? freeze({ kind: 'REDUCED', expression: output })
      : freeze({ kind: 'NON_APPLICABLE', reason: 'STRUCTURAL_LIMIT_REACHED', expression });
  }
}

export class StructuralReductionAdmissionPolicy implements IStructuralReductionAdmissionPolicy {
  public permits(failure: CoreExecutionFailure, origin: 'explicit_user_action'): boolean {
    if (origin !== 'explicit_user_action') return false;
    return failure.code === 'CORE_UNAVAILABLE' || failure.code === 'CORE_INFRASTRUCTURE_ERROR' || failure.code === 'CORE_INVALID_RESPONSE';
  }
}

function nonApplicableFromAnalysis(
  analysis: LocalAnalysisResult,
  reason: LocalStructuralNonApplicabilityReason,
): LocalStructuralNonApplicable {
  return freeze({
    status: 'NON_APPLICABLE',
    source: analysis.source,
    reason,
    derivation: frozenArray([]),
    provenance: provenance(analysis.source.sourceHash),
  });
}

export class LocalStructuralReductionApplicationService implements ILocalStructuralReductionApplicationService {
  public constructor(private readonly dependencies: LocalStructuralReducerDependencies) {}

  public async reduceExplicitly(
    command: LocalStructuralReductionCommand,
    cancellation: AbortSignal,
  ): Promise<LocalStructuralReductionResult> {
    if (!this.dependencies.admissionPolicy.permits(command.coreRecovery, command.origin)) {
      const notAdmitted: LocalStructuralNotAdmitted = freeze({
        status: 'NOT_ADMITTED',
        correlationId: command.correlationId,
        reason: 'CORE_RECOVERY_NOT_ADMITTED',
        provenance: freeze({ ...provenance('not-admitted'), sourceHash: 'not-admitted' as const }),
      });
      return notAdmitted;
    }
    const analysis = await this.dependencies.analysisApplication.analyzeExplicitly({
      rawText: command.rawText,
      origin: command.origin,
      requestedLocale: command.requestedLocale,
      correlationId: command.correlationId,
      recoveryContext: toLocalRecoveryContext(command.coreRecovery, 0),
    }, cancellation);
    if (analysis.status === 'INPUT_REJECTED' || analysis.status === 'RESOURCE_LIMITED' || analysis.status === 'UNSUPPORTED_EXPRESSION') {
      return nonApplicableFromAnalysis(analysis, 'ANALYZER_INPUT_REJECTED');
    }
    if (!analysis.ast) return nonApplicableFromAnalysis(analysis, 'ANALYZER_AST_MISSING');
    const mapped = this.dependencies.mapper.map({
      source: analysis.source,
      ast: analysis.ast,
      semanticIndex: analysis.semanticIndex,
    });
    if (mapped.status !== 'MAPPED') return nonApplicableFromAnalysis(analysis, mapped.reason);
    return this.dependencies.reducer.reduce({ source: analysis.source, input: mapped.expression });
  }
}
