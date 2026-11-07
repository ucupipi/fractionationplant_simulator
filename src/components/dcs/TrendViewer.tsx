import React, { useState } from 'react';
import { useSimulationStore } from '../../stores/simulationStore';
import { useDCSStore } from '../../stores/dcsStore';
import { TAG_METADATA_REGISTRY } from '../../data/tags';
import { TrendingUp, Plus, X, Download } from 'lucide-react';

export const TrendViewer: React.FC = () => {
  const { tags, history } = useSimulationStore();
  const { trendTagIds, setTrendTags, trendTimeWindowMinutes, setTrendTimeWindow } = useDCSStore();

  const [selectedTagToAdd, setSelectedTagToAdd] = useState<string>('PIC3');

  const colors = ['#00e5ff', '#ffd600', '#00e676', '#ff4081', '#7c4dff', '#ff9100'];

  const handleAddTag = () => {
    if (!trendTagIds.includes(selectedTagToAdd) && trendTagIds.length < 6) {
      setTrendTags([...trendTagIds, selectedTagToAdd]);
    }
  };

  const handleRemoveTag = (tagId: string) => {
    setTrendTags(trendTagIds.filter((t) => t !== tagId));
  };

  // Find time range and values for Canvas plotting
  const renderTrendCanvas = () => {
    // Generate SVG multi-pen curves
    const width = 850;
    const height = 360;

    return (
      <svg width={width} height={height} className="w-full h-full bg-[#05080f] rounded border border-gray-800">
        {/* Grid lines */}
        {[0.2, 0.4, 0.6, 0.8].map((frac) => (
          <line
            key={frac}
            x1="50"
            y1={height * frac}
            x2={width - 20}
            y2={height * frac}
            stroke="#1f293d"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        ))}

        {/* Time axis markers */}
        {[0.25, 0.5, 0.75, 1.0].map((frac) => (
          <line
            key={frac}
            x1={50 + (width - 70) * frac}
            y1="20"
            x2={50 + (width - 70) * frac}
            y2={height - 30}
            stroke="#1f293d"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        ))}

        {/* Multi-pen Curves */}
        {trendTagIds.map((tagId, penIdx) => {
          const tagHist = history[tagId] || [];
          const meta = TAG_METADATA_REGISTRY[tagId];
          const color = colors[penIdx % colors.length];

          if (!tagHist || tagHist.length < 2 || !meta) return null;

          const rangeMin = meta.rangeMin;
          const rangeMax = meta.rangeMax;
          const range = rangeMax - rangeMin || 100;

          const points = tagHist
            .map((d, i) => {
              const x = 50 + (i / (tagHist.length - 1)) * (width - 70);
              const y = height - 30 - ((d.pv - rangeMin) / range) * (height - 60);
              return `${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join(' ');

          return (
            <g key={tagId}>
              {/* PV Line */}
              <polyline
                fill="none"
                stroke={color}
                strokeWidth={2}
                points={points}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Last Point Marker */}
              {tagHist.length > 0 && (
                <circle
                  cx={width - 20}
                  cy={height - 30 - ((tagHist[tagHist.length - 1].pv - rangeMin) / range) * (height - 60)}
                  r={3.5}
                  fill={color}
                />
              )}
            </g>
          );
        })}

        {/* Y Axis Labels (0% to 100% Normalized Span) */}
        <text x="15" y="30" fill="#9ca3af" fontSize="9" fontFamily="monospace">100%</text>
        <text x="15" y={height / 2} fill="#9ca3af" fontSize="9" fontFamily="monospace">50%</text>
        <text x="15" y={height - 30} fill="#9ca3af" fontSize="9" fontFamily="monospace">0%</text>
      </svg>
    );
  };

  return (
    <div className="h-full w-full p-4 bg-[#080d16] text-gray-200 font-mono text-xs overflow-y-auto select-none">
      {/* Title & Controls Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-cyan-400" />
          <h1 className="text-sm font-bold text-cyan-300 tracking-wider">
            LEVEL 4 — REALTIME MULTI-PEN PROCESS TREND VIEWER
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Window Buttons */}
          <div className="flex items-center gap-1 bg-[#101726] p-0.5 rounded border border-gray-700">
            {[10, 60, 0].map((mins) => (
              <button
                key={mins}
                onClick={() => setTrendTimeWindow(mins)}
                className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                  trendTimeWindowMinutes === mins ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:bg-gray-800'
                }`}
              >
                {mins === 0 ? 'SESSION' : `${mins} MIN`}
              </button>
            ))}
          </div>

          {/* Add Tag Dropdown */}
          <div className="flex items-center gap-1">
            <select
              value={selectedTagToAdd}
              onChange={(e) => setSelectedTagToAdd(e.target.value)}
              className="bg-[#101726] border border-gray-700 text-cyan-300 px-2 py-1 rounded text-xs outline-none"
            >
              {Object.keys(TAG_METADATA_REGISTRY).map((id) => (
                <option key={id} value={id}>
                  {id} — {TAG_METADATA_REGISTRY[id].name}
                </option>
              ))}
            </select>
            <button
              onClick={handleAddTag}
              disabled={trendTagIds.length >= 6}
              className="flex items-center gap-1 bg-cyan-700 hover:bg-cyan-600 text-white px-2.5 py-1 rounded font-bold shadow"
            >
              <Plus size={12} />
              ADD PEN
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Plot */}
      <div className="mb-4 h-96">{renderTrendCanvas()}</div>

      {/* Pens Legend & Current Value Readings */}
      <div className="grid grid-cols-6 gap-3">
        {trendTagIds.map((tagId, penIdx) => {
          const tag = tags[tagId];
          const meta = TAG_METADATA_REGISTRY[tagId];
          const color = colors[penIdx % colors.length];

          if (!tag || !meta) return null;

          return (
            <div
              key={tagId}
              className="bg-[#0f1726] border rounded p-2.5 flex flex-col justify-between"
              style={{ borderColor: color }}
            >
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></span>
                  <span className="font-bold text-white text-xs">{tagId}</span>
                </div>
                <button
                  onClick={() => handleRemoveTag(tagId)}
                  className="text-gray-500 hover:text-red-400"
                >
                  <X size={12} />
                </button>
              </div>

              <div className="text-[10px] text-gray-400 mb-2 truncate">{meta.name}</div>

              <div className="space-y-0.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-400">PV:</span>
                  <span className="font-bold text-white">
                    {tag.measuredValue.toFixed(meta.decimals ?? 1)} {meta.engineeringUnit}
                  </span>
                </div>
                {tag.sp !== undefined && (
                  <div className="flex justify-between text-[10px] text-amber-400">
                    <span>SP:</span>
                    <span>{tag.sp.toFixed(meta.decimals ?? 1)}</span>
                  </div>
                )}
                {tag.mv !== undefined && (
                  <div className="flex justify-between text-[10px] text-emerald-400">
                    <span>MV:</span>
                    <span>{tag.mv.toFixed(1)}%</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
