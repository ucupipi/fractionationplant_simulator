import React, { useState } from 'react';
import { useSimulationStore } from '../../stores/simulationStore';
import { useDCSStore } from '../../stores/dcsStore';
import { ControlGroupView } from '../../components/dcs/ControlGroupView';
import { DraggableTag } from '../../components/dcs/layout/DraggableTag';
import { DraggableAnnotation } from '../../components/dcs/layout/DraggableAnnotation';
import { DraggableProcessLine } from '../../components/dcs/layout/DraggableProcessLine';
import { DraggableInstrumentSymbol } from '../../components/dcs/layout/DraggableInstrumentSymbol';
import { ProcessLineDrawer } from '../../components/dcs/layout/ProcessLineDrawer';
import { LayoutEditorToolbar } from '../../components/dcs/layout/LayoutEditorToolbar';
import { useLayoutStore } from '../../stores/useLayoutStore';

export const RefrigerationGraphic: React.FC = () => {
  const { tags, pumps } = useSimulationStore();
  const { openFaceplate, openPumpPopup, openTransmitterPopup, setActiveScreen, userRole } = useDCSStore();

  const [activeCG, setActiveCG] = useState<{ id: string; tags: string[]; title: string } | null>(null);
  const allAnnotations = useLayoutStore((s) => s.annotations);
  const annotations = React.useMemo(() => allAnnotations.filter((a) => a.screenId === 'REFRIGERATION'), [allAnnotations]);
  const allLines = useLayoutStore((s) => s.lines);
  const lines = React.useMemo(() => allLines.filter((l) => l.screenId === 'REFRIGERATION'), [allLines]);
  const allSymbols = useLayoutStore((s) => s.symbols);
  const symbols = React.useMemo(() => allSymbols.filter((s) => s.screenId === 'REFRIGERATION'), [allSymbols]);

  const renderTag = (
    tagId: string,
    x: number,
    y: number,
    label?: string,
    unit?: string,
    isController: boolean = false,
    color: string = '#00e5ff'
  ) => {
    const tag = tags[tagId];
    const val = tag ? tag.measuredValue.toFixed(tagId.includes('PI') ? 2 : (tagId.includes('TIC155') ? 2 : 1)) : '0.0';
    const hasAlarm = tag && tag.alarmState !== 'NORMAL';
    const isUnack = tag && tag.alarmState === 'ACTIVE_UNACK';

    return (
      <DraggableTag
        key={tagId}
        screenId="REFRIGERATION"
        tagId={tagId}
        defaultX={x}
        defaultY={y}
        onClick={(e) => {
          e.stopPropagation();
          openFaceplate(tagId);
        }}
        renderContent={() => (
          <g>
            <text x="0" y="0" fill="#ffffff" fontSize="10.5" fontFamily="monospace" fontWeight="bold">
              {label || tagId}
            </text>
            <text
              x="0"
              y="12"
              fill={hasAlarm ? '#ef4444' : color}
              fontSize="11"
              fontFamily="monospace"
              fontWeight="bold"
              className={isUnack ? 'animate-pulse' : ''}
            >
              {val} {unit || ''}
            </text>
          </g>
        )}
      />
    );
  };

  const renderPump = (pumpId: string, x: number, y: number, label: string) => {
    const pump = pumps[pumpId];
    const isRunning = pump?.running;
    const isTripped = pump?.tripped;

    return (
      <DraggableTag
        key={pumpId}
        screenId="REFRIGERATION"
        tagId={pumpId}
        defaultX={x}
        defaultY={y}
        onClick={(e) => {
          e.stopPropagation();
          openPumpPopup(pumpId);
        }}
        renderContent={() => (
          <g>
            <text x="-35" y="10" fill="#ffffff" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
              {label}
            </text>
            <circle cx="0" cy="-4" r="8" fill="#1e293b" stroke="#ffffff" strokeWidth="1.2" />
            <text x="0" y="-1" fill="#ffffff" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              M
            </text>
            <rect
              x="-10"
              y="6"
              width="20"
              height="16"
              fill={isTripped ? '#dc2626' : isRunning ? '#16a34a' : '#dc2626'}
              stroke="#ffffff"
              strokeWidth="1"
              className={isTripped ? 'animate-pulse' : ''}
            />
          </g>
        )}
      />
    );
  };

  return (
    <div className="h-full w-full relative bg-black flex flex-col justify-between select-none">
      <div className="flex-1 min-h-0 flex items-center justify-center p-1">
        <svg
          viewBox="0 0 1000 560"
          className="w-full h-full max-h-[85vh] font-mono"
          preserveAspectRatio="xMidYMid meet"
        >
          <rect width="1000" height="560" fill="#000000" />

          {/* Centered Graphic Title */}
          <text x="500" y="28" fill="#ffffff" fontSize="16" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle" letterSpacing="2">
            REFRIGERATION
          </text>

          {/* ==================== 1. 3E-5 ETHANE CONDENSER CHILLER ==================== */}
          <g stroke="#00e5ff" strokeWidth="2.5" fill="none">
            {/* Propane refrigerant supply & return */}
            <path d="M 120,95 L 430,95 L 430,115" />
            <path d="M 520,115 L 520,95 L 850,95" />
          </g>
          <text x="120" y="90" fill="#00e5ff" fontSize="10" fontWeight="bold">3C-4</text>
          <text x="855" y="90" fill="#00e5ff" fontSize="10" fontWeight="bold">3C-5</text>
          <text x="430" y="75" fill="#00e5ff" fontSize="9.5" fontWeight="bold">4C-4</text>
          <text x="520" y="75" fill="#00e5ff" fontSize="9.5" fontWeight="bold">4E-12</text>

          {/* 3E-5 Chiller Vessel */}
          <g transform="translate(430, 110)">
            <path d="M 0,15 L 20,15 L 20,5 L 85,5 Q 95,20 85,35 L 20,35 L 20,25 L 0,25 Z" fill="#042f1a" stroke="#22c55e" strokeWidth="2.5" />
            <text x="50" y="24" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">3E-5</text>
          </g>

          {renderTag('LIC4', 360, 125, 'LIC4', '%', true, '#00e5ff')}
          {renderTag('TI177', 535, 125, 'TI177', '°C', false, '#00e5ff')}

          {/* ==================== 2. 3E-12 PROPANE SUBCOOLER CHILLER ==================== */}
          <g stroke="#00e5ff" strokeWidth="2.5" fill="none">
            <path d="M 120,225 L 430,225 L 430,245" />
            <path d="M 520,245 L 520,225 L 850,225" />
          </g>
          <text x="120" y="220" fill="#00e5ff" fontSize="10" fontWeight="bold">3G-6A/B/C</text>
          <text x="855" y="220" fill="#00e5ff" fontSize="10" fontWeight="bold">20C-5</text>
          <text x="430" y="205" fill="#00e5ff" fontSize="9.5" fontWeight="bold">5E-2</text>

          {/* 3E-12 Chiller Vessel */}
          <g transform="translate(430, 240)">
            <path d="M 0,15 L 20,15 L 20,5 L 85,5 Q 95,20 85,35 L 20,35 L 20,25 L 0,25 Z" fill="#042f1a" stroke="#22c55e" strokeWidth="2.5" />
            <text x="50" y="24" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">3E-12</text>
          </g>

          {renderTag('LIC8', 360, 255, 'LIC8', '%', true, '#00e5ff')}
          {renderTag('TI179', 535, 255, 'TI179', '°C', false, '#00e5ff')}
          {renderTag('FIC9', 610, 220, 'FIC9', 'M3/H', true, '#00e5ff')}
          {renderTag('FIC94', 710, 220, 'FIC94', 'M3/H', true, '#00e5ff')}

          {/* ==================== 3. 3E-13 BUTANE SUBCOOLER CHILLER ==================== */}
          <g stroke="#00e5ff" strokeWidth="2.5" fill="none">
            <path d="M 120,355 L 430,355 L 430,375" />
            <path d="M 520,375 L 520,355 L 850,355" />
          </g>
          <text x="120" y="350" fill="#00e5ff" fontSize="10" fontWeight="bold">3G-7A/B</text>
          <text x="855" y="350" fill="#00e5ff" fontSize="10" fontWeight="bold">C4 TO LPG STG</text>

          {/* 3E-13 Chiller Vessel */}
          <g transform="translate(430, 370)">
            <path d="M 0,15 L 20,15 L 20,5 L 85,5 Q 95,20 85,35 L 20,35 L 20,25 L 0,25 Z" fill="#042f1a" stroke="#22c55e" strokeWidth="2.5" />
            <text x="50" y="24" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">3E-13</text>
          </g>

          {renderTag('LIC35', 360, 385, 'LIC35', '%', true, '#00e5ff')}
          {renderTag('TIC155', 535, 365, 'TIC155', '°C', true, '#00e5ff')}
          {renderTag('TI178', 535, 400, 'TI178', '°C', false, '#00e5ff')}
          {renderTag('FIC34', 610, 350, 'FIC34', 'M3/H', true, '#00e5ff')}
          {renderTag('FIC92', 710, 350, 'FIC92', 'M3/H', true, '#00e5ff')}

          {/* ==================== 4. BOOSTER PUMPS 3G-5A/B & RECYCLE ==================== */}
          <g stroke="#ffffff" strokeWidth="2" fill="none">
            <path d="M 230,465 L 280,465" />
            <path d="M 280,465 L 280,435 L 310,435" />
            <path d="M 280,465 L 280,495 L 310,495" />
            <path d="M 350,435 L 380,435 L 380,465 L 430,465" />
            <path d="M 350,495 L 380,495 L 380,465" />
            <path d="M 430,465 L 850,465" />
          </g>
          <text x="855" y="460" fill="#ffffff" fontSize="10" fontWeight="bold">5E-1</text>
          <text x="855" y="475" fill="#ffffff" fontSize="10" fontWeight="bold">3C-2</text>

          {renderPump('3G-5A', 330, 425, '3G-5A')}
          {renderPump('3G-5B', 330, 485, '3G-5B')}

          {renderTag('PI33', 440, 485, 'PI33', 'KGC2G', false, '#00e5ff')}
          {renderTag('FIC10', 570, 455, 'FIC10', 'M3/H', true, '#00e5ff')}
          <text x="655" y="470" fill="#ef4444" fontSize="8.5" fontWeight="bold">PALL100B</text>

          {/* Level Transmitters & Split Range Interconnect */}
          <g transform="translate(180, 275)">
            <text x="0" y="0" fill="#00e5ff" fontSize="9">HIC114</text>
            <text x="0" y="12" fill="#00e5ff" fontSize="9" fontWeight="bold">65.0 %</text>
            <text x="50" y="0" fill="#ffffff" fontSize="8">LY10A</text>
            <text x="50" y="12" fill="#ffffff" fontSize="8">LY10B</text>
          </g>

          <g transform="translate(180, 400)">
            <text x="0" y="0" fill="#00e5ff" fontSize="9">HIC116</text>
            <text x="0" y="12" fill="#00e5ff" fontSize="9" fontWeight="bold">62.0 %</text>
            <text x="50" y="0" fill="#ffffff" fontSize="8">LY12A</text>
            <text x="50" y="12" fill="#ffffff" fontSize="8">LY12B</text>
          </g>

          {/* ==================== CUSTOMIZABLE PROCESS & SIGNAL LINES ==================== */}
          {lines.map((l) => (
            <DraggableProcessLine key={l.id} line={l} />
          ))}

          {/* ==================== CUSTOMIZABLE INSTRUMENT & VALVE SYMBOLS ==================== */}
          {symbols.map((s) => (
            <DraggableInstrumentSymbol key={s.id} symbol={s} />
          ))}

          {/* ==================== INTERVIEW / ASSESSMENT ANNOTATIONS ==================== */}
          {annotations.map((ann) => (
            <DraggableAnnotation key={ann.id} annotation={ann} />
          ))}

          {/* ==================== INTERACTIVE PROCESS LINE DRAWING CANVAS ==================== */}
          <ProcessLineDrawer screenId="REFRIGERATION" />
        </svg>
      </div>

      {/* Floating Layout Editor Toolbar */}
      <LayoutEditorToolbar screenId="REFRIGERATION" />

      {/* ==================== BOTTOM CONTROL GROUP (CG) & TREND (TG) DOCK ==================== */}
      <div className="bg-[#121927] border-t border-[#1e2d42] p-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {[
            { id: 'CG0137', label: 'CG0137', tags: ['LIC4', 'TI177', 'LIC8', 'TI179', 'LIC35', 'TIC155', 'TI178', 'PI33'], title: 'REFRIGERATION CHILLER LEVELS & TEMPS' },
            { id: 'CG0138', label: 'CG0138', tags: ['FIC9', 'FIC94', 'FIC34', 'FIC92', 'FIC10', 'HIC114', 'HIC116', 'PI33'], title: 'REFRIGERANT & SUBCOOLED RUNOUTS' },
            { id: 'CG0139', label: 'CG0139', tags: ['3G-5A', '3G-5B', 'PI33', 'FIC10', 'PALL100B', 'LIC35', 'TIC155', 'TI178'], title: '3G-5 BOOSTER PUMPS & BUTANE CHILLER' },
            { id: 'CG0140', label: 'CG0140', tags: ['LIC4', 'LIC8', 'LIC35', 'HIC114', 'HIC116', 'FIC10', 'FIC92', 'FIC94'], title: 'SPLIT RANGE REFRIGERATION VALVES' }
          ].map((cg) => (
            <button
              key={cg.id}
              onClick={() => setActiveCG({ id: cg.id, tags: cg.tags, title: cg.title })}
              className="bg-[#1e2d42] hover:bg-[#2b3e5a] text-white px-3 py-1.5 rounded font-mono font-bold text-xs border border-gray-700 shadow"
            >
              {cg.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => useDCSStore.getState().setActiveScreen('TREND')}
            className="bg-[#1e2d42] hover:bg-[#2b3e5a] text-cyan-300 px-3 py-1.5 rounded font-mono font-bold text-xs border border-cyan-800 shadow"
          >
            TG0116
          </button>
          <button
            onClick={() => setActiveScreen('SCRUB')}
            className="bg-[#1e2d42] hover:bg-[#2b3e5a] text-white px-2.5 py-1.5 rounded font-mono text-xs border border-gray-700 shadow"
          >
            GRH0033
          </button>
          <button
            onClick={() => setActiveScreen('DE_ETHANIZER')}
            className="bg-[#1e2d42] hover:bg-[#2b3e5a] text-white px-2.5 py-1.5 rounded font-mono text-xs border border-gray-700 shadow"
          >
            GRH0034
          </button>
          <button
            onClick={() => setActiveScreen('DE_PROPANIZER')}
            className="bg-[#1e2d42] hover:bg-[#2b3e5a] text-white px-2.5 py-1.5 rounded font-mono text-xs border border-gray-700 shadow"
          >
            GRH0035
          </button>
        </div>
      </div>

      {activeCG && (
        <ControlGroupView
          groupId={activeCG.id}
          tagIds={activeCG.tags}
          title={activeCG.title}
          onClose={() => setActiveCG(null)}
        />
      )}
    </div>
  );
};
