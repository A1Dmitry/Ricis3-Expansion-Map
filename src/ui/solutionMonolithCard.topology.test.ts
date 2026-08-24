/// <reference types="vitest/globals" />

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), 'utf8');

describe('CALC-EXP-01 G4A — read-only solution card topology', () => {
  it('CEUI01: NodeCardDetails composes the catalog card only through pure catalog view mapping', () => {
    const nodeCard = source('src/ui/NodeCardDetails.tsx');

    expect(nodeCard).toContain("from '../ricisSolutionCatalog'");
    expect(nodeCard).toContain('<SolutionMonolithCard view={solutionView} />');
    expect(nodeCard).toContain('getSolutionForNodeId(node.id)');
    expect(nodeCard).not.toContain('setNodeState(');
    expect(nodeCard).not.toContain('externalLean =');
  });

  it('CEUI02: the solution card is a read-only presentation and has no Core, agent, network or storage import', () => {
    const card = source('src/ui/SolutionMonolithCard.tsx');

    for (const forbidden of ['ricisCore', 'agentGateway', 'fetch(', 'axios', 'localStorage', 'sessionStorage', 'mapStore', 'useTerminalStore']) {
      expect(card).not.toContain(forbidden);
    }
    expect(card).toContain('immutable source');
    expect(card).toContain('Calculator launch не настроен');
  });

  it('CEUI03: Map3D delegates catalog green rendering to the single visual policy without mutating graph state', () => {
    const map3d = source('src/ui/Map3D.tsx');

    expect(map3d).toContain('presentMapNodeVisualStatus');
    expect(map3d).toContain('const color = visualStatus.sphereColor');
    expect(map3d).not.toContain('node.state =');
    expect(map3d).not.toContain('map.proofs[node.id] =');
  });
});
