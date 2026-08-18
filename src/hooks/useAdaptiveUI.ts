import { useCallback, useEffect, useState } from 'react';
import type { UIElement } from '../domain/ui/uiElement.types';

export type { UIElement } from '../domain/ui/uiElement.types';

export interface AdaptiveRole {
  id: string;
  name: string;
  weights: Record<string, number>;
  clickCount: number;
  visibleOrder: string[];
}

export interface AdaptiveUIConfig {
  elements: UIElement[];
  storageKey?: string;
  maxVisible?: number;
  decayInterval?: number;
  decayFactor?: number;
  hysteresisDelta?: number;
}

/**
 * Pure function to calculate the new order of elements based on weights,
 * applying hysteresis to prevent jumping, and maintaining stability.
 */
export function calculateNewOrder(
  currentWeights: Record<string, number>,
  currentOrder: string[],
  allElements: UIElement[],
  maxVisible: number,
  hysteresisDelta: number
): string[] {
  // 1. Calculate total weight for relative proportions
  const totalWeight = Object.values(currentWeights).reduce((sum, w) => sum + w, 0);
  const getRelWeight = (id: string) => totalWeight > 0 ? (currentWeights[id] || 0) / totalWeight : 0;

  // 2. Ensure currentOrder has all elements (fallback for new elements)
  const missing = allElements.map(e => e.id).filter(id => !currentOrder.includes(id));
  const fullOrder = [...currentOrder, ...missing];

  // 3. Split into visible and hidden arrays
  let visibleIds = fullOrder.slice(0, maxVisible);
  let hiddenIds = fullOrder.slice(maxVisible);

  if (visibleIds.length === 0) return fullOrder;

  // 4. Find the weakest currently visible element
  let minVisId = visibleIds[0];
  let minVisWeight = getRelWeight(minVisId);
  for (const id of visibleIds) {
    if (getRelWeight(id) < minVisWeight) {
      minVisWeight = getRelWeight(id);
      minVisId = id;
    }
  }

  // 5. Sort hidden candidates by descending weight
  hiddenIds.sort((a, b) => getRelWeight(b) - getRelWeight(a));

  let layoutChanged = false;

  // 6. Hysteresis loop: Promote hidden elements if they beat the weakest visible + Δ
  for (let i = 0; i < hiddenIds.length; i++) {
    const candId = hiddenIds[i];
    const candWeight = getRelWeight(candId);

    if (candWeight > minVisWeight + hysteresisDelta) {
      // Swap occurs
      visibleIds = visibleIds.filter(id => id !== minVisId);
      visibleIds.push(candId);
      
      hiddenIds = hiddenIds.filter(id => id !== candId);
      hiddenIds.push(minVisId);
      layoutChanged = true;

      // Recalculate the new weakest visible element
      minVisId = visibleIds[0];
      minVisWeight = getRelWeight(minVisId);
      for (const id of visibleIds) {
        if (getRelWeight(id) < minVisWeight) {
          minVisWeight = getRelWeight(id);
          minVisId = id;
        }
      }
      // Re-sort hidden just in case
      hiddenIds.sort((a, b) => getRelWeight(b) - getRelWeight(a));
      i = -1; // restart check for new candidates against the new weakest
    }
  }

  // 7. Stabilize layout: if changed, sort visible by weight descending
  if (layoutChanged) {
    visibleIds.sort((a, b) => getRelWeight(b) - getRelWeight(a));
  }

  return [...visibleIds, ...hiddenIds];
}

const DEFAULT_ROLES: Record<string, AdaptiveRole> = {
  'default': {
    id: 'default',
    name: 'Общий профиль',
    weights: {},
    clickCount: 0,
    visibleOrder: []
  },
  'researcher': {
    id: 'researcher',
    name: 'Аналитик (Исследование)',
    weights: { 'search': 10, 'zones': 8, 'available': 5 },
    clickCount: 0,
    visibleOrder: []
  },
  'architect': {
    id: 'architect',
    name: 'Архитектор (Симуляция)',
    weights: { 'physics': 10, 'actions': 8 },
    clickCount: 0,
    visibleOrder: []
  }
};

