import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export interface StarFieldData {
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
}

/**
 * Генерация трехмерных координат, спектральных цветов и размеров звезд
 * для создания реалистичного параллакса звездного скопления.
 */
export function generateStarFieldData(
  numStars: number = 2500,
  minRadius: number = 1200,
  maxRadius: number = 2800
): StarFieldData {
  const positions = new Float32Array(numStars * 3);
  const colors = new Float32Array(numStars * 3);
  const sizes = new Float32Array(numStars);

  // Спектральные классы звезд: голубые O/B, белые A/F, желтые G, оранжевые K, красные M
  const spectralPalette = [
    { r: 0.75, g: 0.88, b: 1.0 }, // Голубой сверхгигант
    { r: 0.92, g: 0.95, b: 1.0 }, // Белая звезда
    { r: 1.0, g: 0.98, b: 0.88 }, // Желто-белая (Солнцеподобная)
    { r: 1.0, g: 0.82, b: 0.62 }, // Оранжевый карлик
    { r: 0.6, g: 0.75, b: 1.0 },  // Яркий циан
    { r: 0.9, g: 0.7, b: 1.0 },   // Фиолетовая звезда туманности
  ];

  for (let i = 0; i < numStars; i++) {
    // Случайное сферическое распределение
    const radius = minRadius + Math.random() * (maxRadius - minRadius);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i * 3 + 0] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);

    // Спектральный цвет
    const spectral = spectralPalette[Math.floor(Math.random() * spectralPalette.length)]!;
    const brightness = 0.5 + Math.random() * 0.5;
    colors[i * 3 + 0] = spectral.r * brightness;
    colors[i * 3 + 1] = spectral.g * brightness;
    colors[i * 3 + 2] = spectral.b * brightness;

    // Размер звезды
    sizes[i] = 1.2 + Math.random() * 3.5;
  }

  return { positions, colors, sizes };
}

/**
 * Создание холста с эквидистантной панорамной текстурой Вселенной:
 * - Глубокий космический вакуум с градиентами
 * - Многослойные эмиссионные туманности (магента, фиолетовый, глубокий циан, ультрамарин)
 * - Галактическая плоскость и звездная пыль
 */
export function createUniversePanoramaCanvas(
  width: number = 2048,
  height: number = 1024
): HTMLCanvasElement {
  const canvas = typeof document !== 'undefined'
    ? document.createElement('canvas')
    : ({ width, height, getContext: () => null } as unknown as HTMLCanvasElement);

  canvas.width = width;
  canvas.height = height;

  if (typeof document === 'undefined') {
    return canvas;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // 1. Базовый глубокий космос
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#03050b');
  bgGrad.addColorStop(0.3, '#050711');
  bgGrad.addColorStop(0.5, '#070a16');
  bgGrad.addColorStop(0.7, '#040710');
  bgGrad.addColorStop(1, '#020308');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Галактические туманности
  const nebulae = [
    { x: width * 0.25, y: height * 0.45, rx: width * 0.28, ry: height * 0.35, colorInner: 'rgba(88, 28, 135, 0.45)', colorMid: 'rgba(49, 46, 129, 0.25)', colorOuter: 'transparent' },
    { x: width * 0.72, y: height * 0.52, rx: width * 0.32, ry: height * 0.4, colorInner: 'rgba(14, 116, 144, 0.4)', colorMid: 'rgba(15, 23, 42, 0.2)', colorOuter: 'transparent' },
    { x: width * 0.5, y: height * 0.48, rx: width * 0.45, ry: height * 0.25, colorInner: 'rgba(192, 38, 211, 0.28)', colorMid: 'rgba(67, 56, 202, 0.15)', colorOuter: 'transparent' },
    { x: width * 0.85, y: height * 0.3, rx: width * 0.2, ry: height * 0.25, colorInner: 'rgba(16, 185, 129, 0.25)', colorMid: 'rgba(6, 78, 59, 0.12)', colorOuter: 'transparent' },
    { x: width * 0.12, y: height * 0.65, rx: width * 0.22, ry: height * 0.3, colorInner: 'rgba(236, 72, 153, 0.22)', colorMid: 'rgba(112, 26, 117, 0.1)', colorOuter: 'transparent' },
  ];

  nebulae.forEach((neb) => {
    ctx.save();
    ctx.translate(neb.x, neb.y);
    ctx.scale(neb.rx / neb.ry, 1);
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, neb.ry);
    grad.addColorStop(0, neb.colorInner);
    grad.addColorStop(0.5, neb.colorMid);
    grad.addColorStop(1, neb.colorOuter);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, neb.ry, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // 3. Фоновая россыпь звезд на холсте (микро-звезды)
  const starCount = 3500;
  for (let i = 0; i < starCount; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = Math.random() * 1.4;
    const alpha = 0.2 + Math.random() * 0.8;

    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Несколько ярких мерцающих звезд с гало
  const brightStars = 60;
  for (let i = 0; i < brightStars; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const r = 1.5 + Math.random() * 2.5;

    // Свечение ореола
    const halo = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
    halo.addColorStop(0, 'rgba(165, 243, 252, 0.9)');
    halo.addColorStop(0.4, 'rgba(96, 165, 250, 0.4)');
    halo.addColorStop(1, 'transparent');

    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(x, y, r * 4, 0, Math.PI * 2);
    ctx.fill();

    // Ядро
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas;
}

interface UniverseSkyboxProps {
  radius?: number;
  enableRotation?: boolean;
}

/**
 * Three.js React компонент панорамы Вселенной:
 * - Сферический Skydome с эквидистантной текстурой глубокого космоса.
 * - 3D Stars Buffer с параллаксом при вращении камеры.
 * - Плавное фоновое вращение.
 * - Изолирован от raycast и depth-buffer, гарантируя $L0$ непрерывность сцены.
 */
export const UniverseSkybox: React.FC<UniverseSkyboxProps> = ({
  radius = 3200,
  enableRotation = true,
}) => {
  const skydomeGroupRef = useRef<THREE.Group>(null);

  // Создаем и мемоизируем текстуру панорамы
  const panoramaTexture = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = createUniversePanoramaCanvas(2048, 1024);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }, []);

  // Создаем 3D-звездное облако
  const starData = useMemo(() => {
    return generateStarFieldData(2500, radius * 0.4, radius * 0.95);
  }, [radius]);

  const starGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(starData.positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(starData.colors, 3));
    return geo;
  }, [starData]);

  // Плавный медленный дрейф вселенной
  useFrame((_, delta) => {
    if (enableRotation && skydomeGroupRef.current) {
      skydomeGroupRef.current.rotation.y += delta * 0.006;
      skydomeGroupRef.current.rotation.x += delta * 0.0015;
    }
  });

  return (
    <group ref={skydomeGroupRef} raycast={() => null}>
      {/* 1. Сферическая космическая панорама (Skydome) */}
      {panoramaTexture && (
        <mesh renderOrder={-1000} raycast={() => null}>
          <sphereGeometry args={[radius, 64, 32]} />
          <meshBasicMaterial
            map={panoramaTexture}
            side={THREE.BackSide}
            depthWrite={false}
            depthTest={false}
            fog={false}
          />
        </mesh>
      )}

      {/* 2. 3D-звезды с параллаксом */}
      <points geometry={starGeometry} renderOrder={-999} raycast={() => null}>
        <pointsMaterial
          size={2.2}
          vertexColors
          transparent
          opacity={0.9}
          depthWrite={false}
          depthTest={false}
          sizeAttenuation
          fog={false}
        />
      </points>
    </group>
  );
};
