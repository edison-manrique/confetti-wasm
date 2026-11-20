import { For, Show } from 'solid-js';
import { Pause, Play, Sparkles, Trash2, Zap } from 'lucide-solid';
import type { BurstConfig, PhysicsConfig } from './ConfettiCanvas';

interface ControlSidebarProps {
  physics: PhysicsConfig;
  burst: BurstConfig;
  paused: boolean;
  wasmReady: boolean;
  onChangePhysics: (next: PhysicsConfig) => void;
  onChangeBurst: (next: BurstConfig) => void;
  onTriggerCenterBurst: () => void;
  onTriggerDualCannons: () => void;
  onTogglePause: () => void;
  onClear: () => void;
}

interface SliderFieldProps {
  id: string;
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  decimals?: number;
  onChange: (value: number) => void;
}

function SliderField(props: SliderFieldProps) {
  return (
    <div class="space-y-1.5">
      <div class="flex items-baseline justify-between gap-2">
        <label for={props.id} class="text-xs font-medium text-slate-300">
          {props.label}
        </label>
        <span class="font-mono text-xs tabular-nums text-cyan-300">
          {props.value.toFixed(props.decimals ?? 0)}
          <span class="ml-1 text-[11px] text-slate-500">{props.unit}</span>
        </span>
      </div>
      <input
        id={props.id}
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onInput={(e) => props.onChange(parseFloat(e.currentTarget.value))}
        class="lab-slider w-full cursor-pointer"
      />
    </div>
  );
}

const EMITTER_MODES = [
  { id: 'burst', label: 'Ráfaga' },
  { id: 'cannons', label: 'Cañones' },
  { id: 'stream', label: 'Lluvia' },
] as const;

export function ControlSidebar(props: ControlSidebarProps) {
  return (
    <aside class="w-full lg:w-[332px] shrink-0 rounded-lg border border-slate-800 bg-[#0D111A] p-4 flex flex-col gap-5">
      <div>
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-display text-sm font-semibold text-slate-100">
            Modo de Emisión
          </h2>
          <span class="font-mono text-[11px] text-slate-400">
            Click en canvas activo
          </span>
        </div>

        <div class="grid grid-cols-3 gap-1 rounded-md border border-slate-800 bg-[#07090E] p-1">
          <For each={EMITTER_MODES}>
            {(mode) => {
              const active = () => props.burst.emitterMode === mode.id;
              return (
                <button
                  type="button"
                  onClick={() => props.onChangeBurst({ ...props.burst, emitterMode: mode.id })}
                  class={`px-2.5 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active()
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  {mode.label}
                </button>
              );
            }}
          </For>
        </div>

        <div class="mt-4 space-y-3.5">
          <SliderField
            id="slider-count"
            label="Partículas por disparo"
            value={props.burst.count}
            unit="part."
            min={100}
            max={19200}
            step={100}
            onChange={(count) => props.onChangeBurst({ ...props.burst, count })}
          />
          <SliderField
            id="slider-speed"
            label="Velocidad inicial"
            value={props.burst.speed}
            unit="px/s"
            min={300}
            max={1500}
            step={25}
            onChange={(speed) => props.onChangeBurst({ ...props.burst, speed })}
          />
          <SliderField
            id="slider-spread"
            label="Ángulo de dispersión"
            value={props.burst.spreadDeg}
            unit="°"
            min={15}
            max={360}
            step={5}
            onChange={(spreadDeg) => props.onChangeBurst({ ...props.burst, spreadDeg })}
          />
        </div>
      </div>

      <div class="border-t border-slate-800 pt-4">
        <h2 class="font-display text-sm font-semibold text-slate-100 mb-3">
          Parámetros Físicos
        </h2>
        <div class="space-y-3.5">
          <SliderField
            id="slider-gravity"
            label="Gravedad"
            value={props.physics.gravity}
            unit="px/s²"
            min={100}
            max={2200}
            step={20}
            onChange={(gravity) => props.onChangePhysics({ ...props.physics, gravity })}
          />
          <SliderField
            id="slider-drag"
            label="Arrastre aerodinámico"
            value={props.physics.drag}
            unit="1/s"
            min={0.2}
            max={4.0}
            step={0.05}
            decimals={2}
            onChange={(drag) => props.onChangePhysics({ ...props.physics, drag })}
          />
          <SliderField
            id="slider-wind"
            label="Viento lateral"
            value={props.physics.wind}
            unit="px/s²"
            min={-600}
            max={600}
            step={20}
            onChange={(wind) => props.onChangePhysics({ ...props.physics, wind })}
          />
          <SliderField
            id="slider-turbulence"
            label="Turbulencia"
            value={props.physics.turbulence}
            unit="px/s²"
            min={0}
            max={450}
            step={15}
            onChange={(turbulence) => props.onChangePhysics({ ...props.physics, turbulence })}
          />
        </div>
      </div>

      <div class="border-t border-slate-800 pt-4 mt-auto space-y-2.5">
        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={!props.wasmReady}
            onClick={() => props.onTriggerCenterBurst()}
            class="flex items-center justify-center gap-1.5 rounded-md bg-cyan-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Sparkles class="h-3.5 w-3.5" aria-hidden="true" />
            <span>Ráfaga Central</span>
          </button>
          <button
            type="button"
            disabled={!props.wasmReady}
            onClick={() => props.onTriggerDualCannons()}
            class="flex items-center justify-center gap-1.5 rounded-md border border-slate-700 bg-slate-800/70 px-3 py-2 text-xs font-medium text-slate-100 hover:bg-slate-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Zap class="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
            <span>Cañones Dobles</span>
          </button>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={!props.wasmReady}
            onClick={() => props.onTogglePause()}
            class="flex items-center justify-center gap-1.5 rounded-md border border-slate-800 bg-[#07090E] px-3 py-2 text-xs font-medium text-slate-300 hover:border-slate-700 hover:text-white disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Show
              when={props.paused}
              fallback={
                <>
                  <Pause class="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                  <span>Pausar</span>
                </>
              }
            >
              <Play class="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
              <span>Reanudar</span>
            </Show>
          </button>
          <button
            type="button"
            disabled={!props.wasmReady}
            onClick={() => props.onClear()}
            class="flex items-center justify-center gap-1.5 rounded-md border border-slate-800 bg-[#07090E] px-3 py-2 text-xs font-medium text-slate-300 hover:border-rose-500/40 hover:text-rose-300 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Trash2 class="h-3.5 w-3.5" aria-hidden="true" />
            <span>Limpiar</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
