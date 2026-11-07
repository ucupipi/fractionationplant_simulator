import React, { useState } from 'react';
import { useSimulationStore } from '../../stores/simulationStore';
import { useDCSStore } from '../../stores/dcsStore';
import { ControlGroupView } from '../../components/dcs/ControlGroupView';
import { DraggableTag } from '../../components/dcs/layout/DraggableTag';
import { DraggableAnnotation } from '../../components/dcs/layout/DraggableAnnotation';
import { DraggableProcessLine } from '../../components/dcs/layout/DraggableProcessLine';
import { DraggableInstrumentSymbol } from '../../components/dcs/layout/DraggableInstrumentSymbol';
import {
  ShellAndTubeExchangerSymbol,
} from '../../components/dcs/symbols/HeatExchangerSymbols';
import { ProcessLineDrawer } from '../../components/dcs/layout/ProcessLineDrawer';
import { LayoutEditorToolbar } from '../../components/dcs/layout/LayoutEditorToolbar';
import { useLayoutStore } from '../../stores/useLayoutStore';

/* ══════════════════════════════════════════════════════════════════════════
   Yokogawa Centum VP DCS Color Palette — matched to Picture2.png
   ══════════════════════════════════════════════════════════════════════════ */
const C = {
  bg: '#000000',
  green: '#00ff00',      // equipment outlines, pump symbols, utility CW/MLP STM
  cyan: '#00ffff',       // process lines, tag labels, instrument text
  white: '#ffffff',      // secondary lines, value text, piping
  yellow: '#ffff00',     // LP STM utility lines & labels
  orange: '#e69138',     // COND labels & condensate lines
  red: '#ff1e1e',        // alarm, UV7 valve, tripped pump
  magenta: '#d946ef',    // C3/C4 product stream lines & labels
  blue: '#00b0ff',       // liquid level fill in column sump
  levelWhite: '#e0f7fa', // liquid level fill in drum 3C-5
  pumpGreen: '#19ff19',  // pump motor running indicator
  alarmRed: '#ff2020',   // alarm flash
  signal: '#0080ff',     // instrument signal lines (dashed)
};

const FONT = 'Courier New, monospace';

type ActiveCG = { id: string; tags: string[]; title: string } | null;

