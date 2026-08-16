import { PhysicsParams, DEFAULT_PHYSICS_PARAMS } from '../model/physics';

const STORAGE_KEY = 'ricis_physics_custom_preset';

export interface IPhysicsStorageService {
  save(params: PhysicsParams): boolean;
  load(): PhysicsParams | null;
  clear(): boolean;
  hasCustom(): boolean;
}

class PhysicsStorageService implements IPhysicsStorageService {
  save(params: PhysicsParams): boolean {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(params));
      return true;
    } catch (e) {
      console.error('Failed to save physics parameters to localStorage', e);
      return false;
    }
  }

  load(): PhysicsParams | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return null;
      const parsed = JSON.parse(data);
      if (typeof parsed === 'object' && parsed !== null) {
        // Fallback with default keys for robustness
        return {
          ...DEFAULT_PHYSICS_PARAMS,
          ...parsed,
        };
      }
      return null;
    } catch (e) {
      console.warn('Failed to load physics parameters from localStorage', e);
      return null;
    }
  }

  clear(): boolean {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (e) {
      console.error('Failed to clear physics parameters from localStorage', e);
      return false;
    }
  }

  hasCustom(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEY) !== null;
    } catch {
      return false;
    }
  }
}

export const physicsStorageService: IPhysicsStorageService = new PhysicsStorageService();
