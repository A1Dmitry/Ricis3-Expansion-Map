import * as fs from 'node:fs';
import * as path from 'node:path';
import { createHash } from 'node:crypto';
import * as ts from 'typescript';

type DeclarationKind = 'class' | 'interface';
type MemberDescriptor = {
  kind: string;
  name: string;
  visibility: string;
  static: boolean;
  abstract: boolean;
  signature: string;
  references: string[];
};

type TypeDescriptor = {
  id: string;
  file: string;
  kind: DeclarationKind;
  name: string;
  extends: string[];
  implements: string[];
  members: MemberDescriptor[];
  childIds: string[];
  exactHash: string;
  shapeHash: string;
};

type Candidate = {
  left: string;
  right: string;
  leftShapeHash: string;
  rightShapeHash: string;
  similarity: number;
  sharedMembers: string[];
  decision: 'exact_match' | 'overlap_match' | 'composition_preferred' | 'existing_contract' | 'no_match';
  rationale: string;
};

export type StructuralHashReport = {
  generatedAt: string;
  root: string;
  descriptors: TypeDescriptor[];
  candidates: Candidate[];
};

const declarationByName = new Map<string, ts.ClassDeclaration | ts.InterfaceDeclaration>();
const sourceFileByName = new Map<string, ts.SourceFile>();
const descriptorByName = new Map<string, TypeDescriptor>();

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 16);
}

const printer = ts.createPrinter({ removeComments: true });

function safeNodeText(node: ts.Node | undefined, sourceFile?: ts.SourceFile): string {
  if (!node) return '';
  if (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node)) return node.text;
  if (sourceFile) return printer.printNode(ts.EmitHint.Unspecified, node, sourceFile).replace(/\s+/g, ' ').trim();
  return ts.SyntaxKind[node.kind];
}

function normalizedType(node: ts.Node | undefined, sourceFile?: ts.SourceFile): string {
  return safeNodeText(node, sourceFile);
}

function declarationName(node: ts.ClassDeclaration | ts.InterfaceDeclaration): string {
  return node.name?.text ?? '<anonymous>';
}

function modifiersOf(node: ts.Node): readonly ts.ModifierLike[] {
  return ts.canHaveModifiers(node) ? (ts.getModifiers(node) ?? []) : [];
}

function visibilityOf(node: ts.Node): string {
  const modifiers = modifiersOf(node);
  if (modifiers.some(modifier => modifier.kind === ts.SyntaxKind.PrivateKeyword)) return 'private';
  if (modifiers.some(modifier => modifier.kind === ts.SyntaxKind.ProtectedKeyword)) return 'protected';
  return 'public';
}

function hasModifier(node: ts.Node, kind: ts.SyntaxKind): boolean {
  return modifiersOf(node).some(modifier => modifier.kind === kind);
}

function referencedLocalNames(node: ts.Node): string[] {
  const names = new Set<string>();
  const visit = (child: ts.Node): void => {
    if (ts.isTypeReferenceNode(child) && ts.isIdentifier(child.typeName) && declarationByName.has(child.typeName.text)) {
      names.add(child.typeName.text);
    }
    if (ts.isExpressionWithTypeArguments(child) && ts.isIdentifier(child.expression) && declarationByName.has(child.expression.text)) {
      names.add(child.expression.text);
    }
    ts.forEachChild(child, visit);
  };
  ts.forEachChild(node, visit);
  return [...names].sort();
}