export const DeEthanizerGraphic: React.FC = () => {
  const { tags, pumps, setControllerMV, setControllerMode } = useSimulationStore();
  const { openFaceplate, openPumpPopup } = useDCSStore();

  const [activeCG, setActiveCG] = useState<ActiveCG>(null);
  const allAnnotations = useLayoutStore((s) => s.annotations);
  const annotations = React.useMemo(() => allAnnotations.filter((a) => a.screenId === 'DE_ETHANIZER'), [allAnnotations]);
  const allLines = useLayoutStore((s) => s.lines);
  const lines = React.useMemo(() => allLines.filter((l) => l.screenId === 'DE_ETHANIZER'), [allLines]);
  const allSymbols = useLayoutStore((s) => s.symbols);
  const symbols = React.useMemo(() => allSymbols.filter((s) => s.screenId === 'DE_ETHANIZER'), [allSymbols]);
  const isEditMode = useLayoutStore((s) => s.isEditMode);

  /* ── helpers ── */
  const measured = (tagId: string, fallback = 0) => {
    const v = tags[tagId]?.measuredValue;
    return typeof v === 'number' && isFinite(v) ? v : fallback;
  };

  /* ═══════════════════════════════════════════════════════════════════
     renderTag — Yokogawa DCS tag display block
     Format: TAG_ID label on top (white), PV value + unit below (cyan)
     ═══════════════════════════════════════════════════════════════════ */
  const renderTag = (
    tagId: string,
    x: number,
    y: number,
    label?: string,
    unit?: string,
    decimals = 1,
    color = C.cyan
  ) => {
    const tag = tags[tagId];
    const val = tag ? tag.measuredValue.toFixed(decimals) : '0.0';
    const hasAlarm = tag && tag.alarmState !== 'NORMAL';
    const isUnack = tag && tag.alarmState === 'ACTIVE_UNACK';

    return (
      <DraggableTag
        key={tagId}
        screenId="DE_ETHANIZER"
        tagId={tagId}
        defaultX={x}
        defaultY={y}
        onClick={(e) => { e.stopPropagation(); openFaceplate(tagId); }}
        renderContent={() => (
          <g>
            <text x="0" y="0" fill={C.white} fontSize="9" fontFamily={FONT} fontWeight="bold">
              {label || tagId}
            </text>
            <text
              x="0"
              y="12"
              fill={hasAlarm ? C.alarmRed : color}
              fontSize="10"
              fontFamily={FONT}
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

  /* ═══════════════════════════════════════════════════════════════════
     renderPump — Yokogawa pump symbol: circle M + status rect
     ═══════════════════════════════════════════════════════════════════ */
  const renderPump = (pumpId: string, x: number, y: number, label: string) => {
    const pump = pumps[pumpId];
    const isRunning = pump?.running;
    const isTripped = pump?.tripped;
    const motorFill = isTripped ? C.alarmRed : isRunning ? C.pumpGreen : C.alarmRed;

    return (
      <DraggableTag
        key={pumpId}
        screenId="DE_ETHANIZER"
        tagId={pumpId}
        defaultX={x}
        defaultY={y}
        onClick={(e) => { e.stopPropagation(); openPumpPopup(pumpId); }}
        renderContent={() => (
          <g>
            {/* Label */}
            <text x="0" y="-18" fill={C.green} fontSize="9" fontFamily={FONT} fontWeight="bold" textAnchor="middle">
              {label}
            </text>
            {/* Motor shaft top */}
            <line x1="0" y1="-15" x2="0" y2="-9" stroke={C.green} strokeWidth="1" />
            {/* Motor circle */}
            <circle cx="0" cy="-2" r="8" fill={C.bg} stroke={C.green} strokeWidth="1.2" />
            <text x="0" y="1.5" fill={C.green} fontSize="8" fontFamily={FONT} fontWeight="bold" textAnchor="middle">
              M
            </text>
            {/* Motor shaft bottom */}
            <line x1="0" y1="6" x2="0" y2="12" stroke={C.green} strokeWidth="1" />
            {/* Status rectangle */}
            <rect x="-8" y="12" width="16" height="14" fill={C.bg} stroke={C.green} strokeWidth="1" />
            <rect x="-5.5" y="14.5" width="11" height="9" fill={motorFill} className={isTripped ? 'animate-pulse' : ''} />
          </g>
        )}
      />
    );
  };

  /* ═══════════════════════════════════════════════════════════════════
     Control Valve symbol — two tip-to-tip triangles with diaphragm
     ═══════════════════════════════════════════════════════════════════ */
  const renderControlValve = (
    x: number, y: number,
    color = C.green,
    rotation = 0,
    size = 1
  ) => (
    <g transform={`translate(${x},${y}) rotate(${rotation}) scale(${size})`}>
      {/* Bowtie body (tip-to-tip triangles) */}
      <path d="M -6,-5 L 0,0 L -6,5 Z" fill="none" stroke={color} strokeWidth="1.4" />
      <path d="M 6,-5 L 0,0 L 6,5 Z" fill="none" stroke={color} strokeWidth="1.4" />
      {/* Stem */}
      <line x1="0" y1="-5" x2="0" y2="-10" stroke={color} strokeWidth="1.2" />
      {/* Diaphragm actuator hat */}
      <line x1="-4" y1="-10" x2="4" y2="-10" stroke={color} strokeWidth="1.6" />
    </g>
  );

  /* ═══════════════════════════════════════════════════════════════════
     Manual / Block Valve symbol — bowtie without actuator
     ═══════════════════════════════════════════════════════════════════ */
  const renderBlockValve = (
    x: number, y: number,
    color = C.green,
    rotation = 0,
    size = 1
  ) => (
    <g transform={`translate(${x},${y}) rotate(${rotation}) scale(${size})`}>
      <path d="M -5,-4 L 0,0 L -5,4 Z" fill="none" stroke={color} strokeWidth="1.3" />
      <path d="M 5,-4 L 0,0 L 5,4 Z" fill="none" stroke={color} strokeWidth="1.3" />
    </g>
  );

  /* ═══════════════════════════════════════════════════════════════════
     CG / TG buttons — Yokogawa 3D beveled style
     ═══════════════════════════════════════════════════════════════════ */
  const renderButton = (label: string, x: number, width: number, onClick: () => void) => (
    <g transform={`translate(${x} 530)`} onClick={onClick} style={{ cursor: 'pointer' }}>
      <rect x="0" y="0" width={width} height="24" fill="#bfbfbf" stroke="#6b6b6b" strokeWidth="1" />
      <line x1="1" y1="1" x2={width - 1} y2="1" stroke="#ffffff" strokeWidth="1.3" />
      <line x1="1" y1="1" x2="1" y2="23" stroke="#ffffff" strokeWidth="1.3" />
      <line x1="1" y1="23" x2={width - 1} y2="23" stroke="#565656" strokeWidth="1.3" />
      <line x1={width - 1} y1="1" x2={width - 1} y2="23" stroke="#565656" strokeWidth="1.3" />
      <text x={width / 2} y="16" fill="#101010" fontSize="10" fontFamily={FONT} fontWeight="bold" textAnchor="middle">{label}</text>
    </g>
  );

  /* ═══════════════════════════════════════════════════════════════════
     Dynamic levels — bound to simulation tags
     ═══════════════════════════════════════════════════════════════════ */
  const sumpLevelPercent = Math.max(0, Math.min(100, measured('LIC5', 50.4)));
  const drumLevelPercent = Math.max(0, Math.min(100, measured('LIC6', 44.3)));
  const hic16MV = tags['HIC16']?.mv ?? 0.0;
  const isHic16Open = hic16MV > 0;

  const handleToggleHic16 = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEditMode) return;
    const nextMV = isHic16Open ? 0 : 100;
    setControllerMode('HIC16', 'MAN');
    setControllerMV('HIC16', nextMV);
  };

  /* ═══════════════════════════════════════════════════════════════════
     Column 3C-4 — Stepped column geometry (Picture2.png)
     Upper section (rectification) is narrower, lower section (stripping/sump) wider
     with conical transition between them
     ═══════════════════════════════════════════════════════════════════ */
  // Upper (narrow) section
  const colUpperX = 278;
  const colUpperY = 68;
  const colUpperW = 50;
  const colUpperH = 155;
  const colUpperCx = colUpperX + colUpperW / 2;
  const colUpperDome = colUpperW / 2;

  // Lower (wide) section
  const colLowerX = 265;
  const colLowerW = 76;
  const colLowerH = 190;
  const colLowerCx = colLowerX + colLowerW / 2;
  const colLowerDome = colLowerW / 2;
  // Transition Y is where upper meets lower
  const colTransY = colUpperY + colUpperH;
  const colBottomY = colTransY + colLowerH;

  // Sump fill
  const sumpZoneH = 90;
  const sumpFillH = (sumpLevelPercent / 100) * sumpZoneH;
  const sumpFillY = colBottomY - colLowerDome - sumpFillH;

  /* ── 3C-5 Drum geometry ── */
  const drumX = 540;
  const drumY = 245;
  const drumW = 170;
  const drumH = 48;
  const drumRx = drumH / 2;
  const drumFillH = (drumLevelPercent / 100) * drumH;
  const drumFillY = drumY + drumH - drumFillH;

  return (
    <div className="h-full w-full relative bg-black flex flex-col justify-between select-none">
      <div className="flex-1 min-h-0 flex items-center justify-center p-1">
        <svg
          viewBox="0 0 1000 560"
          className="w-full h-full max-h-[85vh] font-mono"
          preserveAspectRatio="xMidYMid meet"
        >
          <rect width="1000" height="560" fill={C.bg} />

          {/* ═══════════════════════════════════════════════════
              DEFS — clip paths for liquid fills
              ═══════════════════════════════════════════════════ */}
          <defs>
            {/* Sump clip for lower section of 3C-4 */}
            <clipPath id="sump3C4-clip">
              <path d={`
                M ${colLowerX},${colTransY}
                L ${colLowerX + colLowerW},${colTransY}
                L ${colLowerX + colLowerW},${colBottomY - colLowerDome}
                A ${colLowerDome},${colLowerDome} 0 0,1 ${colLowerX},${colBottomY - colLowerDome}
                Z
              `} />
            </clipPath>
            {/* Drum clip for 3C-5 */}
            <clipPath id="drum3C5-clip">
              <rect x={drumX} y={drumY} width={drumW} height={drumH} rx={drumRx} />
            </clipPath>
          </defs>

          {/* ═══════════════════════════════════════════════════
              TITLE
              ═══════════════════════════════════════════════════ */}
          <text x="500" y="28" fill={C.white} fontSize="16" fontFamily={FONT} fontWeight="bold" textAnchor="middle" letterSpacing="3">
            DE - ETHANIZER COLUMN
          </text>

          {/* ═══════════════════════════════════════════════════════════════
              1. FEED LINES & 3E-14 COOLER (LEFT SIDE)
              ═══════════════════════════════════════════════════════════════ */}

          {/* 3C-2 BTM & 3C-1 BTM feed labels */}
          <text x="30" y="78" fill={C.cyan} fontSize="9" fontFamily={FONT} fontWeight="bold">3C-2 BTM</text>
          <text x="30" y="108" fill={C.cyan} fontSize="9" fontFamily={FONT} fontWeight="bold">3C-1 BTM</text>

          {/* Feed piping: 3C-2 BTM horizontal to X-OVER tee */}
          <line x1="90" y1="75" x2="195" y2="75" stroke={C.cyan} strokeWidth="1.5" />
          {/* Arrow on 3C-2 BTM */}
          <polygon points="90,75 96,72 96,78" fill={C.cyan} />

          {/* X-OVER vertical riser */}
          <line x1="195" y1="60" x2="195" y2="105" stroke={C.cyan} strokeWidth="1.5" />
          <text x="200" y="58" fill={C.cyan} fontSize="9" fontFamily={FONT} fontWeight="bold">X-OVER</text>
          {/* TO 5PIC 30 branch going up with valve */}
          <line x1="195" y1="60" x2="220" y2="60" stroke={C.cyan} strokeWidth="1" />
          <line x1="220" y1="60" x2="220" y2="45" stroke={C.cyan} strokeWidth="1" />
          <text x="225" y="52" fill={C.cyan} fontSize="7" fontFamily={FONT}>TO</text>
          <text x="225" y="62" fill={C.cyan} fontSize="7" fontFamily={FONT}>5PIC 30</text>
          {renderBlockValve(220, 52, C.green, 90, 0.7)}

          {/* 3C-1 BTM horizontal to junction */}
          <line x1="90" y1="105" x2="195" y2="105" stroke={C.cyan} strokeWidth="1.5" />
          <polygon points="90,105 96,102 96,108" fill={C.cyan} />

          {/* Combined feed from junction to 3E-14 */}
          <line x1="195" y1="105" x2="195" y2="130" stroke={C.cyan} strokeWidth="1.5" />
          <line x1="130" y1="130" x2="195" y2="130" stroke={C.cyan} strokeWidth="1.5" />

          {/* 3E-14 Shell & Tube Heat Exchanger */}
          <ShellAndTubeExchangerSymbol
            x={85}
            y={118}
            width={95}
            height={35}
            tag="3E-14"
            color={C.green}
            fillColor={C.bg}
          />
          {/* CW label below 3E-14 */}
          <text x="133" y="168" fill={C.green} fontSize="9" fontFamily={FONT} fontWeight="bold" textAnchor="middle">CW</text>
          {/* CW piping down from 3E-14 */}
          <line x1="133" y1="153" x2="133" y2="162" stroke={C.green} strokeWidth="1" />

          {/* Piping from 3E-14 outlet to column 3C-4 feed nozzle */}
          <line x1="180" y1="130" x2="240" y2="130" stroke={C.cyan} strokeWidth="1.5" />
          <line x1="240" y1="130" x2="240" y2="155" stroke={C.cyan} strokeWidth="1.5" />
          <line x1="240" y1="155" x2={colUpperX} y2="155" stroke={C.cyan} strokeWidth="1.5" />

          {/* TI172 on feed line */}
          {renderTag('TI172', 225, 98, 'TI172', '°C', 1)}

          {/* ═══════════════════════════════════════════════════════════════
              2. 3C-4 DISTILLATION COLUMN — STEPPED SHAPE
              Upper (narrow) rectification + conical transition + lower (wide) stripping
              ═══════════════════════════════════════════════════════════════ */}

          {/* Upper section: hemispherical top + rectangle body */}
          <path
            d={`
              M ${colUpperX},${colUpperY + colUpperDome}
              A ${colUpperDome},${colUpperDome} 0 0,1 ${colUpperX + colUpperW},${colUpperY + colUpperDome}
              L ${colUpperX + colUpperW},${colTransY}
              L ${colUpperX},${colTransY}
              Z
            `}
            fill="#0a1520"
            stroke={C.green}
            strokeWidth="2"
          />

          {/* Conical transition (swage) from upper to lower */}
          <path
            d={`
              M ${colUpperX},${colTransY}
              L ${colLowerX},${colTransY + 15}
              L ${colLowerX + colLowerW},${colTransY + 15}
              L ${colUpperX + colUpperW},${colTransY}
              Z
            `}
            fill="#0a1520"
            stroke={C.green}
            strokeWidth="2"
          />

          {/* Lower section: rectangle body + hemispherical bottom */}
          <path
            d={`
              M ${colLowerX},${colTransY + 15}
              L ${colLowerX + colLowerW},${colTransY + 15}
              L ${colLowerX + colLowerW},${colBottomY - colLowerDome}
              A ${colLowerDome},${colLowerDome} 0 0,1 ${colLowerX},${colBottomY - colLowerDome}
              Z
            `}
            fill="#0a1520"
            stroke={C.green}
            strokeWidth="2"
          />

          {/* Internal tray lines — upper section */}
          {[0.2, 0.35, 0.5, 0.65, 0.8].map((frac, i) => (
            <line
              key={`upper-tray-${i}`}
              x1={colUpperX + 4}
              y1={colUpperY + colUpperDome + (colUpperH - colUpperDome) * frac}
              x2={colUpperX + colUpperW - 4}
              y2={colUpperY + colUpperDome + (colUpperH - colUpperDome) * frac}
              stroke={C.green}
              strokeWidth="0.5"
              opacity="0.3"
            />
          ))}

          {/* Internal tray lines — lower section */}
          {[0.15, 0.3, 0.45, 0.6].map((frac, i) => (
            <line
              key={`lower-tray-${i}`}
              x1={colLowerX + 5}
              y1={colTransY + 15 + (colLowerH - colLowerDome - 15) * frac}
              x2={colLowerX + colLowerW - 5}
              y2={colTransY + 15 + (colLowerH - colLowerDome - 15) * frac}
              stroke={C.green}
              strokeWidth="0.5"
              opacity="0.3"
            />
          ))}

          {/* Liquid sump fill (dynamic level) */}
          <rect
            x={colLowerX + 1}
            y={sumpFillY}
            width={colLowerW - 2}
            height={sumpFillH}
            fill={C.blue}
            opacity="0.8"
            clipPath="url(#sump3C4-clip)"
          />

          {/* Column label */}
          <text x={colUpperCx} y={colUpperY + 55} fill={C.green} fontSize="13" fontFamily={FONT} fontWeight="bold" textAnchor="middle">
            3C-4
          </text>

          {/* ═══════════════════════════════════════════════════════════════
              3. COLUMN TAGS — positioned matching Picture2.png
              ═══════════════════════════════════════════════════════════════ */}

          {/* Overhead area tags */}
          {renderTag('PIC3', 340, 72, 'PIC3', 'KGC2G', 2)}
          {renderTag('TI175', 360, 112, 'TI175', '°C', 1)}
          {renderTag('TI304', 360, 145, 'TI304', '°C', 1)}
          {renderTag('TI171', 360, 180, 'TI171', '°C', 1)}
          {renderTag('TI305', 360, 215, 'TI305', '°C', 1)}

          {/* Left side of column */}
          {renderTag('TIC3', 70, 210, 'TIC3', '°C', 1)}
          {renderTag('TDIC3', 155, 238, 'TDIC3', '°C', 2)}
          {renderTag('TI3A', 150, 275, 'TI3A', '°C', 1)}

          {/* Lower column area */}
          {renderTag('TI170', 175, 318, 'TI170', '°C', 1)}
          {renderTag('TI197', 175, 348, 'TI197', '°C', 1)}
          {renderTag('LIC5', 370, 306, 'LIC5', '%', 1)}
          {renderTag('TI306', 330, 340, 'TI306', '°C', 1)}
          {renderTag('FIC6', 370, 248, 'FIC6', 'M3/H', 2)}

          {/* ═══════════════════════════════════════════════════════════════
              4. OVERHEAD PIPING — from top of 3C-4 to 3E-5
              ═══════════════════════════════════════════════════════════════ */}

          {/* Overhead vapor line out of column top going right */}
          <line x1={colUpperCx} y1={colUpperY} x2={colUpperCx} y2={colUpperY - 10} stroke={C.cyan} strokeWidth="1.5" />
          <line x1={colUpperCx} y1={colUpperY - 10} x2="380" y2={colUpperY - 10} stroke={C.cyan} strokeWidth="1.5" />
          <line x1="380" y1={colUpperY - 10} x2="380" y2="100" stroke={C.cyan} strokeWidth="1.5" />
          {/* Continue to 3E-5 inlet */}
          <line x1="380" y1="100" x2="380" y2="130" stroke={C.cyan} strokeWidth="1.5" />

          {/* PIC3 control valve on overhead line */}
          {renderControlValve(350, 62, C.green, 0, 0.9)}

          {/* 4C-4 branch off overhead */}
          <line x1="480" y1="60" x2="530" y2="60" stroke={C.cyan} strokeWidth="1" />
          <line x1="530" y1="60" x2="530" y2="80" stroke={C.cyan} strokeWidth="1" />
          <text x="530" y="55" fill={C.cyan} fontSize="9" fontFamily={FONT} fontWeight="bold">4C-4</text>

          {/* ═══════════════════════════════════════════════════════════════
              5. 3E-5 CHILLER / CONDENSER
              ═══════════════════════════════════════════════════════════════ */}
          <ShellAndTubeExchangerSymbol
            x={430}
            y={100}
            width={95}
            height={35}
            tag="3E-5"
            color={C.green}
            fillColor={C.bg}
          />

          {/* 5E-2 ref below 3E-5 */}
          <text x="495" y="150" fill={C.cyan} fontSize="8" fontFamily={FONT}>5E-2</text>

          {/* 4E-12 below 3E-5 */}
          <line x1="480" y1="135" x2="480" y2="165" stroke={C.green} strokeWidth="1" />
          <text x="485" y="170" fill={C.cyan} fontSize="8" fontFamily={FONT}>4E-12</text>

          {/* Chiller tags */}
          {renderTag('TI302', 418, 78, 'TI302', '°C', 1)}
          {renderTag('TI301', 515, 78, 'TI301', '°C', 1)}
          {renderTag('LIC4', 540, 130, 'LIC4', '%', 1)}
          {renderTag('TI169', 450, 188, 'TI169', '°C', 1)}

          {/* Piping from 3E-5 outlet to 3C-5 */}
          <line x1="525" y1="118" x2="560" y2="118" stroke={C.cyan} strokeWidth="1.5" />
          <line x1="560" y1="118" x2="560" y2="200" stroke={C.cyan} strokeWidth="1.5" />
          <line x1="560" y1="200" x2="600" y2="200" stroke={C.cyan} strokeWidth="1.5" />
          <line x1="600" y1="200" x2="600" y2={drumY} stroke={C.cyan} strokeWidth="1.5" />

          {/* ═══════════════════════════════════════════════════════════════
              6. 3C-5 REFLUX ACCUMULATOR DRUM
              ═══════════════════════════════════════════════════════════════ */}

          {/* Horizontal drum with hemispherical ends */}
          <rect
            x={drumX}
            y={drumY}
            width={drumW}
            height={drumH}
            rx={drumRx}
            fill="#0a1520"
            stroke={C.green}
            strokeWidth="2"
          />

          {/* Dynamic liquid fill */}
          <rect
            x={drumX}
            y={drumFillY}
            width={drumW}
            height={drumFillH}
            fill={C.levelWhite}
            opacity="0.7"
            clipPath="url(#drum3C5-clip)"
          />

          {/* Drum label */}
          <text x={drumX + drumW / 2} y={drumY + drumH / 2 + 4} fill={C.green} fontSize="12" fontFamily={FONT} fontWeight="bold" textAnchor="middle">
            3C-5
          </text>

          {/* Drum tags */}
          {renderTag('TI307', 555, 230, 'TI307', '°C', 2)}
          {renderTag('LIC6', 730, 215, 'LIC6', '%', 1)}

          {/* FI36 on overhead vapor line from drum */}
          {renderTag('FI36', 625, 200, 'FI36', 'NM3/H', 0)}

          {/* ═══════════════════════════════════════════════════════════════
              7. 3E-17 OFF-GAS HEATER (top right)
              ═══════════════════════════════════════════════════════════════ */}

          {/* Overhead vapor from drum 3C-5 going to right side */}
          <line x1={drumX + drumW / 2} y1={drumY} x2={drumX + drumW / 2} y2="200" stroke={C.white} strokeWidth="1.5" />
          <line x1={drumX + drumW / 2} y1="200" x2="650" y2="200" stroke={C.white} strokeWidth="1" />

          {/* Vapor to 3E-17 */}
          <line x1="650" y1="120" x2="650" y2="200" stroke={C.white} strokeWidth="1.5" />
          <line x1="650" y1="120" x2="700" y2="120" stroke={C.white} strokeWidth="1.5" />

          {/* 3E-17 heat exchanger */}
          <ShellAndTubeExchangerSymbol
            x={700}
            y={108}
            width={80}
            height={35}
            tag="3E-17"
            color={C.green}
            fillColor={C.bg}
          />

          {/* UV7 Safety Relief Valve Symbol on 3E-17 */}
          <g transform="translate(742, 100)">
            <path d="M 0,10 L 0,0" stroke={C.red} strokeWidth="1.5" fill="none" />
            <path d="M -5,0 L 5,-8 L 5,0 L -5,-8 Z" fill="#1e293b" stroke={C.red} strokeWidth="1.2" />
            <text x="8" y="-2" fill={C.red} fontSize="8" fontFamily={FONT} fontWeight="bold">UV7</text>
          </g>

          {/* LP STM piping (Yellow) — steam supply to 3E-17 from right */}
          <line x1="830" y1="85" x2="830" y2="115" stroke={C.yellow} strokeWidth="1.5" />
          <line x1="780" y1="115" x2="830" y2="115" stroke={C.yellow} strokeWidth="1.5" />
          {renderControlValve(810, 100, C.yellow, 0, 0.8)}
          <text x="840" y="90" fill={C.yellow} fontSize="9" fontFamily={FONT} fontWeight="bold">FUEL GAS</text>
          <text x="840" y="102" fill={C.yellow} fontSize="9" fontFamily={FONT} fontWeight="bold">LP STM</text>

          {/* 5E-1 outlet from UV7 */}
          <line x1="755" y1="92" x2="830" y2="92" stroke={C.red} strokeWidth="1" />
          <text x="835" y="95" fill={C.white} fontSize="8" fontFamily={FONT} fontWeight="bold">5E-1</text>

          {/* COND drain from 3E-17 */}
          <line x1="742" y1="143" x2="742" y2="165" stroke={C.orange} strokeWidth="1" />
          <text x="700" y="173" fill={C.orange} fontSize="9" fontFamily={FONT} fontWeight="bold">COND</text>

          {/* C4 and C3 product branches (magenta) */}
          <line x1="780" y1="143" x2="780" y2="160" stroke={C.magenta} strokeWidth="1" />
          <line x1="780" y1="160" x2="870" y2="160" stroke={C.magenta} strokeWidth="1" />
          <text x="875" y="157" fill={C.magenta} fontSize="9" fontFamily={FONT} fontWeight="bold">C4</text>
          <line x1="780" y1="175" x2="870" y2="175" stroke={C.magenta} strokeWidth="1" />
          <text x="875" y="178" fill={C.magenta} fontSize="9" fontFamily={FONT} fontWeight="bold">C3</text>

          {/* 3E-17 area tags */}
          {renderTag('FI89', 640, 90, 'FI89', 'NM3/H', 0)}
          {renderTag('TI168', 640, 130, 'TI168', '°C', 1)}
          {renderTag('FI5', 830, 118, 'FI5', 'M3/H', 2)}

          {/* ═══════════════════════════════════════════════════════════════
              8. 3E-4 REBOILER (bottom left of column)
              ═══════════════════════════════════════════════════════════════ */}

          {/* Reboiler exchanger */}
          <ShellAndTubeExchangerSymbol
            x={115}
            y={388}
            width={95}
            height={35}
            tag="3E-4"
            color={C.green}
            fillColor={C.bg}
          />

          {/* Piping: column bottom to reboiler inlet */}
          <line x1={colLowerCx} y1={colBottomY - 10} x2={colLowerCx} y2="435" stroke={C.cyan} strokeWidth="1.5" />
          <line x1="210" y1="435" x2={colLowerCx} y2="435" stroke={C.cyan} strokeWidth="1.5" />
          <line x1="210" y1="405" x2="210" y2="435" stroke={C.cyan} strokeWidth="1.5" />

          {/* Reboiler vapor return to column */}
          <line x1="163" y1="388" x2="163" y2="360" stroke={C.cyan} strokeWidth="1.5" />
          <line x1="163" y1="360" x2={colLowerX} y2="360" stroke={C.cyan} strokeWidth="1.5" />

          {/* MLP STM inlet to reboiler (green) */}
          <line x1="55" y1="340" x2="90" y2="340" stroke={C.green} strokeWidth="1.5" />
          <line x1="90" y1="340" x2="90" y2="395" stroke={C.green} strokeWidth="1.5" />
          <line x1="90" y1="395" x2="115" y2="395" stroke={C.green} strokeWidth="1.5" />
          <text x="42" y="335" fill={C.green} fontSize="9" fontFamily={FONT} fontWeight="bold">MLP</text>
          <text x="42" y="347" fill={C.green} fontSize="9" fontFamily={FONT} fontWeight="bold">STM</text>
          {renderBlockValve(90, 355, C.green, 90, 0.8)}

          {/* COND drain from reboiler */}
          <line x1="115" y1="415" x2="115" y2="430" stroke={C.orange} strokeWidth="1" />
          <text x="100" y="442" fill={C.orange} fontSize="9" fontFamily={FONT} fontWeight="bold">COND</text>

          {/* Bottom runout piping from column sump to right → 3C-6 */}
          <line x1={colLowerX + colLowerW} y1="400" x2="365" y2="400" stroke={C.cyan} strokeWidth="1.5" />
          {renderBlockValve(355, 400, C.green, 0, 0.8)}
          {renderBlockValve(380, 400, C.green, 0, 0.8)}
          <line x1="390" y1="400" x2="420" y2="400" stroke={C.cyan} strokeWidth="1.5" />
          {/* Control valve FIC11 on bottom runout */}
          {renderControlValve(400, 400, C.green, 0, 0.9)}
          <line x1="415" y1="400" x2="450" y2="400" stroke={C.cyan} strokeWidth="1.5" />
          {/* Arrow to 3C-6 */}
          <polygon points="450,400 444,397 444,403" fill={C.cyan} />
          <text x="455" y="403" fill={C.cyan} fontSize="10" fontFamily={FONT} fontWeight="bold">3C-6</text>

          {/* Reboiler / bottom tags */}
          {renderTag('FIC11', 370, 378, 'FIC11', 'M3/H', 1)}
          {renderTag('TI174', 330, 440, 'TI174', '°C', 1)}

          {/* ═══════════════════════════════════════════════════════════════
              9. REFLUX PIPING — from 3C-5 drum bottom through pumps
              ═══════════════════════════════════════════════════════════════ */}

          {/* Pump suction from drum bottom */}
          <line x1={drumX + 60} y1={drumY + drumH} x2={drumX + 60} y2="310" stroke={C.cyan} strokeWidth="1.5" />
          <line x1={drumX + 60} y1="310" x2="575" y2="310" stroke={C.cyan} strokeWidth="1.5" />

          {/* Branch to 3G-2A */}
          <line x1="575" y1="310" x2="575" y2="325" stroke={C.cyan} strokeWidth="1" />

          {/* Branch to 3G-2B */}
          <line x1="575" y1="310" x2="575" y2="390" stroke={C.cyan} strokeWidth="1" />

          {/* 3G-2A & 3G-2B pumps */}
          {renderPump('3G-2A', 555, 330, '3G-2A')}
          {renderPump('3G-2B', 555, 390, '3G-2B')}

          {/* Pump discharge header going right */}
          <line x1="570" y1="360" x2="620" y2="360" stroke={C.cyan} strokeWidth="1.5" />
          <line x1="620" y1="360" x2="620" y2="330" stroke={C.cyan} strokeWidth="1.5" />
          <line x1="620" y1="330" x2="660" y2="330" stroke={C.cyan} strokeWidth="1.5" />

          {/* Reflux branch going left back to column top */}
          <line x1="660" y1="250" x2="660" y2="330" stroke={C.cyan} strokeWidth="1.5" />
          <line x1="400" y1="250" x2="660" y2="250" stroke={C.cyan} strokeWidth="1.5" />
          <line x1="400" y1="155" x2="400" y2="250" stroke={C.cyan} strokeWidth="1.5" />
          <line x1={colUpperX + colUpperW} y1="155" x2="400" y2="155" stroke={C.cyan} strokeWidth="1.5" />
          {renderControlValve(430, 250, C.green, 0, 0.9)}

          {/* FIC8 branch — C2 forward flow */}
          <line x1="660" y1="330" x2="750" y2="330" stroke={C.cyan} strokeWidth="1.5" />
          {renderControlValve(720, 330, C.green, 0, 0.9)}

          {/* HIC111 split valve further right */}
          <line x1="750" y1="330" x2="830" y2="330" stroke={C.cyan} strokeWidth="1.5" />

          {/* C2 TO STG outlet */}
          <line x1="830" y1="330" x2="830" y2="390" stroke={C.cyan} strokeWidth="1.5" />
          <line x1="830" y1="390" x2="930" y2="390" stroke={C.white} strokeWidth="1.5" />
          <polygon points="930,390 924,387 924,393" fill={C.white} />
          <text x="870" y="386" fill={C.white} fontSize="9" fontFamily={FONT} fontWeight="bold">C2 TO STG</text>

          {/* 5C-1 outlet going down */}
          <line x1="830" y1="390" x2="830" y2="440" stroke={C.white} strokeWidth="1" />
          <line x1="830" y1="440" x2="900" y2="440" stroke={C.white} strokeWidth="1" />
          <text x="875" y="455" fill={C.white} fontSize="9" fontFamily={FONT} fontWeight="bold">5C-1</text>

          {/* FIC7 branch to runout */}
          <line x1="660" y1="370" x2="660" y2="380" stroke={C.cyan} strokeWidth="1" />
          <line x1="660" y1="380" x2="700" y2="380" stroke={C.cyan} strokeWidth="1" />

          {/* Pump & reflux tags */}
          {renderTag('FIC8', 680, 315, 'FIC8', 'M3/H', 2)}
          {renderTag('HIC111', 810, 310, 'HIC111', '%', 1)}
          {renderTag('FIC7', 680, 370, 'FIC7', 'M3/H', 2)}

          {/* ═══════════════════════════════════════════════════════════════
              10. HIC16 BLOWDOWN VALVE & LTSS HDR
              ═══════════════════════════════════════════════════════════════ */}
          <g
            transform="translate(590, 438)"
            className="cursor-pointer group"
            onClick={handleToggleHic16}
          >
            <path
              d="M -8,5 L 8,-5 L 8,5 L -8,-5 Z"
              fill={isHic16Open ? '#10b981' : '#1e293b'}
              stroke={isHic16Open ? '#10b981' : C.white}
              strokeWidth="1.5"
            />
            <path d="M 0,-5 L 0,-12" stroke={isHic16Open ? '#10b981' : C.white} strokeWidth="1.5" />
            <path d="M -6,-12 L 6,-12" stroke={isHic16Open ? '#10b981' : C.white} strokeWidth="2" />
          </g>
          <text x="610" y="460" fill={C.white} fontSize="9" fontFamily={FONT} fontWeight="bold">LTSS HDR</text>
          {renderTag('HIC16', 540, 440, 'HIC16', '%', 1, isHic16Open ? '#10b981' : C.cyan)}
          {renderTag('FIC82', 650, 455, 'FIC82', 'M3/H', 3)}

          {/* ═══════════════════════════════════════════════════════════════
              11. AI23 ANALYZER BLOCK (Quality Composition)
              ═══════════════════════════════════════════════════════════════ */}
          <g fontFamily={FONT} fontWeight="bold">
            <text x="845" y="340" fill={C.cyan} fontSize="9.5">AI23</text>
            {[
              { label: 'C1', value: measured('AI23A', 0.00), dec: 2 },
              { label: 'C2', value: measured('AI23B', 0.0), dec: 1 },
              { label: 'C3', value: measured('AI23C', 3.35), dec: 2 },
              { label: 'iC4', value: measured('AI23D', 0.00), dec: 2 },
              { label: 'nC4', value: measured('AI23E', 0.00), dec: 2 },
            ].map((item, idx) => (
              <React.Fragment key={item.label}>
                <text x="810" y={355 + idx * 14} fill={C.cyan} fontSize="8.5">{item.label}</text>
                <text x="838" y={355 + idx * 14} fill={C.white} fontSize="9" fontWeight="bold">{item.value.toFixed(item.dec)}</text>
                <text x="878" y={355 + idx * 14} fill={C.cyan} fontSize="8">%</text>
              </React.Fragment>
            ))}
          </g>

          {/* ═══════════════════════════════════════════════════════════════
              CUSTOMIZABLE LAYERS (drag-and-drop overlay)
              ═══════════════════════════════════════════════════════════════ */}
          {lines.map((l) => (
            <DraggableProcessLine key={l.id} line={l} />
          ))}
          {symbols.map((s) => (
            <DraggableInstrumentSymbol key={s.id} symbol={s} />
          ))}
          {annotations.map((ann) => (
            <DraggableAnnotation key={ann.id} annotation={ann} />
          ))}
          <ProcessLineDrawer screenId="DE_ETHANIZER" />

          {/* ═══════════════════════════════════════════════════════════════
              CG / TG NAVIGATION BUTTONS (bottom bar)
              ═══════════════════════════════════════════════════════════════ */}
          {renderButton('CG0111', 60, 90, () => setActiveCG({ id: 'CG0111', tags: ['PIC3', 'TIC3', 'TDIC3', 'TI3A', 'TI175', 'TI304', 'TI171', 'TI305'], title: '3C-4 TEMPERATURE PROFILE & PRESSURE' }))}
          {renderButton('CG0112', 160, 90, () => setActiveCG({ id: 'CG0112', tags: ['TIC3', 'TI170', 'TI197', 'TI306', 'TI174', 'LIC5', 'FIC11', '3C-4_DP'], title: '3E-4 REBOILER & BOTTOM SUMP' }))}
          {renderButton('CG0113', 260, 90, () => setActiveCG({ id: 'CG0113', tags: ['PIC3', 'TI302', 'TI301', 'LIC4', 'TI169', '3E-5_DUTY', 'TI168', 'FI89'], title: '3E-5 CHILLER & 3E-17 HEATER' }))}
          {renderButton('CG0114', 360, 90, () => setActiveCG({ id: 'CG0114', tags: ['LIC6', 'TI307', 'FIC6', 'FIC7', 'FIC8', 'FIC82', 'HIC111', 'HIC16'], title: '3C-5 DRUM & REFLUX / C2 RUNOUT' }))}
          {renderButton('CG0115', 460, 90, () => setActiveCG({ id: 'CG0115', tags: ['AI23_C1', 'AI23_C2', 'AI23_C3', 'AI23_IC4', 'AI23_NC4', 'FI5', 'FI36', 'FIC6'], title: 'AI23 QUALITY ANALYZER & DRAWS' }))}
          {renderButton('TG0006', 600, 80, () => useDCSStore.getState().setActiveScreen('TREND'))}
          {renderButton('TG0110', 690, 80, () => useDCSStore.getState().setActiveScreen('TREND'))}
          {renderButton('TG0111', 780, 80, () => useDCSStore.getState().setActiveScreen('TREND'))}
        </svg>
      </div>

      {/* Floating Layout Editor Toolbar */}
      <LayoutEditorToolbar screenId="DE_ETHANIZER" />

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
