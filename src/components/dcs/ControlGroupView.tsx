import React, { useState } from 'react';
import { useSimulationStore } from '../../stores/simulationStore';
import { useDCSStore } from '../../stores/dcsStore';
import { TAG_METADATA_REGISTRY } from '../../data/tags';
import { X, Check, Sliders, Activity } from 'lucide-react';

export interface ControlGroupViewProps {
  groupId: string;
  tagIds: string[];
  title?: string;
  onClose: () => void;
}

export const ControlGroupView: React.FC<ControlGroupViewProps> = ({
  groupId,
  tagIds,
  title,
  onClose
}) => {
  const { tags, setControllerMode, setControllerSP, setControllerMV } = useSimulationStore();
  const { openFaceplate } = useDCSStore();

  const [selectedTag, setSelectedTag] = useState<string>(tagIds[0] || '');
  const [inputVal, setInputVal] = useState<string>('');

  // Pad to 8 instruments (Standard Yokogawa CENTUM 8-faceplate bay)
  const displayTags = [...tagIds];
  while (displayTags.length < 8) {
    displayTags.push('');
  }

  const activeTagObj = tags[selectedTag];
  const activeMeta = TAG_METADATA_REGISTRY[selectedTag];
  const isSelectedController = activeMeta?.isController && activeMeta?.type === 'PID_CONTROLLER';

  const handleSetSP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSelectedController) return;
    const val = parseFloat(inputVal);
    if (!isNaN(val) && selectedTag && activeMeta) {
      setControllerSP(selectedTag, Math.max(activeMeta.rangeMin, Math.min(activeMeta.rangeMax, val)));
      setInputVal('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-2 select-none font-mono">
      <div className="bg-[#000000] border border-[#2f435a] w-full max-w-7xl overflow-hidden flex flex-col h-[88vh]">
        {/* Top Header Bar (Yokogawa CENTUM VP Style) */}
        <div className="bg-[#253549] px-3 py-1.5 border-b border-[#141f2c] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sliders size={14} className="text-cyan-400" />
            <span className="font-bold text-white tracking-widest text-xs">
              CONTROL GROUP: {groupId} {title ? `— ${title}` : ''}
            </span>
            <span className="text-[10px] text-cyan-300 font-bold border border-cyan-800 px-1 bg-[#162238]">
              YOKOGAWA CENTUM VP (8-LOOP BAY)
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-2 py-0.5 bg-[#3a4856] hover:bg-red-700 text-white font-bold text-xs border border-gray-600"
          >
            ✕ CLOSE [ESC]
          </button>
        </div>

        {/* 8-Loop Vertical Faceplates Grid */}
        <div className="flex-1 p-2 grid grid-cols-8 gap-1.5 bg-[#000000] overflow-x-auto">
          {displayTags.map((tagId, index) => {
            if (!tagId) {
              return (
                <div
                  key={`empty-${index}`}
                  className="bg-[#05080c] border border-[#141f2c] p-2 flex flex-col justify-between opacity-30"
                >
                  <div className="text-center text-gray-600 text-[9px]">SLOT {index + 1}</div>
                  <div className="text-center text-gray-700 text-[10px]">--- UNASSIGNED ---</div>
                  <div></div>
                </div>
              );
            }

            const tag = tags[tagId];
            const meta = TAG_METADATA_REGISTRY[tagId];
            if (!tag || !meta) return null;

            const isSelected = selectedTag === tagId;
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

            return (
              <div
                key={tagId}
                onClick={() => setSelectedTag(tagId)}
                className={`bg-[#05080c] border p-1.5 flex flex-col justify-between cursor-pointer transition-none ${
                  isSelected
                    ? 'border-cyan-400 ring-1 ring-cyan-400 bg-[#090f18]'
                    : 'border-[#1a2636] hover:border-gray-600'
                }`}
              >
                {/* Slot Header */}
                <div>
                  <div className="flex justify-between items-center text-[10px] mb-0.5 border-b border-[#141f2c] pb-1">
                    <span className="font-bold text-white">{tagId}</span>
                    {isController ? (
                      <span
                        className={`px-1 text-[8.5px] font-bold border ${
                          mode === 'MAN'
                            ? 'bg-amber-600 text-white border-amber-400'
                            : mode === 'CAS'
                            ? 'bg-purple-600 text-white border-purple-400'
                            : 'bg-emerald-600 text-white border-emerald-400'
                        }`}
                      >
                        {mode === 'AUTO' ? 'AUT' : mode}
                      </span>
                    ) : (
                      <span className="px-1 text-[8.5px] font-bold bg-[#1e2a38] text-gray-300 border border-gray-600">
                        IND
                      </span>
                    )}
                  </div>
                  <div className="text-[8.5px] text-gray-400 truncate mb-1">{meta.name}</div>

                  {/* PV, SV, MV Readings */}
                  <div className="space-y-0.5 text-[9.5px] font-mono mb-1 bg-[#000000] p-1 border border-[#141f2c]">
                    <div className="flex justify-between font-bold">
                      <span className="text-gray-400">PV</span>
                      <span className={hasAlarm ? 'text-red-500' : 'text-cyan-300'}>
                        {pv.toFixed(meta.decimals ?? 1)}
                      </span>
                    </div>
                    {isController && (
                      <>
                        <div className="flex justify-between text-amber-300 font-bold">
                          <span className="text-gray-400">SV</span>
                          <span>{sp.toFixed(meta.decimals ?? 1)}</span>
                        </div>
                        <div className="flex justify-between text-emerald-400">
                          <span className="text-gray-400">MV</span>
                          <span>{mv.toFixed(1)}%</span>
                        </div>
                      </>
                    )}
                    {!isController && (
                      <div className="text-[8px] text-gray-500 text-right truncate">
                        [{meta.engineeringUnit}]
                      </div>
                    )}
                  </div>
                </div>

                {/* Vertical Bar Gauge (Yokogawa Style) */}
                <div className="flex items-center justify-center my-1">
                  <div className="relative w-6 h-48 bg-[#020406] border border-gray-700 flex flex-col justify-between">
                    {/* PV Fill */}
                    <div
                      className={`absolute bottom-0 w-full ${hasAlarm ? 'bg-red-500' : 'bg-emerald-500'}`}
                      style={{ height: `${pvPercent}%` }}
                    ></div>
                    {/* SP Target Line (for controllers only) */}
                    {isController && (
                      <div
                        className="absolute w-full h-1 bg-amber-400 z-10"
                        style={{ bottom: `${spPercent}%` }}
                      ></div>
                    )}
                    {/* Scale limits */}
                    <div className="absolute top-0.5 right-0.5 text-[7px] text-gray-400 font-bold">{rangeMax}</div>
                    <div className="absolute bottom-0.5 right-0.5 text-[7px] text-gray-400 font-bold">{rangeMin}</div>
                  </div>
                </div>

                {/* Bottom Control / Info */}
                {isController ? (
                  <div className="grid grid-cols-2 gap-1 pt-1 border-t border-[#141f2c]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setControllerMode(tagId, 'MAN');
                      }}
                      className={`py-0.5 text-[8.5px] font-bold border ${
                        mode === 'MAN'
                          ? 'bg-amber-600 text-white border-amber-400'
                          : 'bg-[#1a2433] text-gray-400 border-gray-700'
                      }`}
                    >
                      MAN
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setControllerMode(tagId, 'AUTO');
                      }}
                      className={`py-0.5 text-[8.5px] font-bold border ${
                        mode === 'AUTO'
                          ? 'bg-emerald-600 text-white border-emerald-400'
                          : 'bg-[#1a2433] text-gray-400 border-gray-700'
                      }`}
                    >
                      AUT
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-1 text-[8px] text-gray-500 border-t border-[#141f2c]">
                    INDICATOR ONLY
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Tuning & Setpoint Command Strip */}
        {selectedTag && activeTagObj && activeMeta && (
          <div className="bg-[#0e1622] border-t border-[#1e2d42] p-2 flex items-center justify-between">
            <div className="flex items-center gap-4 text-[11px]">
              <span className="font-bold text-white bg-[#1a2738] px-2 py-0.5 border border-gray-700">
                SELECTED: {selectedTag}
              </span>
              <span className="text-gray-300">{activeMeta.name}</span>
              <span className="text-cyan-300">
                RANGE: {activeMeta.rangeMin} .. {activeMeta.rangeMax} {activeMeta.engineeringUnit}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {isSelectedController ? (
                <>
                  {/* Setpoint input */}
                  <form onSubmit={handleSetSP} className="flex items-center gap-1.5">
                    <span className="text-amber-400 font-bold text-[11px]">SET SV:</span>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="SP value"
                      value={inputVal}
                      onChange={(e) => setInputVal(e.target.value)}
                      className="bg-[#000000] border border-gray-600 text-white px-2 py-0.5 text-[11px] w-24 font-mono outline-none focus:border-cyan-400"
                    />
                    <button
                      type="submit"
                      className="bg-[#2f435a] hover:bg-[#3d5673] text-white px-2 py-0.5 font-bold text-[10px] border border-gray-600"
                    >
                      <Check size={11} />
                    </button>
                  </form>

                  {/* Slider for MV (in MAN mode) */}
                  {activeTagObj.mode === 'MAN' && (
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold text-[11px]">MAN MV%:</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={activeTagObj.mv || 0}
                        onChange={(e) => setControllerMV(selectedTag, parseFloat(e.target.value))}
                        className="w-24 accent-emerald-500 cursor-pointer"
                      />
                      <span className="text-white font-bold text-[11px]">{(activeTagObj.mv || 0).toFixed(0)}%</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-[10px] text-amber-400 font-bold border border-amber-800 bg-amber-950/40 px-2 py-0.5">
                  READ-ONLY PROCESS TRANSMITTER (NO SETPOINT / OUTPUT ADJUSTMENT)
                </div>
              )}

              <button
                onClick={() => openFaceplate(selectedTag)}
                className="bg-[#1f3044] hover:bg-[#2b425d] text-white px-3 py-1 font-bold text-[11px] border border-blue-500"
              >
                OPEN FACEPLATE (L3)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