function memberDescriptor(member: ts.ClassElement | ts.TypeElement, sourceFile: ts.SourceFile): MemberDescriptor | null {
  if (ts.isPropertyDeclaration(member) || ts.isPropertySignature(member)) {
    const name = safeNodeText(member.name, sourceFile) || '<computed>';
    return {
      kind: 'property',
      name,
      visibility: ts.isPropertyDeclaration(member) ? visibilityOf(member) : 'public',
      static: ts.isPropertyDeclaration(member) && hasModifier(member, ts.SyntaxKind.StaticKeyword),
      abstract: ts.isPropertyDeclaration(member) && hasModifier(member, ts.SyntaxKind.AbstractKeyword),
      signature: `${name}:${normalizedType(member.type, sourceFile)}`,
      references: referencedLocalNames(member),
    };
  }
  if (ts.isMethodDeclaration(member) || ts.isMethodSignature(member)) {
    const name = safeNodeText(member.name, sourceFile) || '<computed>';
    const parameters = member.parameters.map(parameter => normalizedType(parameter.type, sourceFile)).join(',');
    return {
      kind: 'method',
      name,
      visibility: ts.isMethodDeclaration(member) ? visibilityOf(member) : 'public',
      static: ts.isMethodDeclaration(member) && hasModifier(member, ts.SyntaxKind.StaticKeyword),
      abstract: ts.isMethodDeclaration(member) && hasModifier(member, ts.SyntaxKind.AbstractKeyword),
      signature: `${name}(${parameters}):${normalizedType(member.type)}`,
      references: referencedLocalNames(member),
    };
  }
  if (ts.isConstructorDeclaration(member)) {
    return {
      kind: 'constructor',
      name: 'constructor',
      visibility: visibilityOf(member),
      static: false,
      abstract: false,
      signature: `constructor(${member.parameters.map(parameter => normalizedType(parameter.type, sourceFile)).join(',')})`,
      references: referencedLocalNames(member),
    };
  }
  return null;
}

function declarationMembers(node: ts.ClassDeclaration | ts.InterfaceDeclaration, sourceFile: ts.SourceFile): MemberDescriptor[] {
  return node.members
    .map(member => memberDescriptor(member, sourceFile))
    .filter((member): member is MemberDescriptor => member !== null)
    .sort((a, b) => `${a.kind}:${a.name}`.localeCompare(`${b.kind}:${b.name}`));
}

function declarationBases(node: ts.ClassDeclaration | ts.InterfaceDeclaration, sourceFile: ts.SourceFile): { extends: string[]; implements: string[] } {
  const heritage = node.heritageClauses ?? [];
  const extendsClause = heritage.find(clause => clause.token === ts.SyntaxKind.ExtendsKeyword);
  const implementsClause = heritage.find(clause => clause.token === ts.SyntaxKind.ImplementsKeyword);
  return {
    extends: (extendsClause?.types ?? []).map(type => normalizedType(type, sourceFile)).sort(),
    implements: (implementsClause?.types ?? []).map(type => normalizedType(type, sourceFile)).sort(),
  };
}

function collectFiles(root: string): string[] {
  const files: string[] = [];
  const visit = (directory: string): void => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) continue;
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(fullPath);
      else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\.(ts|tsx)$/.test(entry.name)) files.push(fullPath);
    }
  };
  visit(root);
  return files.sort();
}

