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

export const OverviewGraphic: React.FC = () => {
  const { tags, pumps } = useSimulationStore();
  const { openFaceplate, openPumpPopup, openTransmitterPopup, userRole, setActiveScreen } = useDCSStore();

  const [activeCG, setActiveCG] = useState<{ id: string; tags: string[]; title: string } | null>(null);
  const allAnnotations = useLayoutStore((s) => s.annotations);
  const annotations = React.useMemo(() => allAnnotations.filter((a) => a.screenId === 'OVERVIEW'), [allAnnotations]);
  const allLines = useLayoutStore((s) => s.lines);
  const lines = React.useMemo(() => allLines.filter((l) => l.screenId === 'OVERVIEW'), [allLines]);
  const allSymbols = useLayoutStore((s) => s.symbols);
  const symbols = React.useMemo(() => allSymbols.filter((s) => s.screenId === 'OVERVIEW'), [allSymbols]);

  // Helper for rendering realistic Yokogawa text/value tags
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
    const val = tag
      ? tag.measuredValue.toFixed(
          tagId.includes('PI') || tagId.includes('DP') || tagId.includes('PDIC')
            ? 2
            : tagId.includes('AI')
            ? 1
            : 1
        )
      : '0.0';
    const hasAlarm = tag && tag.alarmState !== 'NORMAL';
    const isUnack = tag && tag.alarmState === 'ACTIVE_UNACK';

    return (
      <DraggableTag
        key={tagId}
        screenId="OVERVIEW"
        tagId={tagId}
        defaultX={x}
        defaultY={y}
        onClick={(e) => {
          e.stopPropagation();
          if (isController) openFaceplate(tagId);
          else if (userRole === 'INSTRUCTOR') openTransmitterPopup(tagId);
          else openFaceplate(tagId); // opens indicator faceplate
        }}
        renderContent={() => (
          <g>
            {/* Tag Name in crisp technical white */}
            <text x="0" y="0" fill="#ffffff" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
              {label || tagId}
            </text>
            {/* Value + Unit in Cyan / Red */}
            <text
              x="0"
              y="10.5"
              fill={hasAlarm ? '#ff3333' : color}
              fontSize="10"
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

  // Helper for rendering ISA standard pumps (circle with tangential triangle + motor circle)
  const renderPump = (pumpId: string, x: number, y: number, label: string) => {
    const pump = pumps[pumpId];
    const isRunning = pump?.running;
    const isTripped = pump?.tripped;

    return (
      <DraggableTag
        key={pumpId}
        screenId="OVERVIEW"
        tagId={pumpId}
        defaultX={x}
        defaultY={y}
        onClick={(e) => {
          e.stopPropagation();
          openPumpPopup(pumpId);
        }}
        renderContent={() => (
          <g>
            <text x="0" y="-12" fill="#ffffff" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              {label}
            </text>
            {/* Motor circle */}
            <circle cx="-6" cy="-2" r="5.5" fill="#1e2a38" stroke="#ffffff" strokeWidth="1" />
            <text x="-6" y="0.5" fill="#ffffff" fontSize="7" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              M
            </text>
            {/* Pump housing circle */}
            <circle
              cx="4"
              cy="-2"
              r="7"
              fill={isTripped ? '#ff0000' : isRunning ? '#00cc44' : '#ff0000'}
              stroke="#ffffff"
              strokeWidth="1"
            />
            {/* Impeller triangle */}
            <polygon points="4,-6 10,-2 4,2" fill="#ffffff" />
          </g>
        )}
      />
    );
  };

  // Helper for rendering Control Valves with Actuator
  const renderValve = (x: number, y: number, label: string, color: string = '#ffffff') => {
    return (
      <g transform={`translate(${x}, ${y})`} className="select-none">
        {/* Hourglass body */}
        <polygon points="-5,-4 5,4 5,-4 -5,4" fill="#000000" stroke={color} strokeWidth="1" />
        {/* Stem */}
        <line x1="0" y1="0" x2="0" y2="-6" stroke={color} strokeWidth="1" />
        {/* Actuator dome */}
        <path d="M -5,-6 Q 0,-11 5,-6 Z" fill="#1e2a38" stroke={color} strokeWidth="1" />
        <text x="0" y="11" fill="#ffffff" fontSize="7" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
          {label}
        </text>
      </g>
    );
  };

  // Helper for rendering Column with trays
  const renderColumn = (
    x: number,
    y: number,
    w: number,
    h: number,
    tag: string,
    traysCount: number = 8,
    levelPercent: number = 50,
    onClick?: () => void
  ) => {
    const r = w / 2;
    const traySpacing = (h - 40) / (traysCount + 1);

    return (
      <g
        transform={`translate(${x}, ${y})`}
        className="cursor-pointer select-none"
        onClick={onClick}
      >
        {/* Vessel Body: Dished top and bottom heads */}
        <path
          d={`M 0,${r} L 0,${h - r} Q ${r},${h} ${w},${h - r} L ${w},${r} Q ${r},0 0,${r} Z`}
          fill="#000000"
          stroke="#00e5ff"
          strokeWidth="1.5"
        />
        {/* Liquid Level in Sump */}
        <clipPath id={`clip-${tag}`}>
          <path d={`M 0.5,${h - r} Q ${r},${h - 0.5} ${w - 0.5},${h - r} L ${w - 0.5},${h - 40} L 0.5,${h - 40} Z`} />
        </clipPath>
        <rect
          x="0"
          y={h - (levelPercent / 100) * 35}
          width={w}
          height={(levelPercent / 100) * 35}
          fill="#00e5ff"
          clipPath={`url(#clip-${tag})`}
          opacity="0.6"
        />

        {/* Trays indication */}
        {Array.from({ length: traysCount }).map((_, i) => (
          <line
            key={i}
            x1="3"
            y1={25 + i * traySpacing}
            x2={w - 3}
            y2={25 + i * traySpacing}
            stroke="#475569"
            strokeWidth="1"
            strokeDasharray="2 1"
          />
        ))}

        {/* Column Tag Label */}
        <text
          x={r}
          y={h / 2}
          fill="#ffffff"
          fontSize="11"
          fontFamily="monospace"
          fontWeight="bold"
          textAnchor="middle"
        >
          {tag}
        </text>
      </g>
    );
  };

  // Helper for Shell & Tube Exchanger
  const renderExchanger = (
    x: number,
    y: number,
    w: number,
    h: number,
    tag: string,
    strokeColor: string = '#00cc66'
  ) => {
    return (
      <g transform={`translate(${x}, ${y})`} className="select-none">
        {/* Cylindrical Shell */}
        <rect x="0" y="0" width={w} height={h} rx={h / 2} fill="#000000" stroke={strokeColor} strokeWidth="1.2" />
        {/* Tube bundle lines */}
        <line x1="6" y1={h / 3} x2={w - 6} y2={h / 3} stroke="#475569" strokeWidth="0.8" />
        <line x1="6" y1={(2 * h) / 3} x2={w - 6} y2={(2 * h) / 3} stroke="#475569" strokeWidth="0.8" />
        <text
          x={w / 2}
          y={h / 2 + 3}
          fill="#ffffff"
          fontSize="8.5"
          fontFamily="monospace"
          fontWeight="bold"
          textAnchor="middle"
        >
          {tag}
        </text>
      </g>
    );
  };

  // Liquid levels
  const sump3C1 = tags['LIC2']?.measuredValue || 49.9;
  const sump3C4 = tags['LIC5']?.measuredValue || 50.4;
  const sump3C6 = tags['LIC9']?.measuredValue || 51.7;
  const sump3C8 = tags['LIC11']?.measuredValue || 59.0;

  return (
    <div className="h-full w-full relative bg-[#000000] flex flex-col justify-between select-none">
      {/* SVG Canvas Flowsheet matching Level 1 Plant-3 Overview */}
      <div className="flex-1 min-h-0 flex items-center justify-center p-1 bg-[#000000]">
        <svg
          viewBox="0 0 1000 560"
          className="w-full h-full max-h-[85vh] font-mono"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Pure Black Canvas Background */}
          <rect width="1000" height="560" fill="#000000" />

          {/* Graphic Title */}
          <text
            x="500"
            y="22"
            fill="#ffffff"
            fontSize="14"
            fontFamily="monospace"
            fontWeight="bold"
            textAnchor="middle"
            letterSpacing="1"
          >
            GRH0030 PLANT-3 FRACTIONATION TRAIN OVERVIEW (TRAIN-H)
          </text>

          {/* ==================== 1. FEED GAS & 4E-12 PROPANE CHILLER ==================== */}
          {/* Natural Gas Feed Line (Red) */}
          <g stroke="#ff3333" strokeWidth="1.5" fill="none">
            <path d="M 20,180 L 60,180 L 60,150 L 95,150" />
            <path d="M 145,150 L 175,150 L 175,185 L 205,185" />
          </g>
          <text x="20" y="172" fill="#ff3333" fontSize="9" fontWeight="bold">NG FEED</text>
          <text x="20" y="195" fill="#ffffff" fontSize="8">40.0 BAR</text>

          {/* 4E-12 Chiller Exchanger */}
          {renderExchanger(95, 140, 50, 20, '4E-12', '#d946ef')}

          {/* Propane refrigerant chilling lines to 4E-12 (Purple) */}
          <g stroke="#d946ef" strokeWidth="1" fill="none" strokeDasharray="3 1">
            <path d="M 120,110 L 120,140" />
            <path d="M 130,140 L 130,110" />
          </g>
          <text x="110" y="105" fill="#d946ef" fontSize="7.5" fontWeight="bold">C3 REF</text>

          {renderTag('2TI127', 40, 130, '2TI127', '°C', false, '#00e5ff')}
          {renderTag('TI158', 145, 130, 'TI158', '°C', false, '#00e5ff')}
          {renderTag('FI18', 20, 220, 'FI18', 'kNm3/h', false, '#00e5ff')}

          {/* ==================== 2. SCRUB COLUMN (3C-1) ==================== */}
          {renderColumn(205, 120, 50, 180, '3C-1', 7, sump3C1, () => setActiveScreen('SCRUB'))}

          {/* 3E-1 Reboiler (LP Steam) */}
          {renderExchanger(145, 270, 45, 20, '3E-1', '#eab308')}
          {/* Steam line (Yellow) */}
          <g stroke="#eab308" strokeWidth="1.2" fill="none">
            <path d="M 110,280 L 145,280" />
          </g>
          {renderValve(125, 280, '3TV-1', '#eab308')}
          <text x="95" y="278" fill="#eab308" fontSize="8" fontWeight="bold">50# STM</text>

          {/* Reboiler circulation (Cyan) */}
          <g stroke="#00e5ff" strokeWidth="1.2" fill="none">
            <path d="M 215,260 L 190,260 L 190,275" />
            <path d="M 190,285 L 215,285" />
          </g>

          {renderTag('TIC1', 140, 240, 'TIC1', '°C', true, '#00e5ff')}
          {renderTag('TI157', 140, 310, 'TI157', '°C', false, '#00e5ff')}
          {renderTag('LIC2', 260, 285, 'LIC2', '%', true, '#00e5ff')}

          {/* Overhead vapor to 3C-2 Condensate Drum (Red/Cyan) */}
          <g stroke="#ff3333" strokeWidth="1.5" fill="none">
            <path d="M 230,120 L 230,80 L 270,80" />
          </g>
          {renderExchanger(270, 70, 45, 20, '4E-14', '#d946ef')}

          <g stroke="#00e5ff" strokeWidth="1.5" fill="none">
            <path d="M 315,80 L 340,80 L 340,110" />
          </g>

          {/* 3C-2 Condensate Drum */}
          <rect x="325" y="110" width="30" height="50" rx="6" fill="#000000" stroke="#00e5ff" strokeWidth="1.2" />
          <text x="340" y="135" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">3C-2</text>

          {/* Overhead Gas to Main Cryogenic Heat Exchanger 5E-1 (White) */}
          <g stroke="#f8fafc" strokeWidth="1.5" fill="none">
            <path d="M 340,110 L 340,65 L 390,65" />
          </g>
          <text x="395" y="68" fill="#f8fafc" fontSize="9" fontWeight="bold">TO 5E-1 (MCHE)</text>
          {renderTag('TI159', 220, 60, 'TI159', '°C', false, '#00e5ff')}
          {renderTag('FI4', 335, 50, 'FI4', 'kNm3/h', false, '#00e5ff')}

          {/* 3G-1A/B Reflux Pump & line back to 3C-1 */}
          {renderPump('3G-1A', 300, 195, '3G-1')}
          <g stroke="#00e5ff" strokeWidth="1.2" fill="none">
            <path d="M 340,160 L 340,195 L 310,195" />
            <path d="M 290,195 L 265,195 L 265,145 L 255,145" />
          </g>
          {renderTag('FIC3', 270, 220, 'FIC3', 'm3/h', true, '#00e5ff')}

          {/* Bottom Hydrocarbon transfer from 3C-1 to 3E-14 Cooler & 3C-4 De-Ethanizer */}
          <g stroke="#00e5ff" strokeWidth="1.5" fill="none">
            <path d="M 230,300 L 230,350 L 390,350 L 390,250 L 415,250" />
          </g>
          {renderExchanger(330, 340, 45, 20, '3E-14', '#2563eb')}
          <text x="335" y="372" fill="#2563eb" fontSize="7.5" fontWeight="bold">CW COOL</text>
          {renderTag('FIC2', 260, 340, 'FIC2', 'm3/h', true, '#00e5ff')}
          {renderTag('TI161', 220, 320, 'TI161', '°C', false, '#00e5ff')}

          {/* ==================== 3. DE-ETHANIZER (3C-4) ==================== */}
          {renderColumn(415, 120, 50, 180, '3C-4', 8, sump3C4, () => setActiveScreen('DE_ETHANIZER'))}

          {/* 3E-4 Reboiler (Yellow) */}
          {renderExchanger(360, 270, 45, 20, '3E-4', '#eab308')}
          <g stroke="#eab308" strokeWidth="1.2" fill="none">
            <path d="M 325,280 L 360,280" />
          </g>
          {renderValve(340, 280, '3TV-4', '#eab308')}
          <g stroke="#00e5ff" strokeWidth="1.2" fill="none">
            <path d="M 425,260 L 405,260 L 405,275" />
            <path d="M 405,285 L 425,285" />
          </g>
          {renderTag('TIC3', 355, 240, 'TIC3', '°C', true, '#00e5ff')}
          {renderTag('LIC5', 470, 285, 'LIC5', '%', true, '#00e5ff')}
          {renderTag('PIC3', 415, 60, 'PIC3', 'kg/cm2', true, '#00e5ff')}

          {/* 3E-5 Overhead Condenser (Chilled by Propane Refrigerant) */}
          <g stroke="#ff3333" strokeWidth="1.5" fill="none">
            <path d="M 440,120 L 440,80 L 475,80" />
          </g>
          {renderExchanger(475, 70, 50, 20, '3E-5', '#d946ef')}
          <text x="480" y="62" fill="#d946ef" fontSize="7.5" fontWeight="bold">C3 REFRIG</text>

          {/* 3C-5 Reflux Drum */}
          <g stroke="#00e5ff" strokeWidth="1.5" fill="none">
            <path d="M 525,80 L 550,80 L 550,110" />
          </g>
          <rect x="535" y="110" width="30" height="50" rx="6" fill="#000000" stroke="#00e5ff" strokeWidth="1.2" />
          <text x="550" y="135" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">3C-5</text>

          {/* C2 Fuel Gas Overhead Product (White) */}
          <g stroke="#f8fafc" strokeWidth="1.5" fill="none">
            <path d="M 550,110 L 550,65 L 590,65" />
          </g>
          <text x="595" y="68" fill="#f8fafc" fontSize="9" fontWeight="bold">C2 FUEL GAS</text>
          {renderTag('TI171', 445, 95, 'TI171', '°C', false, '#00e5ff')}
          {renderTag('LIC4', 570, 130, 'LIC4', '%', true, '#00e5ff')}

          {/* 3G-2 Reflux Pump */}
          {renderPump('3G-2A', 510, 195, '3G-2')}
          <g stroke="#00e5ff" strokeWidth="1.2" fill="none">
            <path d="M 550,160 L 550,195 L 520,195" />
            <path d="M 500,195 L 475,195 L 475,145 L 465,145" />
          </g>
          {renderTag('FIC6', 480, 220, 'FIC6', 'm3/h', true, '#00e5ff')}

          {/* Bottom C3+ stream from 3C-4 to 3C-6 De-Propanizer */}
          <g stroke="#00e5ff" strokeWidth="1.5" fill="none">
            <path d="M 440,300 L 440,350 L 610,350 L 610,250 L 625,250" />
          </g>
          {renderTag('FIC11', 470, 340, 'FIC11', 'm3/h', true, '#00e5ff')}

          {/* ==================== 4. DE-PROPANIZER (3C-6) ==================== */}
          {renderColumn(625, 120, 50, 180, '3C-6', 9, sump3C6, () => setActiveScreen('DE_PROPANIZER'))}

          {/* 3E-7 Reboiler */}
          {renderExchanger(570, 270, 45, 20, '3E-7', '#eab308')}
          <g stroke="#eab308" strokeWidth="1.2" fill="none">
            <path d="M 535,280 L 570,280" />
          </g>
          {renderValve(550, 280, '3TV-6', '#eab308')}
          <g stroke="#00e5ff" strokeWidth="1.2" fill="none">
            <path d="M 635,260 L 615,260 L 615,275" />
            <path d="M 615,285 L 635,285" />
          </g>
          {renderTag('TIC5', 565, 240, 'TIC5', '°C', true, '#00e5ff')}
          {renderTag('LIC9', 680, 285, 'LIC9', '%', true, '#00e5ff')}
          {renderTag('PIC5', 625, 60, 'PIC5', 'kg/cm2', true, '#00e5ff')}

          {/* 3E-6 Condenser (Air Fin / CW) */}
          <g stroke="#ff3333" strokeWidth="1.5" fill="none">
            <path d="M 650,120 L 650,80 L 685,80" />
          </g>
          {renderExchanger(685, 70, 50, 20, '3E-6', '#2563eb')}
          <text x="690" y="62" fill="#2563eb" fontSize="7.5" fontWeight="bold">CW / FIN</text>

          {/* 3C-7 Reflux Drum */}
          <g stroke="#00e5ff" strokeWidth="1.5" fill="none">
            <path d="M 735,80 L 760,80 L 760,110" />
          </g>
          <rect x="745" y="110" width="30" height="50" rx="6" fill="#000000" stroke="#00e5ff" strokeWidth="1.2" />
          <text x="760" y="135" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">3C-7</text>

          {/* 3G-6 Reflux & Product Pump */}
          {renderPump('3G-6A', 720, 195, '3G-6')}
          <g stroke="#00e5ff" strokeWidth="1.2" fill="none">
            <path d="M 760,160 L 760,195 L 730,195" />
            <path d="M 710,195 L 685,195 L 685,145 L 675,145" />
            {/* Propane Product rundown */}
            <path d="M 730,195 L 730,230 L 780,230" />
          </g>
          {renderExchanger(780, 220, 45, 20, '3E-12', '#d946ef')}
          <g stroke="#f8fafc" strokeWidth="1.5" fill="none">
            <path d="M 825,230 L 890,230" />
          </g>
          <text x="895" y="233" fill="#f8fafc" fontSize="9" fontWeight="bold">C3 PROPANE PRODUCT</text>
          {renderTag('FIC12', 690, 220, 'FIC12', 'm3/h', true, '#00e5ff')}
          {renderTag('AI21_C3', 785, 260, 'AI21_C3', '%', false, '#00e5ff')}

          {/* Bottom C4+ stream from 3C-6 to 3C-8 De-Butanizer */}
          <g stroke="#00e5ff" strokeWidth="1.5" fill="none">
            <path d="M 650,300 L 650,350 L 815,350 L 815,250 L 830,250" />
          </g>
          {renderTag('FIC14', 680, 340, 'FIC14', 'm3/h', true, '#00e5ff')}

          {/* ==================== 5. DE-BUTANIZER (3C-8) ==================== */}
          {renderColumn(830, 120, 50, 180, '3C-8', 8, sump3C8, () => setActiveScreen('DE_BUTANIZER'))}

          {/* 3E-9 Reboiler */}
          {renderExchanger(775, 270, 45, 20, '3E-9', '#eab308')}
          <g stroke="#eab308" strokeWidth="1.2" fill="none">
            <path d="M 740,280 L 775,280" />
          </g>
          {renderValve(755, 280, '3TV-8', '#eab308')}
          <g stroke="#00e5ff" strokeWidth="1.2" fill="none">
            <path d="M 840,260 L 820,260 L 820,275" />
            <path d="M 820,285 L 840,285" />
          </g>
          {renderTag('TIC6', 770, 240, 'TIC6', '°C', true, '#00e5ff')}
          {renderTag('LIC11', 885, 285, 'LIC11', '%', true, '#00e5ff')}
          {renderTag('PIC7', 830, 60, 'PIC7', 'kg/cm2', true, '#00e5ff')}

          {/* 3E-8 Condenser (CW) */}
          <g stroke="#ff3333" strokeWidth="1.5" fill="none">
            <path d="M 855,120 L 855,80 L 890,80" />
          </g>
          {renderExchanger(890, 70, 50, 20, '3E-8', '#2563eb')}
          <text x="895" y="62" fill="#2563eb" fontSize="7.5" fontWeight="bold">CW COOL</text>

          {/* 3C-9 Reflux Drum */}
          <g stroke="#00e5ff" strokeWidth="1.5" fill="none">
            <path d="M 940,80 L 960,80 L 960,110" />
          </g>
          <rect x="945" y="110" width="30" height="50" rx="6" fill="#000000" stroke="#00e5ff" strokeWidth="1.2" />
          <text x="960" y="135" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">3C-9</text>

          {/* 3G-7 Reflux Pump & C4 Butane Product */}
          {renderPump('3G-7A', 925, 195, '3G-7')}
          <g stroke="#00e5ff" strokeWidth="1.2" fill="none">
            <path d="M 960,160 L 960,195 L 935,195" />
            <path d="M 915,195 L 890,195 L 890,145 L 880,145" />
            {/* Butane Product rundown through 3E-13 */}
            <path d="M 935,195 L 935,270 L 945,270" />
          </g>
          {renderExchanger(945, 260, 45, 20, '3E-13', '#d946ef')}
          <g stroke="#f8fafc" strokeWidth="1.5" fill="none">
            <path d="M 967,280 L 967,310 L 890,310" />
          </g>
          <text x="885" y="325" fill="#f8fafc" fontSize="9" fontWeight="bold">C4 BUTANE PRODUCT</text>
          {renderTag('FIC15', 895, 220, 'FIC15', 'm3/h', true, '#00e5ff')}

          {/* Bottom C5+ Gasoline Product via 3G-11 & 3E-10 Cooler */}
          <g stroke="#00e5ff" strokeWidth="1.5" fill="none">
            <path d="M 855,300 L 855,420 L 895,420" />
          </g>
          {renderPump('3G-11A', 895, 420, '3G-11')}
          <g stroke="#00e5ff" strokeWidth="1.5" fill="none">
            <path d="M 905,420 L 940,420" />
          </g>
          {renderExchanger(940, 410, 45, 20, '3E-10', '#2563eb')}
          <g stroke="#f8fafc" strokeWidth="1.5" fill="none">
            <path d="M 985,420 L 995,420" />
          </g>
          <text x="940" y="445" fill="#f8fafc" fontSize="9" fontWeight="bold">C5+ CONDENSATE</text>
          {renderTag('FI16', 855, 400, 'FI16', 'm3/h', false, '#00e5ff')}
          {renderTag('TI182', 810, 400, 'TI182', '°C', false, '#00e5ff')}

          {/* ==================== 6. BOTTOM COLOR LEGEND ==================== */}
          <g transform="translate(40, 510)" fontSize="9" fontFamily="monospace" fontWeight="bold">
            <rect x="-5" y="-12" width="920" height="26" fill="#05080c" stroke="#1a2636" strokeWidth="1" />
            <text x="0" y="4" fill="#ffffff">PROCESS LINES:</text>

            <line x1="120" y1="0" x2="145" y2="0" stroke="#ff3333" strokeWidth="2.5" />
            <text x="150" y="4" fill="#ff3333">HOT/FEED GAS</text>

            <line x1="260" y1="0" x2="285" y2="0" stroke="#00e5ff" strokeWidth="2.5" />
            <text x="290" y="4" fill="#00e5ff">CRYOGENIC HC</text>

            <line x1="410" y1="0" x2="435" y2="0" stroke="#2563eb" strokeWidth="2.5" />
            <text x="440" y="4" fill="#2563eb">COOLING WATER</text>

            <line x1="560" y1="0" x2="585" y2="0" stroke="#eab308" strokeWidth="2.5" />
            <text x="590" y="4" fill="#eab308">LP STEAM 50#</text>

            <line x1="700" y1="0" x2="725" y2="0" stroke="#d946ef" strokeWidth="2.5" />
            <text x="730" y="4" fill="#d946ef">PROPANE REFRIG</text>

            <line x1="840" y1="0" x2="865" y2="0" stroke="#f8fafc" strokeWidth="2.5" />
            <text x="870" y="4" fill="#f8fafc">PRODUCTS</text>
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
          <ProcessLineDrawer screenId="OVERVIEW" />
        </svg>
      </div>

      {/* Floating Layout Editor Toolbar */}
      <LayoutEditorToolbar screenId="OVERVIEW" />

      {/* ==================== BOTTOM CONTROL GROUP (CG) & TREND (TG) STRIP ==================== */}
      <div className="bg-[#101724] border-t border-[#1a283a] px-3 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-400 font-bold mr-1">CONTROL GROUPS:</span>
          {[
            { id: 'CG0101', label: 'CG0101', tags: ['TIC1', 'LIC2', 'FIC2', 'FIC3', 'FIC1', 'LIC3', 'FI18', 'FI4'], title: 'SCRUB COLUMN 3C-1' },
            { id: 'CG0102', label: 'CG0102', tags: ['PIC3', 'TIC3', 'LIC5', 'FIC11', 'LIC4', 'FIC6', 'FIC7', '3E-5_DUTY'], title: 'DE-ETHANIZER 3C-4' },
            { id: 'CG0103', label: 'CG0103', tags: ['PIC5', 'TIC5', 'LIC9', 'FIC14', 'LIC10', 'FIC12', 'FIC13', 'AI21_C3'], title: 'DE-PROPANIZER 3C-6' },
            { id: 'CG0104', label: 'CG0104', tags: ['PIC7', 'TIC6', 'LIC11', 'FI16', 'LIC12', 'FIC15', 'FIC96', 'TI182'], title: 'DE-BUTANIZER 3C-8' },
            { id: 'CG0105', label: 'CG0105', tags: ['2TI127', 'TI158', 'TI159', 'TI157', 'TI161', 'TI171', 'TI167', 'TI183'], title: 'PLANT-3 TEMPERATURE INDICATORS' },
          ].map((cg) => (
            <button
              key={cg.id}
              onClick={() => setActiveCG({ id: cg.id, tags: cg.tags, title: cg.title })}
              className="bg-[#1f2d3e] hover:bg-[#2c3f56] text-white px-2.5 py-1 font-mono font-bold text-[10.5px] border border-gray-600"
            >
              {cg.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => useDCSStore.getState().setActiveScreen('TREND')}
            className="bg-[#1f2d3e] hover:bg-[#2c3f56] text-cyan-300 px-3 py-1 font-mono font-bold text-[10.5px] border border-cyan-700"
          >
            TREND RECORDER (TG0001)
          </button>
        </div>
      </div>

      {/* Control Group Modal */}
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
