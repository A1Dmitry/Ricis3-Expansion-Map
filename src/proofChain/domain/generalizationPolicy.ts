/**
 * IGeneralizationPolicy — On first instance success of class → create at most one open GENERALIZE task (idempotent)
 */
import type { SingularityClassId, GeneralizeTask, NodeId } from './types';

export interface IGeneralizationPolicy {
  onInstanceResolved(classId: SingularityClassId, instanceId: NodeId): { task: GeneralizeTask; created: boolean };
  getTask(classId: SingularityClassId): GeneralizeTask | undefined;
  resolveGeneral(classId: SingularityClassId): void;
  isGeneralResolved(classId: SingularityClassId): boolean;
  hasOpenGeneral(classId: SingularityClassId): boolean;
  // test seam: clear
  clear(): void;
}

export class InMemoryGeneralizationPolicy implements IGeneralizationPolicy {
  private readonly tasks = new Map<SingularityClassId, GeneralizeTask>();

  onInstanceResolved(classId: SingularityClassId, instanceId: NodeId): { task: GeneralizeTask; created: boolean } {
    const existing = this.tasks.get(classId);
    if (existing) {
      return { task: existing, created: false };
    }
    const task: GeneralizeTask = {
      id: `generalize-${classId}`,
      classId,
      status: 'open',
      sourceInstanceId: instanceId,
      createdAt: new Date().toISOString(),
    };
    this.tasks.set(classId, task);
    return { task, created: true };
  }

  getTask(classId: SingularityClassId): GeneralizeTask | undefined {
    return this.tasks.get(classId);
  }

  resolveGeneral(classId: SingularityClassId): void {
    const task = this.tasks.get(classId);
    if (!task) return;
    const resolved: GeneralizeTask = { ...task, status: 'resolved' as const };
    this.tasks.set(classId, resolved);
  }

  isGeneralResolved(classId: SingularityClassId): boolean {
    const t = this.tasks.get(classId);
    return t?.status === 'resolved';
  }

  hasOpenGeneral(classId: SingularityClassId): boolean {
    const t = this.tasks.get(classId);
    return t?.status === 'open';
  }

  clear(): void {
    this.tasks.clear();
  }

  // For testing: expose all
  getAll(): readonly GeneralizeTask[] {
    return Array.from(this.tasks.values());
  }
}
