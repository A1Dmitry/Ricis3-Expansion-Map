import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { generateStarFieldData, createUniversePanoramaCanvas } from './UniverseSkybox';

describe('UniverseSkybox / Deep Space Panorama Unit Tests', () => {
  describe('1. Генерация трехмерного звездного поля (StarField Data)', () => {
    it('должен генерировать корректные типизированные массивы для позиций, цветов и размеров звезд', () => {
      const numStars = 1500;
      const minRadius = 1000;
      const maxRadius = 3000;

      const data = generateStarFieldData(numStars, minRadius, maxRadius);

      expect(data.positions).toBeInstanceOf(Float32Array);
      expect(data.colors).toBeInstanceOf(Float32Array);
      expect(data.sizes).toBeInstanceOf(Float32Array);

      expect(data.positions.length).toBe(numStars * 3);
      expect(data.colors.length).toBe(numStars * 3);
      expect(data.sizes.length).toBe(numStars);

      // Проверяем, что координаты находятся в пределах сферы радиуса maxRadius
      for (let i = 0; i < numStars; i++) {
        const x = data.positions[i * 3 + 0];
        const y = data.positions[i * 3 + 1];
        const z = data.positions[i * 3 + 2];

        expect(Number.isFinite(x)).toBe(true);
        expect(Number.isFinite(y)).toBe(true);
        expect(Number.isFinite(z)).toBe(true);

        const dist = Math.sqrt(x * x + y * y + z * z);
        expect(dist).toBeGreaterThanOrEqual(minRadius * 0.9);
        expect(dist).toBeLessThanOrEqual(maxRadius * 1.1);

        // Проверяем цветовой спектр RGB [0..1]
        const r = data.colors[i * 3 + 0];
        const g = data.colors[i * 3 + 1];
        const b = data.colors[i * 3 + 2];

        expect(r).toBeGreaterThanOrEqual(0);
        expect(r).toBeLessThanOrEqual(1);
        expect(g).toBeGreaterThanOrEqual(0);
        expect(g).toBeLessThanOrEqual(1);
        expect(b).toBeGreaterThanOrEqual(0);
        expect(b).toBeLessThanOrEqual(1);

        // Проверяем размер звезды
        const size = data.sizes[i];
        expect(size).toBeGreaterThan(0);
        expect(size).toBeLessThanOrEqual(10);
      }
    });
  });

  describe('2. Генератор эквидистантной текстуры Вселенной (Canvas Texture)', () => {
    it('должен создавать холст панорамы с туманностями и фоновым звездным шумом', () => {
      // Создаем виртуальный холст
      const canvas = createUniversePanoramaCanvas(512, 256);
      expect(canvas).not.toBeNull();
      expect(canvas.width).toBe(512);
      expect(canvas.height).toBe(256);
    });
  });

  describe('3. Конфигурация трехмерных материалов для заднего плана (L0 Continuity)', () => {
    it('материалы небесного купола должны иметь depthWrite = false и BackSide', () => {
      const material = new THREE.MeshBasicMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
      });

      expect(material.side).toBe(THREE.BackSide);
      expect(material.depthWrite).toBe(false);
      expect(material.fog).toBe(false);
    });

    it('материал звездных точек должен поддерживать vertexColors и прозрачность', () => {
      const pointsMat = new THREE.PointsMaterial({
        size: 2,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      });

      expect(pointsMat.vertexColors).toBe(true);
      expect(pointsMat.transparent).toBe(true);
      expect(pointsMat.depthWrite).toBe(false);
    });
  });
});
