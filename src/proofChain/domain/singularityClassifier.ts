/**
 * ISingularityClassifier — Single producer of SingularityClassId (DRY)
 * Reuses DependencyGraphAuditor.computeSP4Index as canonical source
 */
import type { ProblemNode } from '../../model/types';
import { DependencyGraphAuditor } from '../../model/dependencyGraph';
import type { SingularityClassId } from './types';

export interface ISingularityClassifier {
  classify(node: ProblemNode): SingularityClassId;
}

export class SingularityClassifier implements ISingularityClassifier {
  private readonly auditor = new DependencyGraphAuditor();

  classify(node: ProblemNode): SingularityClassId {
    // SP4 is canonical singularity class per spec; sole producer via this service
    return this.auditor.computeSP4Index(node);
  }
}
