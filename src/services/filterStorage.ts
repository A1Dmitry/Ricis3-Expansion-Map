export interface FilterStorageState {
  hiddenZones: string[];
  searchQuery: string;
  showOnlyDerivatives: boolean;
  selectedNodeId: string | null;
}

const STORAGE_KEY = 'ricis_active_filters_state';

export interface IFilterStorageService {
  save(state: FilterStorageState): boolean;
  load(): FilterStorageState | null;
  clear(): boolean;
}

class FilterStorageService implements IFilterStorageService {
  save(state: FilterStorageState): boolean {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      console.error('Failed to save filters state to localStorage', e);
      return false;
    }
  }

  load(): FilterStorageState | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return null;
      const parsed = JSON.parse(data);
      if (typeof parsed === 'object' && parsed !== null) {
        return {
          hiddenZones: Array.isArray(parsed.hiddenZones) ? parsed.hiddenZones : [],
          searchQuery: typeof parsed.searchQuery === 'string' ? parsed.searchQuery : '',
          showOnlyDerivatives: Boolean(parsed.showOnlyDerivatives),
          selectedNodeId: typeof parsed.selectedNodeId === 'string' ? parsed.selectedNodeId : null,
        };
      }
      return null;
    } catch (e) {
      console.warn('Failed to load filters state from localStorage', e);
      return null;
    }
  }

  clear(): boolean {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (e) {
      console.error('Failed to clear filters state from localStorage', e);
      return false;
    }
  }
}

export const filterStorageService: IFilterStorageService = new FilterStorageService();
