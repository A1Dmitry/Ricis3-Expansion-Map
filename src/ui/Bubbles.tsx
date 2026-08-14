
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
}

/** Пузырь зоны: реалистичный мыльный пузырь с иридесценцией тонкой плёнки, белыми бликами, покачиванием плёнки и прозрачным ядром. */
export function ZoneBubble({
  position,
  color,
  radius,
}: {
  position: [number, number, number];
  color: string;
  radius: number;
}) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const currentR = useRef(radius);

  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(color) },
      uTime: { value: 0 },
      uOpacity: { value: 0.15 },
    }),
    [color]
  );

  useFrame((_, delta) => {
    currentR.current += (radius - currentR.current) * Math.min(1, delta * 2.8);
    if (meshRef.current) meshRef.current.scale.setScalar(currentR.current);
    if (matRef.current) {
      matRef.current.uniforms.uTime.value += delta;
      matRef.current.uniforms.uColor.value.set(color);
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      scale={radius}
      // Зоны не должны перехватывать клики по узлам
      raycast={() => null}
    >
      <sphereGeometry args={[1, 64, 64]} />
      <shaderMaterial
        ref={matRef}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.NormalBlending}
        uniforms={uniforms}
        vertexShader={`
          varying vec3 vNormal;
          varying vec3 vView;
          varying vec3 vWorldPosition;
          varying vec3 vLocalPosition;
          uniform float uTime;

          void main() {
            vNormal = normalize(normalMatrix * normal);
            vLocalPosition = position;

            // Плавное физическое покачивание мыльной плёнки (поверхностное натяжение)
            float wave = sin(position.x * 2.8 + uTime * 1.4)
                       * cos(position.y * 3.2 + uTime * 1.1)
                       * sin(position.z * 2.8 + uTime * 1.6);
            vec3 newPos = position + normal * (wave * 0.015);

            vec4 worldPos = modelMatrix * vec4(newPos, 1.0);
            vWorldPosition = worldPos.xyz;

            vec4 mv = modelViewMatrix * vec4(newPos, 1.0);
            vView = normalize(-mv.xyz);

            gl_Position = projectionMatrix * mv;
          }
        `}
        fragmentShader={`
          uniform vec3 uColor;
          uniform float uTime;
          uniform float uOpacity;

          varying vec3 vNormal;
          varying vec3 vView;
          varying vec3 vWorldPosition;
          varying vec3 vLocalPosition;

          // Перламутровая палитра иридесценции мыльной плёнки
          vec3 rainbow(float t) {
            return 0.5 + 0.5 * cos(6.28318 * (t + vec3(0.0, 0.33, 0.67)));
          }

          void main() {
            vec3 n = normalize(vNormal);
            vec3 v = normalize(vView);

            float ndotv = abs(dot(n, v)); // abs для корректного отображения обеих сторон DoubleSide
            float fresnel = pow(1.0 - ndotv, 2.4);

            // Разводы тонкой мыльной плёнки (движущаяся маслянистая мыльная эмульсия)
            float filmPattern = fresnel * 2.8 + vLocalPosition.y * 1.8 + sin(vLocalPosition.x * 3.0 + uTime * 0.5) * 0.5;
            vec3 iridColor = rainbow(filmPattern);

            // Двойной стеклянный блик от внешних источников света
            vec3 light1 = normalize(vec3(0.7, 0.9, 0.6));
            vec3 light2 = normalize(vec3(-0.8, -0.4, 0.5));

            vec3 half1 = normalize(light1 + v);
            vec3 half2 = normalize(light2 + v);

            // Острые зеркальные пятна
            float spec1 = pow(max(dot(n, half1), 0.0), 140.0); // Главенствующий яркий блик
            float spec2 = pow(max(dot(n, half2), 0.0), 90.0);  // Вторичный блик отражения

            // Серповидный отблеск вдоль изгиба пузыря
            float rimArc = pow(fresnel, 4.5) * (0.6 + 0.4 * sin(vLocalPosition.y * 12.0 + uTime * 0.8));

            vec3 specHighlight = vec3(1.0) * (spec1 * 3.0 + spec2 * 1.5 + rimArc * 1.1);

            // Смешивание фундаментального цвета области науки с перламутровой радугой
            vec3 filmBase = mix(uColor, iridColor, 0.55);

            // Итоговый цвет: прозрачный в центре, с тонкой радужной окаемкой и белыми стеклянными бликами
            vec3 finalColor = filmBase * (0.12 + fresnel * 1.1) + specHighlight;

            // Прозрачность: ядро почти абсолютно прозрачное (0.02 - 0.05), чтобы узлы внутри были четко видны,
            // а ободок и блики дают четкие контуры мыльного пузыря.
            float alpha = clamp(0.03 + fresnel * 0.60 + spec1 * 0.95 + spec2 * 0.70, 0.0, 0.82);

            gl_FragColor = vec4(finalColor, alpha);
          }
        `}
      />
    </mesh>
  );
}

