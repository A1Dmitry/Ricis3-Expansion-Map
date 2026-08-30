import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UrlShareService } from '../services/UrlShareService';
import { AVAILABLE_GEMINI_MODELS } from '../model/modelPool.types';

describe('Deep Linking & Share Service Tests', () => {
  beforeEach(() => {
    // Сброс URL
    window.history.replaceState({}, '', 'http://localhost:3000/');
  });

  it('должен корректно генерировать URL для задачи на карте', () => {
    const url = UrlShareService.generateShareUrl({ nodeId: 'P_VS_NP' });
    expect(url).toContain('node=P_VS_NP');
  });

  it('должен корректно генерировать URL для формулы в Sandbox', () => {
    const url = UrlShareService.generateShareUrl({ sandboxExpr: '0_3*inf_4', mode: 'theorem' });
    expect(url).toContain('sandbox=0_3*inf_4');
    expect(url).toContain('mode=theorem');
  });

  it('должен генерировать ссылку Roadmap с явной корневой целью', () => {
    const url = UrlShareService.generateShareUrl({ roadmap: true, rootNodeId: 'core-agi-target' });
    expect(url).toContain('view=roadmap');
    expect(url).toContain('root=core-agi-target');
  });

  it('должен парсить параметры при инициализации', () => {
    window.history.replaceState({}, '', 'http://localhost:3000/?node=NAV_STOKES&mode=lean4&view=roadmap&root=core-agi-target');
    const params = UrlShareService.parseInitialParams();
    expect(params.initialNodeId).toBe('NAV_STOKES');
    expect(params.initialMode).toBe('lean4');
    expect(params.initialRoadmap).toBe(true);
    expect(params.initialRootNodeId).toBe('core-agi-target');
    expect(params.initialKinematic).toBe(false);
    expect(params.initialKinematic).toBe(false);
  });

  it('должен обновлять URL в строке браузера без перезагрузки', () => {
    UrlShareService.updateBrowserUrl({ nodeId: 'EULER_SINGULARITY' });
    const urlParams = new URLSearchParams(window.location.search);
    expect(urlParams.get('node')).toBe('EULER_SINGULARITY');

    UrlShareService.updateBrowserUrl({ nodeId: null, roadmap: true, rootNodeId: 'core-agi-target' });
    const updatedParams = new URLSearchParams(window.location.search);
    expect(updatedParams.get('node')).toBeNull();
    expect(updatedParams.get('view')).toBe('roadmap');
    expect(updatedParams.get('root')).toBe('core-agi-target');

    UrlShareService.updateBrowserUrl({ roadmap: false, rootNodeId: null });
    const clearedParams = new URLSearchParams(window.location.search);
    expect(clearedParams.get('view')).toBeNull();
    expect(clearedParams.get('root')).toBeNull();
  });
});

describe('Model Pool Configuration Tests', () => {
  it('должен содержать Gemini 3.7 Flash как модель по умолчанию', () => {
    const defaultModel = AVAILABLE_GEMINI_MODELS.find(m => m.isDefault);
    expect(defaultModel).toBeDefined();
    expect(defaultModel?.id).toBe('gemini-3.7-flash');
  });

  it('должен включать флагманские модели 3.5, 3.1 Pro и 2.5', () => {
    const modelIds = AVAILABLE_GEMINI_MODELS.map(m => m.id);
    expect(modelIds).toContain('gemini-3.7-flash');
    expect(modelIds).toContain('gemini-3.5-flash');
    expect(modelIds).toContain('gemini-3.1-pro-preview');
    expect(modelIds).toContain('gemini-2.5-pro');
  });
});