function buildReport(root: string): StructuralHashReport {
  const files = collectFiles(root);
  const program = ts.createProgram(files, {
    target: ts.ScriptTarget.ES2022,
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    allowJs: true,
  });

  for (const sourceFile of program.getSourceFiles()) {
    if (sourceFile.isDeclarationFile || !sourceFile.fileName.startsWith(root)) continue;
    ts.forEachChild(sourceFile, node => {
      if ((ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node)) && node.name) {
        declarationByName.set(node.name.text, node);
        sourceFileByName.set(node.name.text, sourceFile);
      }
    });
  }

  for (const [name, node] of declarationByName) {
    const sourceFile = sourceFileByName.get(name);
    if (!sourceFile) continue;
    const bases = declarationBases(node, sourceFile);
    const members = declarationMembers(node, sourceFile);
    const id = path.relative(root, sourceFile.fileName).replaceAll(path.sep, '/') + `#${name}`;
    descriptorByName.set(name, {
      id,
      file: path.relative(root, sourceFile.fileName).replaceAll(path.sep, '/'),
      kind: ts.isClassDeclaration(node) ? 'class' : 'interface',
      name,
      extends: bases.extends,
      implements: bases.implements,
      members,
      childIds: [],
      exactHash: '',
      shapeHash: '',
    });
  }

  const visiting = new Set<string>();
  const resolved = new Map<string, { exact: string; shape: string }>();
  const resolve = (name: string): { exact: string; shape: string } => {
    const cached = resolved.get(name);
    if (cached) return cached;
    const descriptor = descriptorByName.get(name);
    if (!descriptor || visiting.has(name)) return { exact: `cycle:${name}`, shape: `cycle:${name}` };
    visiting.add(name);
    const childNames = [...new Set([
      ...descriptor.extends,
      ...descriptor.implements,
      ...descriptor.members.flatMap(member => member.references),
    ])].filter(child => descriptorByName.has(child)).sort();
    descriptor.childIds = childNames.map(child => descriptorByName.get(child)?.id ?? child);
    const childHashes = childNames.map(child => resolve(child));
    const memberPayload = descriptor.members.map(member => ({
      kind: member.kind,
      name: member.name,
      visibility: member.visibility,
      static: member.static,
      abstract: member.abstract,
      signature: member.signature,
      references: member.references,
    }));
    const exactPayload = JSON.stringify({
      kind: descriptor.kind,
      extends: descriptor.extends,
      implements: descriptor.implements,
      members: memberPayload,
      childHashes: childHashes.map(child => child.exact),
    });
    const shapePayload = JSON.stringify({
      kind: descriptor.kind,
      members: memberPayload.map(member => ({ ...member, references: member.references.length })),
      childShapes: childHashes.map(child => child.shape),
    });
    const result = { exact: hash(exactPayload), shape: hash(shapePayload) };
    descriptor.exactHash = result.exact;
    descriptor.shapeHash = result.shape;
    resolved.set(name, result);
    visiting.delete(name);
    return result;
  };

  for (const name of descriptorByName.keys()) resolve(name);

  const descriptors = [...descriptorByName.values()].sort((a, b) => a.id.localeCompare(b.id));
  const candidates: Candidate[] = [];
  for (let i = 0; i < descriptors.length; i += 1) {
    for (let j = i + 1; j < descriptors.length; j += 1) {
      const left = descriptors[i];
      const right = descriptors[j];
      const leftMembers = new Set(left.members.map(member => `${member.kind}:${member.name}:${member.signature}`));
      const rightMembers = new Set(right.members.map(member => `${member.kind}:${member.name}:${member.signature}`));
      const sharedMembers = [...leftMembers].filter(member => rightMembers.has(member)).sort();
      const unionSize = new Set([...leftMembers, ...rightMembers]).size;
      const similarity = unionSize === 0 ? 0 : Number((sharedMembers.length / unionSize).toFixed(4));
      if (similarity < 0.25 && left.shapeHash !== right.shapeHash) continue;
      const sameRole = left.file.includes('/services/') === right.file.includes('/services/');
      let decision: Candidate['decision'] = 'no_match';
      let rationale = 'No sufficiently shared structural invariant.';
      const isExistingContract =
        (left.kind === 'interface' && right.implements.some(base => base.split('<')[0] === left.name)) ||
        (right.kind === 'interface' && left.implements.some(base => base.split('<')[0] === right.name)) ||
        (left.kind === 'interface' && right.extends.some(base => base.split('<')[0] === left.name)) ||
        (right.kind === 'interface' && left.extends.some(base => base.split('<')[0] === right.name));
      if (isExistingContract) {
        decision = 'existing_contract';
        rationale = 'Existing interface/implementation or extension relationship; preserve the port and adapter boundary.';
      } else if (left.exactHash === right.exactHash) {
        decision = 'exact_match';
        rationale = 'Exact canonical structure match; inspect responsibility before consolidation.';
      } else if (similarity >= 0.6 && sameRole) {
        decision = 'overlap_match';
        rationale = 'Shared structural core in a compatible layer; candidate for Extract Superclass/Pull Up.';
      } else if (similarity >= 0.25) {
        decision = 'composition_preferred';
        rationale = 'Partial overlap without a safe shared inheritance boundary; prefer interface, Value Object, or delegation.';
      }
      candidates.push({
        left: left.id,
        right: right.id,
        leftShapeHash: left.shapeHash,
        rightShapeHash: right.shapeHash,
        similarity,
        sharedMembers,
        decision,
        rationale,
      });
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    root,
    descriptors,
    candidates: candidates.sort((a, b) => b.similarity - a.similarity || a.left.localeCompare(b.left)),
  };
}

const root = path.resolve(process.argv[2] ?? 'src');
const output = path.resolve(process.argv[3] ?? 'artifacts/architecture/structural-hash-report.json');
const report = buildReport(root);
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`Structural hash report written to ${output}`);
console.log(`Descriptors: ${report.descriptors.length}; candidates: ${report.candidates.length}`);