/** Подпись рядом с узлом (billboard sprite, без дополнительных зависимостей). */

export function ZoneLabel({
  position,
  text,
  radius,
  color,
}: {
  position: [number, number, number];
  text: string;
  radius: number;
  color: string;
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    const w = 2048;
    const h = 512;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);
    ctx.clearRect(0, 0, w, h);
    
    ctx.font = 'bold 160px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const metrics = ctx.measureText(text);
    const boxW = Math.min(w - 32, metrics.width + 160);
    const boxH = 260;
    
    const bx = (w - boxW) / 2;
    const by = (h - boxH) / 2;
    
    // Convert hex color to rgba for stroke
    let strokeRgba = 'rgba(255, 255, 255, 0.4)';
    if (color.startsWith('#')) {
       const r = parseInt(color.slice(1, 3), 16);
       const g = parseInt(color.slice(3, 5), 16);
       const b = parseInt(color.slice(5, 7), 16);
       strokeRgba = `rgba(${r}, ${g}, ${b}, 0.8)`;
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.strokeStyle = strokeRgba;
    ctx.lineWidth = 12;
    const r = 40;
    drawRoundedRect(ctx, bx, by, boxW, boxH, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // shape rendered
    
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, w / 2, h / 2 + 10);
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [text, color]);

  // Place it near the top boundary of the zone bubble
  return (
    <sprite position={[position[0], position[1] + radius + 15, position[2]]} scale={[40, 10, 1]}>
      <spriteMaterial map={texture} transparent depthTest={false} depthWrite={false} />
    </sprite>
  );
}

export function NodeLabel({
  position,
  text,
  subtitle,
  valueText,
  offsetY = 0.55,
}: {
  position: [number, number, number];
  text: string;
  subtitle?: string;
  valueText?: string;
  offsetY?: number;
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    // Increase canvas size to accommodate 3x larger text
    const w = 2048;
    const h = subtitle || valueText ? 512 : 384;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);
    ctx.clearRect(0, 0, w, h);
    
    // 3x larger text (from 52px to 156px)
    ctx.font = 'bold 156px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const label = text.length > 42 ? text.slice(0, 40) + '…' : text;
    const sub = subtitle ? (subtitle.length > 50 ? subtitle.slice(0, 48) + '…' : subtitle) : '';
    const val = valueText ? valueText : '';
    
    const metrics1 = ctx.measureText(label);
    
    ctx.font = 'normal 72px Inter, system-ui, sans-serif';
    const metrics2 = sub ? ctx.measureText(sub) : { width: 0 };
    
    ctx.font = 'bold 84px Inter, system-ui, sans-serif';
    const metrics3 = val ? ctx.measureText(val) : { width: 0 };
    
    const padX = 96;
    const boxW = Math.min(w - 16, Math.max(metrics1.width, metrics2.width, metrics3.width) + padX * 2);
    let boxH = 200;
    if (sub) boxH += 80;
    if (val) boxH += 100;
    
    const bx = (w - boxW) / 2;
    const by = (h - boxH) / 2;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.45)';
    ctx.lineWidth = 8;
    const r = 32;
    drawRoundedRect(ctx, bx, by, boxW, boxH, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    let currentY = by + 100;
    
    ctx.font = 'bold 144px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#e0f2fe';
    ctx.fillText(label, w / 2, currentY);
    
    if (sub) {
      currentY += 100;
      ctx.font = 'normal 72px Inter, system-ui, sans-serif';
      ctx.fillStyle = '#94a3b8'; // text-slate-400
      ctx.fillText(sub, w / 2, currentY);
    }
    
    if (val) {
      currentY += 100;
      ctx.font = 'bold 84px Inter, system-ui, sans-serif';
      ctx.fillStyle = '#4ade80'; // green-400 for value
      ctx.fillText(val, w / 2, currentY);
    }
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [text, subtitle, valueText]);

  return (
    <sprite position={[position[0], position[1] + offsetY, position[2]]} scale={[15.6, (subtitle || valueText) ? 3.9 : 2.925, 1]}>
      <spriteMaterial map={texture} transparent depthTest={false} depthWrite={false} />
    </sprite>
  );
}

