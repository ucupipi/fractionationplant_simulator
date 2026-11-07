import React, { useState } from 'react';
import { useDCSStore } from '../../stores/dcsStore';
import { useSimulationStore } from '../../stores/simulationStore';
import { TAG_METADATA_REGISTRY } from '../../data/tags';
import { CONTROLLER_CONFIGS } from '../../data/control-config';
import { X, TrendingUp, Activity, Check } from 'lucide-react';
import { Sparkline } from '../common/Sparkline';

export const FaceplatePID: React.FC = () => {
  const { selectedFaceplateTag, closeFaceplate, setActiveScreen, setTrendTags } = useDCSStore();
  const { tags, history, setControllerMode, setControllerSP, setControllerMV } = useSimulationStore();

  const [inputSP, setInputSP] = useState<string>('');
  const [inputMV, setInputMV] = useState<string>('');

  if (!selectedFaceplateTag) return null;

  const tag = tags[selectedFaceplateTag];
  const meta = TAG_METADATA_REGISTRY[selectedFaceplateTag];
  const ctrlCfg = CONTROLLER_CONFIGS[selectedFaceplateTag];
  const tagHistory = history[selectedFaceplateTag] || [];

  if (!tag || !meta) return null;

  const isController = meta.isController && meta.type === 'PID_CONTROLLER';
  const pv = tag.measuredValue;
  const sp = tag.sp !== undefined ? tag.sp : pv;
  const mv = tag.mv !== undefined ? tag.mv : 0;
  const mode = tag.mode || 'AUTO';

  const rangeMin = meta.rangeMin;
  const rangeMax = meta.rangeMax;
  const range = rangeMax - rangeMin || 100;
  const pvPercent = Math.max(0, Math.min(100, ((pv - rangeMin) / range) * 100));
  const spPercent = Math.max(0, Math.min(100, ((sp - rangeMin) / range) * 100));

  const hasAlarm = tag.alarmState !== 'NORMAL';
  const isUnack = tag.alarmState === 'ACTIVE_UNACK';

  const handleApplySP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isController) return;
    const val = parseFloat(inputSP);
    if (!isNaN(val)) {
      setControllerSP(selectedFaceplateTag, Math.max(rangeMin, Math.min(rangeMax, val)));
      setInputSP('');
    }
  };

  const handleApplyMV = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isController) return;
    const val = parseFloat(inputMV);
    if (!isNaN(val)) {
      setControllerMV(selectedFaceplateTag, Math.max(0, Math.min(100, val)));
      setInputMV('');
    }
  };

  const handleOpenTrend = () => {
    setTrendTags([selectedFaceplateTag]);
    setActiveScreen('TREND');
  };

  return (
    <div className="fixed top-16 right-4 w-88 bg-[#000000] border border-[#2f435a] shadow-none z-50 text-gray-200 font-mono text-xs select-none">
      {/* Yokogawa CENTUM VP Window Title Bar */}
      <div className="flex items-center justify-between px-2.5 py-1 bg-[#253549] border-b border-[#141f2c]">
        <div className="flex items-center gap-2">
          <Activity size={13} className="text-cyan-400" />
          <span className="font-bold text-white tracking-widest text-[12px]">{tag.id}</span>
          <span className="text-[10px] text-gray-300 font-normal">[{meta.engineeringUnit}]</span>
        </div>
        <button
          onClick={closeFaceplate}
          className="px-1.5 py-0.5 bg-[#3a4856] hover:bg-red-700 text-white font-bold text-[10px] border border-gray-600"
          title="Close [Esc]"
        >
          ✕
        </button>
      </div>

      {/* Tag Description & Subsystem Identification */}
      <div className="px-2.5 py-1.5 bg-[#0a0f16] border-b border-[#1a2636] text-[11px]">
        <div className="font-bold text-cyan-300">{meta.name}</div>
        <div className="text-[10px] text-gray-400">{meta.description}</div>
      </div>

      {/* CONTROLLER vs INDICATOR DISPLAY */}
      {isController ? (
        <>
          {/* Mode Selector Strip (Yokogawa MAN / AUT / CAS) */}
          <div className="px-2.5 py-1.5 bg-[#05080c] border-b border-[#1a2636] flex items-center justify-between">
            <span className="text-gray-400 font-bold text-[11px]">LOOP MODE:</span>
            <div className="flex items-center gap-1">
              {(['MAN', 'AUTO', 'CAS'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setControllerMode(selectedFaceplateTag, m)}
                  className={`px-3 py-0.5 font-bold text-[10px] border transition-none ${
                    mode === m
                      ? m === 'MAN'
                        ? 'bg-amber-600 text-white border-amber-400'
                        : m === 'CAS'
                        ? 'bg-purple-600 text-white border-purple-400'
                        : 'bg-emerald-600 text-white border-emerald-400'
                      : 'bg-[#1e2a38] text-gray-400 border-gray-700 hover:bg-[#28384b] hover:text-gray-200'
                  }`}
                >
                  {m === 'AUTO' ? 'AUT' : m}
                </button>
              ))}
            </div>
          </div>

          {/* Main Dual Bar Gauge: PV & SP on Left, MV on Right */}
          <div className="p-2.5 grid grid-cols-12 gap-2.5 items-center bg-[#000000]">
            {/* Left: Numeric Readouts and SP Edit */}
            <div className="col-span-8 space-y-2">
              {/* PV */}
              <div className="bg-[#080d14] p-1.5 border border-[#1a2636]">
                <div className="flex justify-between text-[9.5px] text-gray-400">
                  <span className="font-bold text-cyan-400">PV (MEASURED)</span>
                  <span>{meta.engineeringUnit}</span>
                </div>
                <div
                  className={`text-xl font-bold tracking-wider ${
                    hasAlarm ? 'text-red-500' : 'text-cyan-300'
                  } ${isUnack ? 'animate-pulse' : ''}`}
                >
                  {pv.toFixed(meta.decimals ?? 1)}
                </div>
              </div>

              {/* SV / SP */}
              <div className="bg-[#080d14] p-1.5 border border-[#1a2636]">
                <div className="flex justify-between text-[9.5px] text-gray-400">
                  <span className="font-bold text-amber-400">SV (SETPOINT)</span>
                  <span>{meta.engineeringUnit}</span>
                </div>
                <div className="text-lg font-bold text-amber-300 tracking-wider">
                  {sp.toFixed(meta.decimals ?? 1)}
                </div>
              </div>

              {/* Setpoint Change Form */}
              <form onSubmit={handleApplySP} className="flex gap-1">
                <input
                  type="number"
                  step="0.1"
                  placeholder={`SP (${rangeMin}..${rangeMax})`}
                  value={inputSP}
                  onChange={(e) => setInputSP(e.target.value)}
                  className="bg-[#05080c] border border-gray-700 text-white px-2 py-0.5 text-[11px] w-full font-mono outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  className="bg-[#2f435a] hover:bg-[#3d5673] text-white px-2.5 py-0.5 font-bold text-[10px] border border-gray-600"
                  title="Apply SP"
                >
                  <Check size={11} />
                </button>
              </form>
            </div>

            {/* Right: Vertical Gauges for PV/SP and MV */}
            <div className="col-span-4 flex items-center justify-around h-40 bg-[#080d14] p-1.5 border border-[#1a2636]">
              {/* PV / SP Vertical Bar */}
              <div className="flex flex-col items-center h-full w-6">
                <span className="text-[8px] text-gray-500">{rangeMax}</span>
                <div className="relative flex-1 w-3 bg-[#040608] my-1 border border-gray-700">
                  <div
                    className="absolute bottom-0 w-full bg-emerald-500"
                    style={{ height: `${pvPercent}%` }}
                  ></div>
                  <div
                    className="absolute w-full h-1 bg-amber-400 z-10"
                    style={{ bottom: `${spPercent}%` }}
                  ></div>
                </div>
                <span className="text-[8px] text-gray-500">{rangeMin}</span>
                <span className="text-[8.5px] font-bold text-cyan-400">PV</span>
              </div>

              {/* MV Output Vertical Bar */}
              <div className="flex flex-col items-center h-full w-6">
                <span className="text-[8px] text-gray-500">100</span>
                <div className="relative flex-1 w-3 bg-[#040608] my-1 border border-gray-700">
                  <div
                    className="absolute bottom-0 w-full bg-cyan-500"
                    style={{ height: `${mv}%` }}
                  ></div>
                </div>
                <span className="text-[8px] text-gray-500">0</span>
                <span className="text-[8.5px] font-bold text-emerald-400">MV</span>
              </div>
            </div>
          </div>

          {/* Manipulated Variable (MV) Slider & Output Strip */}
          <div className="px-2.5 py-2 bg-[#05080c] border-t border-[#1a2636]">
            <div className="flex justify-between items-center text-[10px] mb-1">
              <span className="text-gray-400 font-bold">VALVE OUTPUT (MV):</span>
              <span className="text-emerald-400 font-bold">{mv.toFixed(1)}%</span>
            </div>

            {mode === 'MAN' ? (
              <div className="space-y-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.5"
                  value={mv}
                  onChange={(e) => setControllerMV(selectedFaceplateTag, parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-gray-800 appearance-none cursor-pointer accent-emerald-500"
                />
                <form onSubmit={handleApplyMV} className="flex gap-1">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    placeholder="Direct MV %"
                    value={inputMV}
                    onChange={(e) => setInputMV(e.target.value)}
                    className="bg-[#05080c] border border-gray-700 text-white px-2 py-0.5 text-[10px] w-full font-mono outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-emerald-800 hover:bg-emerald-700 text-white px-2 py-0.5 font-bold text-[10px] border border-emerald-600"
                  >
                    SET
                  </button>
                </form>
              </div>
            ) : (
              <div className="text-[9.5px] text-gray-500">Auto PID algorithm calculating valve demand</div>
            )}
          </div>
        </>
      ) : (
        /* ==================== TRANSMITTER / INDICATOR FACEPLATE ==================== */
        <div className="p-3 bg-[#000000] space-y-3">
          <div className="bg-[#141f2c] border border-cyan-800/80 px-2 py-1 text-center">
            <span className="text-cyan-300 font-bold text-[10px] tracking-wider">
              TRANSMITTER / PROCESS INDICATOR
            </span>
          </div>

          <div className="grid grid-cols-12 gap-3 items-center">
            {/* Left: Numeric Measurement */}
            <div className="col-span-8 space-y-2">
              <div className="bg-[#080d14] p-2 border border-[#1a2636]">
                <div className="text-[9px] text-gray-400">MEASURED PROCESS VALUE</div>
                <div
                  className={`text-2xl font-bold tracking-wider ${
                    hasAlarm ? 'text-red-500' : 'text-cyan-300'
                  } ${isUnack ? 'animate-pulse' : ''}`}
                >
                  {pv.toFixed(meta.decimals ?? 1)}
                </div>
                <div className="text-[10px] text-gray-400 text-right">{meta.engineeringUnit}</div>
              </div>

              <div className="bg-[#080d14] p-1.5 border border-[#1a2636] text-[9.5px] text-gray-400 space-y-0.5">
                <div className="flex justify-between">
                  <span>SCALE MIN:</span>
                  <span className="text-white font-bold">{rangeMin} {meta.engineeringUnit}</span>
                </div>
                <div className="flex justify-between">
                  <span>SCALE MAX:</span>
                  <span className="text-white font-bold">{rangeMax} {meta.engineeringUnit}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>CONTROL:</span>
                  <span className="text-amber-400">READONLY (NON-EDITABLE)</span>
                </div>
              </div>
            </div>

            {/* Right: Vertical Bar Indicator */}
            <div className="col-span-4 flex flex-col items-center h-44 bg-[#080d14] p-1.5 border border-[#1a2636]">
              <span className="text-[8px] text-gray-500">{rangeMax}</span>
              <div className="relative flex-1 w-4 bg-[#040608] my-1 border border-gray-700">
                <div
                  className={`absolute bottom-0 w-full ${hasAlarm ? 'bg-red-500' : 'bg-cyan-500'}`}
                  style={{ height: `${pvPercent}%` }}
                ></div>
              </div>
              <span className="text-[8px] text-gray-500">{rangeMin}</span>
              <span className="text-[9px] font-bold text-cyan-400 mt-0.5">PV</span>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Sparkline & Trend Button */}
      <div className="px-2.5 py-2 bg-[#080d14] border-t border-[#1a2636] flex items-center justify-between">
        <div>
          <div className="text-[9px] text-gray-500 mb-0.5">5-MIN REALTIME TREND</div>
          <Sparkline data={tagHistory} width={140} height={20} color="#00e5ff" min={rangeMin} max={rangeMax} />
        </div>

        <button
          onClick={handleOpenTrend}
          className="flex items-center gap-1 px-2.5 py-1 bg-[#1e2a38] hover:bg-[#28384b] text-cyan-300 border border-cyan-700 font-bold text-[10px]"
        >
          <TrendingUp size={11} />
          TREND (TG)
        </button>
      </div>

      {/* Controller Tuning Footer */}
      {isController && ctrlCfg && (
        <div className="px-2.5 py-1 bg-[#05080c] border-t border-[#141f2c] flex justify-between text-[9px] text-gray-500">
          <span>Kp: {ctrlCfg.kp}</span>
          <span>Ti: {ctrlCfg.ti}s</span>
          <span>Td: {ctrlCfg.td}s</span>
          <span className="text-gray-400">PID REGULATORY</span>
        </div>
      )}
    </div>
  );
};
