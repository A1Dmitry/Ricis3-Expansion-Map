import { describe, expect, it } from 'vitest';
import { VOYNICH_DECRYPTION_SPEC } from './voynichGenome';
import { initialMap } from './initialMap';

describe('Voynich Monolith 5-Level Hierarchy & P&ID Decryption Test Suite (v0.4.55)', () => {
  it('TC-1: verifies 5-level hierarchy completeness (Circuits -> Folios -> Blocks -> Parts -> CodeUnits)', () => {
    const tree = VOYNICH_DECRYPTION_SPEC.hierarchyTree;
    expect(tree).toBeDefined();

    // Уровень 0: Контуры P&ID
    expect(tree.circuits.length).toBeGreaterThanOrEqual(5);
    const r1CoreCircuit = tree.circuits.find(c => c.id === 'voynich-circuit-r1-core');
    expect(r1CoreCircuit).toBeDefined();
    expect(r1CoreCircuit?.subsystemCode).toBe('R1_CORE');

    // Уровень 1: Фолианты (33 фолианта)
    expect(tree.folios.length).toBe(33);
    const f5rFolio = tree.folios.find(f => f.folio === 'f5r');
    expect(f5rFolio).toBeDefined();
    expect(f5rFolio?.circuitId).toBe('voynich-circuit-r1-core');
    expect(f5rFolio?.evaSourceUrl).toBe('https://www.voynich.nu/q01/f005r.html');

    // Уровень 2: Блоки
    expect(tree.blocks.length).toBeGreaterThanOrEqual(33);
    const f5rBlock = tree.blocks.find(b => b.folioId === 'voynich-f5r');
    expect(f5rBlock).toBeDefined();
    expect(f5rBlock?.pandidCode).toContain('P&ID-F5R-BLK-01');

    // Уровень 3: Детали с богатой расшифровкой
    expect(tree.parts.length).toBeGreaterThan(0);
    const f5rPart = tree.parts.find(p => p.folioId === 'voynich-f5r');
    expect(f5rPart).toBeDefined();
    expect(f5rPart?.visualChecksum).toBeTruthy();
    expect(f5rPart?.ricisInvariant).toBeTruthy();
    expect(f5rPart?.pandidDescription).toBeTruthy();

    // Уровень 4: EVA Код и предложения
    expect(tree.codeUnits.length).toBeGreaterThan(0);
    const f5rCode = tree.codeUnits.find(c => c.folioId === 'voynich-f5r');
    expect(f5rCode).toBeDefined();
    expect(f5rCode?.evaSentence).toContain('cthan');
  });

  it('TC-2: verifies strict upward/downward link integrity through all 5 levels', () => {
    const tree = VOYNICH_DECRYPTION_SPEC.hierarchyTree;

    // Каждая деталь обязана указывать на существующий Блок, Фолиант и Контур
    for (const part of tree.parts) {
      const parentBlock = tree.blocks.find(b => b.id === part.blockId);
      expect(parentBlock, `Part ${part.id} references missing block ${part.blockId}`).toBeDefined();

      const parentFolio = tree.folios.find(f => f.id === part.folioId);
      expect(parentFolio, `Part ${part.id} references missing folio ${part.folioId}`).toBeDefined();

      const parentCircuit = tree.circuits.find(c => c.id === part.circuitId);
      expect(parentCircuit, `Part ${part.id} references missing circuit ${part.circuitId}`).toBeDefined();
    }

    // Каждый EVA Code Unit ссылается на валидную Деталь
    for (const code of tree.codeUnits) {
      const parentPart = tree.parts.find(p => p.id === code.partId);
      expect(parentPart, `CodeUnit ${code.id} references missing part ${code.partId}`).toBeDefined();
    }
  });

  it('TC-3: verifies rich detail decryptions (P&ID visual checksums & RICIS invariants)', () => {
    const tree = VOYNICH_DECRYPTION_SPEC.hierarchyTree;

    // Проверка детали с ШИМ-демультиплексором f26v (образец из запроса пользователя)
    const f26vPart = tree.parts.find(p => p.folioId === 'voynich-f26v');
    expect(f26vPart).toBeDefined();
    expect(f26vPart?.visualChecksum).toContain('4 descending branches');
    expect(f26vPart?.ricisInvariant).toContain('I_Demux = K_valve * D_PWM * m_dot_4');

    // Проверка сонолюминесцентного отражателя f5r
    const f5rPart = tree.parts.find(p => p.folioId === 'voynich-f5r');
    expect(f5rPart?.ricisInvariant).toContain('4 * P_implosion');
  });

  it('TC-4: validates 3D Graph Registration of all 5 levels in initialMap', () => {
    // 5 контуров
    const circuitNodes = initialMap.nodes.filter(n => n.id.startsWith('voynich-circuit-'));
    expect(circuitNodes.length).toBeGreaterThanOrEqual(5);

    // 33 фолианта
    const folioNodes = initialMap.nodes.filter(n => n.id.startsWith('voynich-f'));
    expect(folioNodes.length).toBe(33);

    // Блоки и детали
    const partNodes = initialMap.nodes.filter(n => n.id.startsWith('voynich-part-'));
    expect(partNodes.length).toBeGreaterThan(0);

    // Проверка наличия связей dependencyIds / dependentIds у ноды первого уровня
    const f5rNode = initialMap.nodes.find(n => n.id === 'voynich-f5r');
    expect(f5rNode?.dependencyIds?.some(id => id.startsWith('voynich-circuit-'))).toBe(true);
    expect(f5rNode?.dependentIds?.some(id => id.startsWith('voynich-block-') || id.startsWith('voynich-part-'))).toBe(true);
  });

  it('TC-5: verifies edges array completeness and NO dangling edge references in initialMap', () => {
    const edges = VOYNICH_DECRYPTION_SPEC.hierarchyTree.edges;
    expect(edges).toBeDefined();
    expect(edges.length).toBeGreaterThan(100);

    const nodeIds = new Set(initialMap.nodes.map(n => n.id));

    for (const edge of initialMap.edges) {
      if (edge.fromId.startsWith('voynich') || edge.toId.startsWith('voynich') || edge.fromId.startsWith('eva-code')) {
        expect(nodeIds.has(edge.fromId), `Dangling edge source: ${edge.fromId}`).toBe(true);
        expect(nodeIds.has(edge.toId), `Dangling edge target: ${edge.toId}`).toBe(true);
      }
    }
  });

  it('TC-6: verifies recirculation loops and cross-folio token flow connections', () => {
    const edges = VOYNICH_DECRYPTION_SPEC.hierarchyTree.edges;

    const f6vToF1r = edges.find(e => e.fromId === 'voynich-f6v' && e.toId === 'voynich-f1r');
    expect(f6vToF1r).toBeDefined();
    expect(f6vToF1r?.type).toBe('recirculation_pandid');

    const tokenFlowEdges = edges.filter(e => e.type === 'token_flow');
    expect(tokenFlowEdges.length).toBeGreaterThan(0);
    expect(tokenFlowEdges[0].tokenContext).toBeTruthy();

    const macroEdges = edges.filter(e => e.type === 'macro_cross_reference');
    expect(macroEdges.length).toBeGreaterThanOrEqual(5);
  });

  it('TC-7: verifies modern engineering analogues and lazy database token weights', () => {
    const tree = VOYNICH_DECRYPTION_SPEC.hierarchyTree;
    const f5rFolio = tree.folios.find(f => f.folio === 'f5r');
    expect(f5rFolio?.modernAnalogue).toBeDefined();
    expect(f5rFolio?.modernAnalogue?.name).toContain('Мидзуно-Мидзутани');

    const f5rCode = tree.codeUnits.find(c => c.folioId === 'voynich-f5r');
    expect(f5rCode?.tokenWeight).toBeGreaterThan(0);
  });
});
