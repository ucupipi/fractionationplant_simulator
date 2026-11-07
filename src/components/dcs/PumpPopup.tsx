import React from 'react';
import { useDCSStore } from '../../stores/dcsStore';
import { useSimulationStore } from '../../stores/simulationStore';
import { EQUIPMENT_REGISTRY, PumpEquipmentRecord } from '../../data/equipment';
import { X, Play, Square, AlertCircle, CheckCircle2 } from 'lucide-react';

export const PumpPopup: React.FC = () => {
  const { selectedPumpId, closePumpPopup } = useDCSStore();
  const { pumps, startPump, stopPump, resetPumpTrip } = useSimulationStore();

  if (!selectedPumpId) return null;

  const pumpState = pumps[selectedPumpId];
  const eq = EQUIPMENT_REGISTRY[selectedPumpId] as PumpEquipmentRecord;

  if (!pumpState || !eq) return null;

  return (
    <div className="fixed top-24 left-1/3 w-80 bg-[#0d1422] border-2 border-emerald-500 rounded-md shadow-2xl z-50 text-gray-200 font-mono text-xs select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#12221b] border-b border-emerald-700/60">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          <span className="font-bold text-white tracking-wider">{eq.id}</span>
          <span className="text-[10px] text-gray-400">({eq.unitSection})</span>
        </div>
        <button
          onClick={closePumpPopup}
          className="p-0.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white"
        >
          <X size={14} />
        </button>
      </div>

      {/* Description */}
      <div className="px-3 py-1.5 bg-[#090e18] border-b border-gray-800 text-[11px] text-gray-300">
        <div className="font-semibold text-emerald-200">{eq.name}</div>
        <div className="text-[10px] text-gray-500">{eq.description}</div>
      </div>

      {/* Pump Status & Amps Gauge */}
      <div className="p-3 space-y-3">
        <div className="flex items-center justify-between bg-[#080d16] p-2.5 rounded border border-gray-800">
          <span className="text-gray-400 font-bold">STATUS:</span>
          {pumpState.tripped ? (
            <span className="px-2.5 py-0.5 rounded bg-red-700 text-white font-bold animate-pulse">
              TRIPPED
            </span>
          ) : pumpState.running ? (
            <span className="px-2.5 py-0.5 rounded bg-emerald-600 text-white font-bold">
              RUNNING
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded bg-gray-700 text-gray-300 font-bold">
              STOPPED (AVAILABLE)
            </span>
          )}
        </div>

        {/* Motor Current (Amps) */}
        <div className="bg-[#080d16] p-2.5 rounded border border-gray-800">
          <div className="flex justify-between text-[11px] text-gray-400 mb-1">
            <span className="font-bold">MOTOR CURRENT:</span>
            <span className="text-emerald-300 font-bold">{pumpState.amps.toFixed(1)} A</span>
          </div>
          <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-700">
            <div
              className={`h-full transition-all duration-300 ${
                pumpState.tripped ? 'bg-red-500' : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(100, (pumpState.amps / eq.maxAmps) * 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[9px] text-gray-600 mt-1">
            <span>0 A</span>
            <span>MAX: {eq.maxAmps} A</span>
          </div>
        </div>

        {/* Permissives Checklist */}
        <div className="bg-[#080d16] p-2.5 rounded border border-gray-800 space-y-1 text-[10px]">
          <div className="font-bold text-gray-400 mb-1">START PERMISSIVES (TRAINING ASSUMPTION):</div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 size={11} />
            <span>Suction Valve Open / Minimum Head Available</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 size={11} />
            <span>MCC Power Supply Ready</span>
          </div>
          {pumpState.tripped && (
            <div className="flex items-center gap-1.5 text-red-400 font-bold animate-pulse">
              <AlertCircle size={11} />
              <span>Electrical Overload / Protection Tripped</span>
            </div>
          )}
        </div>

        {/* Control Buttons: RUN, STOP, RESET TRIP */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {pumpState.tripped ? (
            <button
              onClick={() => resetPumpTrip(selectedPumpId)}
              className="col-span-2 py-2 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center justify-center gap-1 shadow"
            >
              <AlertCircle size={13} />
              RESET TRIP & RESTORE AVAILABILITY
            </button>
          ) : (
            <>
              <button
                onClick={() => startPump(selectedPumpId)}
                disabled={pumpState.running}
                className={`py-2 rounded font-bold flex items-center justify-center gap-1 shadow ${
                  pumpState.running
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                <Play size={13} fill="currentColor" />
                START PUMP
              </button>

              <button
                onClick={() => stopPump(selectedPumpId)}
                disabled={!pumpState.running}
                className={`py-2 rounded font-bold flex items-center justify-center gap-1 shadow ${
                  !pumpState.running
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-red-700 hover:bg-red-600 text-white'
                }`}
              >
                <Square size={13} fill="currentColor" />
                STOP PUMP
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
