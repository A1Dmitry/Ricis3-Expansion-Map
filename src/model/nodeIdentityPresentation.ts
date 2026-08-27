import type { ProblemNode } from './types';
import { base64FromSha128Hex, normalizeCanonicalPath } from './nodeIdentityMigration';

export interface NodeIdentityPresentation {
  readonly hexId: string;
  readonly base64Key: string;
  readonly canonicalPath: string;
}

export function getNodeIdentityPresentation(node: ProblemNode): NodeIdentityPresentation {
  const canonicalPath = node.canonicalPath ?? normalizeCanonicalPath(`/${node.title}`);
  const base64Key = /^[0-9a-f]{32}$/i.test(node.id) ? base64FromSha128Hex(node.id) : node.id;
  return { hexId: node.id, base64Key, canonicalPath };
}
