import React, { useState } from 'react';
import { useDCSStore } from '../../stores/dcsStore';
import { useSimulationStore } from '../../stores/simulationStore';
import { TAG_METADATA_REGISTRY } from '../../data/tags';
import { X, Activity, AlertOctagon, Check } from 'lucide-react';

export const TransmitterPopup: React.FC = () => {
  const { selectedTransmitterId, closeTransmitterPopup } = useDCSStore();
  const { tags, injectFault, clearFault } = useSimulationStore();
  const [customBias, setCustomBias] = useState<string>('3.0');

  if (!selectedTransmitterId) return null;

  const tag = tags[selectedTransmitterId];
  const meta = TAG_METADATA_REGISTRY[selectedTransmitterId];

  if (!tag || !meta) return null;

  const handleApplyBias = (e: React.FormEvent) => {
    e.preventDefault();
    const b = parseFloat(customBias);
    if (!isNaN(b)) {
      injectFault('S15', b * 33.3, 1);
    }
  };

  const handleClearBias = () => {
    clearFault('S15');
  };

  return (
    <div className="fixed top-28 left-1/4 w-88 bg-[#0d1422] border-2 border-purple-500 rounded-md shadow-2xl z-50 text-gray-200 font-mono text-xs select-none">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#201533] border-b border-purple-700/60">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-purple-400" />
          <span className="font-bold text-white tracking-wider">DIAGNOSTIC: {tag.id}</span>
          <span className="text-[10px] text-purple-300">INSTRUCTOR SENSOR TOOL</span>
        </div>
        <button
          onClick={closeTransmitterPopup}
          className="p-0.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white"
        >
          <X size={14} />
        </button>
      </div>

      <div className="p-3 space-y-3">
        <div className="bg-[#080d16] p-2.5 rounded border border-gray-800 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 font-bold">PHYSICAL TRUE VALUE:</span>
            <span className="text-emerald-400 font-bold text-sm">
              {tag.trueValue.toFixed(meta.decimals ?? 2)} {meta.engineeringUnit}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400 font-bold">HMI MEASURED VALUE:</span>
            <span className="text-cyan-400 font-bold text-sm">
              {tag.measuredValue.toFixed(meta.decimals ?? 2)} {meta.engineeringUnit}
            </span>
          </div>

          <div className="flex justify-between items-center text-[10px] pt-1 border-t border-gray-800">
            <span className="text-gray-500">MEASUREMENT SENSOR OFFSET:</span>
            <span className={tag.bias && tag.bias !== 0 ? 'text-amber-400 font-bold' : 'text-gray-400'}>
              {tag.bias ? (tag.bias > 0 ? `+${tag.bias.toFixed(2)}` : tag.bias.toFixed(2)) : '0.00'}{' '}
              {meta.engineeringUnit}
            </span>
          </div>
        </div>

        {/* Bias Injection Controls */}
        <div className="bg-[#080d16] p-2.5 rounded border border-gray-800 space-y-2">
          <div className="font-bold text-purple-300 text-[11px]">INJECT SENSOR BIAS (S15)</div>
          <form onSubmit={handleApplyBias} className="flex gap-2">
            <input
              type="number"
              step="0.5"
              value={customBias}
              onChange={(e) => setCustomBias(e.target.value)}
              className="bg-[#05080f] border border-gray-700 text-white px-2 py-1 rounded text-xs w-full font-mono outline-none"
            />
            <button
              type="submit"
              className="bg-purple-700 hover:bg-purple-600 text-white px-3 py-1 rounded font-bold"
            >
              Apply
            </button>
          </form>

          {tag.bias && tag.bias !== 0 && (
            <button
              onClick={handleClearBias}
              className="w-full py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 font-bold text-[10px]"
            >
              CLEAR SENSOR BIAS
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