/** Узел-пузырь: блик, fresnel, мягкое свечение ядра. */

export function NodeBubble({
  position,
  color,
  radius,
  emissive,
  emissiveIntensity,
  opacity,
  locked,
  onClick,
}: {
  position: [number, number, number];
  color: string;
  radius: number;
  emissive: string;
  emissiveIntensity: number;
  opacity: number;
  locked: boolean;
  onClick: (e: any) => void;
}) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(color) },
      uEmissive: { value: new THREE.Color(emissive) },
      uEmissiveIntensity: { value: emissiveIntensity },
      uOpacity: { value: opacity },
      uLocked: { value: locked ? 1.0 : 0.0 },
      uTime: { value: 0 },
    }),
    [color, emissive, emissiveIntensity, opacity, locked]
  );

  useFrame((_, delta) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value += delta;
      matRef.current.uniforms.uColor.value.set(color);
      matRef.current.uniforms.uEmissive.value.set(emissive);
      matRef.current.uniforms.uEmissiveIntensity.value = emissiveIntensity;
      matRef.current.uniforms.uOpacity.value = opacity;
      matRef.current.uniforms.uLocked.value = locked ? 1.0 : 0.0;
    }
  });

  return (
    <mesh
      position={position}
      onClick={onClick}
      onPointerDown={e => {
        e.stopPropagation();
        onClick(e);
      }}
      onPointerOver={e => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      <sphereGeometry args={[radius, 48, 48]} />
      <shaderMaterial
        ref={matRef}
        transparent
        depthWrite={!locked}
        side={THREE.FrontSide}
        uniforms={uniforms}
        vertexShader={`
          varying vec3 vNormal;
          varying vec3 vView;
          varying vec3 vWorld;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vView = normalize(-mv.xyz);
            vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * mv;
          }
        `}
        fragmentShader={`
          uniform vec3 uColor;
          uniform vec3 uEmissive;
          uniform float uEmissiveIntensity;
          uniform float uOpacity;
          uniform float uLocked;
          uniform float uTime;
          varying vec3 vNormal;
          varying vec3 vView;
          varying vec3 vWorld;
          void main() {
            float ndotv = max(dot(vNormal, vView), 0.0);
            float fresnel = pow(1.0 - ndotv, 3.0);
            vec3 lightDir = normalize(vec3(0.45, 0.75, 0.4));
            float spec = pow(max(dot(reflect(-lightDir, vNormal), vView), 0.0), 48.0);
            float pulse = 0.92 + 0.08 * sin(uTime * 1.6 + vWorld.x * 0.3);
            vec3 base = uColor * (0.35 + 0.45 * ndotv);
            vec3 rim = uColor * fresnel * 1.6 + vec3(0.55, 0.75, 0.95) * fresnel * 0.45;
            vec3 glow = uEmissive * uEmissiveIntensity * (0.4 + fresnel * 0.8);
            vec3 col = (base + rim + glow + vec3(spec * 0.85)) * pulse;
            col = mix(col, col * 0.45 + vec3(0.12), uLocked);
            float alpha = mix(uOpacity * (0.72 + fresnel * 0.28), uOpacity * 0.5, uLocked);
            gl_FragColor = vec4(col, clamp(alpha, 0.15, 1.0));
          }
        `}
      />
    </mesh>
  );
}