/**
 * Adaptive UI Hook for managing contextual panel visibility.
 */
export function useAdaptiveUI(config: AdaptiveUIConfig) {
  const {
    elements,
    storageKey = 'ricis_adaptive_ui',
    maxVisible = 5,
    decayInterval = 15,
    decayFactor = 0.9,
    hysteresisDelta = 0.03
  } = config;

  const [state, setState] = useState(() => {
    // Attempt to load from localStorage
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.roles && parsed.currentRoleId) {
          // Backward compatibility check for elements added later
          const currentRole = parsed.roles[parsed.currentRoleId];
          if (currentRole && currentRole.visibleOrder.length < elements.length) {
             currentRole.visibleOrder = calculateNewOrder(currentRole.weights, currentRole.visibleOrder, elements, maxVisible, 0);
          }
          return parsed;
        }
      } catch (e) {
        console.warn('Failed to parse AdaptiveUI state', e);
      }
    }
    
    // Cold Start: Initialize default roles
    const initialRoles = JSON.parse(JSON.stringify(DEFAULT_ROLES));
    for (const key in initialRoles) {
      initialRoles[key].visibleOrder = calculateNewOrder(
        initialRoles[key].weights,
        elements.map(e => e.id),
        elements,
        maxVisible,
        0
      );
    }
    return { roles: initialRoles, currentRoleId: 'default' };
  });

  // Persist state
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state, storageKey]);

  // Handle interaction tracking
  const trackClick = useCallback((elementId: string) => {
    setState((prev: any) => {
      const role = prev.roles[prev.currentRoleId];
      if (!role) return prev;

      let newWeights = { ...role.weights };
      newWeights[elementId] = (newWeights[elementId] || 0) + 1;
      let newClickCount = role.clickCount + 1;

      // Apply Exponential Decay
      if (newClickCount % decayInterval === 0) {
        for (const k in newWeights) {
          newWeights[k] *= decayFactor;
        }
      }

      const newOrder = calculateNewOrder(
        newWeights,
        role.visibleOrder,
        elements,
        maxVisible,
        hysteresisDelta
      );

      return {
        ...prev,
        roles: {
          ...prev.roles,
          [role.id]: {
            ...role,
            weights: newWeights,
            clickCount: newClickCount,
            visibleOrder: newOrder
          }
        }
      };
    });
  }, [elements, maxVisible, decayInterval, decayFactor, hysteresisDelta]);

  // Profile Management
  const switchRole = useCallback((roleId: string) => {
    setState((prev: any) => prev.roles[roleId] ? { ...prev, currentRoleId: roleId } : prev);
  }, []);

  const createRole = useCallback((name: string, templateRoleId?: string) => {
    const id = 'role_' + Date.now();
    setState((prev: any) => {
      const template = templateRoleId ? prev.roles[templateRoleId] : null;
      const newRole = {
        id,
        name,
        weights: template ? { ...template.weights } : {},
        clickCount: 0,
        visibleOrder: template ? [...template.visibleOrder] : elements.map(e => e.id)
      };
      
      // Force recalculation for the new clone
      newRole.visibleOrder = calculateNewOrder(newRole.weights, newRole.visibleOrder, elements, maxVisible, 0);

      return {
        ...prev,
        roles: { ...prev.roles, [id]: newRole },
        currentRoleId: id
      };
    });
  }, [elements, maxVisible]);

  // Derived visible/hidden selectors based on the current active role
  const currentRole = state.roles[state.currentRoleId] as AdaptiveRole;
  
  const visibleElements = currentRole.visibleOrder
    .slice(0, maxVisible)
    .map((id: string) => elements.find((e: UIElement) => e.id === id)!)
    .filter(Boolean);

  const hiddenElements = currentRole.visibleOrder
    .slice(maxVisible)
    .map((id: string) => elements.find((e: UIElement) => e.id === id)!)
    .filter(Boolean);

  return {
    currentRole,
    roles: Object.values(state.roles) as AdaptiveRole[],
    visibleElements,
    hiddenElements,
    trackClick,
    switchRole,
    createRole
  };
}
