const fs = require('fs');

const path = 'src/ui/PhysicsControlPanel.tsx';
let code = fs.readFileSync(path, 'utf8');

// replace useState and useRef imports
code = code.replace(
  "import React, { useState, useEffect, useRef } from 'react';",
  "import React from 'react';\nimport { useSliderController } from '../hooks/useSliderController';"
);

const targetStart = `export function PhysicsControlPanel({`;
const targetEnd = `  const handleReset = () => {\n    if (timerRef.current) clearTimeout(timerRef.current);\n    setLocalParams(DEFAULT_PHYSICS_PARAMS);\n    setStatus('IDLE');\n    onChange(DEFAULT_PHYSICS_PARAMS);\n  };`;

const startIndex = code.indexOf(targetStart);
const endIndex = code.indexOf(targetEnd) + targetEnd.length;

if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    console.error("Could not find block to replace.");
    process.exit(1);
}

const replacement = `export function PhysicsControlPanel({
  params,
  onChange,
  isOpen = false,
  onToggle,
}: PhysicsControlPanelProps) {
  const { workingParams, status, updateValue, startInteraction, endInteraction, reset } = useSliderController<PhysicsParams>(
    params,
    onChange,
    800
  );

  const handleSliderChange = (prop: keyof PhysicsParams, val: number) => {
    if (isNaN(val)) return;
    updateValue(prop, val);
  };

  const handleReset = () => {
    reset(DEFAULT_PHYSICS_PARAMS);
  };`;

code = code.substring(0, startIndex) + replacement + code.substring(endIndex);

// Update Slider component
const targetSliderStart = `  const Slider = ({`;
const targetSliderEnd = `    </div>\n  );`;
const sliderStartIndex = code.indexOf(targetSliderStart);
const sliderEndIndex = code.indexOf(targetSliderEnd) + targetSliderEnd.length;

const sliderReplacement = `  const Slider = ({
    label,
    prop,
    min,
    max,
    step,
  }: {
    label: string;
    prop: keyof PhysicsParams;
    min: number;
    max: number;
    step: number;
  }) => (
    <div className="mb-2">
      <div className="flex items-center justify-between text-xs text-slate-200 mb-1">
        <span className="font-medium text-slate-200">{label}</span>
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={workingParams[prop] ?? 0}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              handleSliderChange(prop, isNaN(val) ? 0 : val);
            }}
            onFocus={startInteraction}
            onBlur={endInteraction}
            className="w-16 px-1.5 py-0.5 text-xs font-mono font-bold text-emerald-300 bg-neutral-900 border border-neutral-700/80 rounded text-right focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50"
          />
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={workingParams[prop] ?? 0}
        onPointerDown={startInteraction}
        onPointerUp={endInteraction}
        onChange={(e) => handleSliderChange(prop, parseFloat(e.target.value))}
        onInput={(e) => handleSliderChange(prop, parseFloat((e.target as HTMLInputElement).value))}
        className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 hover:accent-emerald-300 transition-colors"
      />
    </div>
  );`;

code = code.substring(0, sliderStartIndex) + sliderReplacement + code.substring(sliderEndIndex);

// replace localParams with workingParams in the template
code = code.replace(/localParams/g, 'workingParams');

fs.writeFileSync(path, code);
console.log("Replaced");
