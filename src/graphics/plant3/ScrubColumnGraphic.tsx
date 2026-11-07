import React, { useState } from 'react';
import { useSimulationStore } from '../../stores/simulationStore';
import { useDCSStore } from '../../stores/dcsStore';
import { ControlGroupView } from '../../components/dcs/ControlGroupView';
import { DraggableTag } from '../../components/dcs/layout/DraggableTag';
import { DraggableAnnotation } from '../../components/dcs/layout/DraggableAnnotation';
import { DraggableProcessLine } from '../../components/dcs/layout/DraggableProcessLine';
import { DraggableInstrumentSymbol } from '../../components/dcs/layout/DraggableInstrumentSymbol';
import {
  KettleExchangerSymbol,
  ShellAndTubeExchangerSymbol,
  AirCoolerExchangerSymbol
} from '../../components/dcs/symbols/HeatExchangerSymbols';
import { ProcessLineDrawer } from '../../components/dcs/layout/ProcessLineDrawer';
import { LayoutEditorToolbar } from '../../components/dcs/layout/LayoutEditorToolbar';
import { useLayoutStore } from '../../stores/useLayoutStore';

type ActiveCG = { id: string; tags: string[]; title: string } | null;

interface TagOptions {
  label?: string;
  unit?: string;
  fallback?: number;
  decimals?: number;
  anchor?: 'start' | 'middle' | 'end';
  valueColor?: string;
  labelColor?: string;
}

const C = {
  bg: '#000000',
  cyan: '#00b7df',
  purple: '#d800d8',
  red: '#ff1e1e',
  yellow: '#dfdf00',
  orange: '#e69138',
  white: '#ffffff',
  lime: '#00df00',
  tag: '#00e5ff',
  gray: '#bfbfbf',
  signal: '#0077ff',
  pumpGreen: '#19ff19',
  alarmRed: '#ff2020',
};

const CGS: Array<{ id: string; tags: string[]; title: string }> = [
  { id: 'CG0103', tags: ['TIC1', 'LIC2', 'FIC2', 'FIC3', 'FIC1', 'HIC110', 'LIC3', 'TIC193'], title: '3C-1 SCRUB COLUMN CONTROLS' },
  { id: 'CG0104', tags: ['TIC1', 'TI157', 'TI160', 'TI52', 'PI163', 'TI161', '2TI127', 'TI158'], title: '3E-1 REBOILER & TEMPERATURES' },
  { id: 'CG0105', tags: ['FI4', 'TI158', 'TI159', 'TI176', 'LIC3', 'FIC80', 'FI35', 'PI12'], title: 'FEED & OVERHEAD CHILLERS' },
  { id: 'CG0106', tags: ['TIC193', 'FIC80', 'TI191', 'PI12', 'HIC1', 'FI4', 'FIC1', 'LIC3'], title: '3E-18 STARTUP & LTSS' },
  { id: 'CG0107', tags: ['FIC1', 'HIC110', 'FIC3', 'FIC2', 'LIC2', 'LIC3', 'FI35', 'FI4'], title: 'REFLUX & BUTANE RECYCLE' },
  { id: 'CG0108', tags: ['AI25_N2', 'AI25_C1', 'AI25_C2', 'AI25_C3', 'AI25_IC4', 'AI25_NC4', 'AI25_IC5', 'AI25_HV'], title: 'AI25 OVERHEAD COMPOSITION' },
];

export const ScrubColumnGraphic: React.FC = () => {
  const { tags, pumps } = useSimulationStore();
  const { openFaceplate, openPumpPopup } = useDCSStore();
  const [activeCG, setActiveCG] = useState<ActiveCG>(null);
  const allAnnotations = useLayoutStore((s) => s.annotations);
  const annotations = React.useMemo(() => allAnnotations.filter((a) => a.screenId === 'SCRUB'), [allAnnotations]);
  const allLines = useLayoutStore((s) => s.lines);
  const lines = React.useMemo(() => allLines.filter((l) => l.screenId === 'SCRUB'), [allLines]);
  const allSymbols = useLayoutStore((s) => s.symbols);
  const symbols = React.useMemo(() => allSymbols.filter((s) => s.screenId === 'SCRUB'), [allSymbols]);

  const measured = (tagId: string, fallback = 0) => {
    const value = tags[tagId]?.measuredValue;
    return typeof value === 'number' && isFinite(value) ? value : fallback;
  };

  const renderTag = (tagId: string, x: number, y: number, options: TagOptions = {}) => {
    const {
      label = tagId,
      unit,
      fallback = 0,
      decimals = 1,
      anchor = 'middle',
      labelColor = C.tag,
      valueColor = C.white,
    } = options;

    const tag = tags[tagId];
    const value = measured(tagId, fallback);
    const alarm = tag?.alarmState && tag.alarmState !== 'NORMAL';
    const unack = tag?.alarmState === 'ACTIVE_UNACK';
    const display = value.toFixed(decimals);

    return (
      <DraggableTag
        key={tagId}
        screenId="SCRUB"
        tagId={tagId}
        defaultX={x}
        defaultY={y}
        onClick={(event) => {
          event.stopPropagation();
          openFaceplate(tagId);
        }}
        renderContent={() => (
          <g>
            <text x="0" y="0" fill={labelColor} fontSize="8.3" fontFamily="Courier New, monospace" fontWeight="700" textAnchor={anchor}>
              {label}
            </text>
            <text
              x={anchor === 'end' ? '0' : anchor === 'middle' ? '-2' : '0'}
              y="11"
              fill={alarm ? C.alarmRed : valueColor}
              fontSize="9.4"
              fontFamily="Courier New, monospace"
              fontWeight="700"
              textAnchor="end"
              className={unack ? 'animate-pulse' : undefined}
            >
              {display}
            </text>
            {unit ? (
              <text
                x={anchor === 'end' ? '4' : anchor === 'middle' ? '2' : '4'}
                y="11"
                fill={C.tag}
                fontSize="7.0"
                fontFamily="Courier New, monospace"
                fontWeight="700"
                textAnchor="start"
              >
                {unit}
              </text>
            ) : null}
          </g>
        )}
      />
    );
  };

  const renderPump = (pumpId: string, x: number, y: number, label: string) => {
    const pump = pumps[pumpId];
    const isRunning = pump?.running;
    const isTripped = pump?.tripped;
    const motorFill = isTripped ? C.alarmRed : isRunning ? C.pumpGreen : C.alarmRed;

    return (
      <DraggableTag
        key={pumpId}
        screenId="SCRUB"
        tagId={pumpId}
        defaultX={x}
        defaultY={y}
        onClick={(e) => {
          e.stopPropagation();
          openPumpPopup(pumpId);
        }}
        renderContent={() => (
          <g>
            <text x="0" y="-18" fill={C.lime} fontSize="8.5" fontFamily="Courier New, monospace" textAnchor="middle">{label}</text>
            <line x1="0" y1="-15" x2="0" y2="-9" stroke={C.lime} strokeWidth="1" />
            <circle cx="0" cy="-7" r="7" fill={C.bg} stroke={C.lime} strokeWidth="1" />
            <text x="0" y="-4.3" fill={C.lime} fontSize="7.3" fontFamily="Courier New, monospace" fontWeight="700" textAnchor="middle">M</text>
            <line x1="0" y1="0" x2="0" y2="7" stroke={C.lime} strokeWidth="1" />
            <rect x="-8" y="7" width="16" height="14" fill={C.bg} stroke={C.lime} strokeWidth="1" />
            <rect x="-5.2" y="9.8" width="10.4" height="8.4" fill={motorFill} />
          </g>
        )}
      />
    );
  };

  const renderButton = (label: string, x: number, width: number, onClick: () => void) => (
    <g transform={`translate(${x} 394)`} onClick={onClick} style={{ cursor: 'pointer' }}>
      <rect x="0" y="0" width={width} height="29" fill="#bfbfbf" stroke="#6b6b6b" strokeWidth="1" />
      <line x1="1" y1="1" x2={width - 1} y2="1" stroke="#ffffff" strokeWidth="1.3" />
      <line x1="1" y1="1" x2="1" y2="28" stroke="#ffffff" strokeWidth="1.3" />
      <line x1="1" y1="28" x2={width - 1} y2="28" stroke="#565656" strokeWidth="1.3" />
      <line x1={width - 1} y1="1" x2={width - 1} y2="28" stroke="#565656" strokeWidth="1.3" />
      <text x={width / 2} y="19" fill="#101010" fontSize="11.3" fontFamily="Courier New, monospace" fontWeight="700" textAnchor="middle">{label}</text>
    </g>
  );

  const sumpLevel = Math.max(0, Math.min(100, measured('LIC2', 100.0)));
  const drum3C2Level = Math.max(0, Math.min(100, measured('LIC3', 38.2)));

  const sumpTop = 199 + (100 - sumpLevel) * 0.72;
  const sumpHeight = 272 - sumpTop;
  const drumTop = 154 + (100 - drum3C2Level) * 0.68;
  const drumHeight = 221 - drumTop;

  return (
    <div className="relative h-full w-full overflow-hidden bg-black select-none flex items-center justify-center">
      <svg
        viewBox="0 0 922 426"
        className="w-full h-full max-h-full max-w-full"
        preserveAspectRatio="xMidYMid meet"
        shapeRendering="geometricPrecision"
      >
        <rect x="0" y="0" width="922" height="426" fill={C.bg} />

        <text x="461" y="17" fill="#ffffff" fontSize="14.4" fontFamily="Courier New, monospace" fontWeight="700" textAnchor="middle">
          SCRUB COLUMN
        </text>

        <g fontFamily="Courier New, monospace" fontWeight="700" fontSize="7.3">
          <text x="683" y="39" fill={C.tag}>HV</text><text x="713" y="39" fill={C.white}>{measured('AI25_HV', 1200.0).toFixed(1)}</text><text x="682" y="50" fill={C.tag}>BTUSCF</text>
          <text x="750" y="40" fill={C.tag}>AI25</text>
          {[
            { label: 'N2', tag: 'AI25_N2', fallback: 0.054, dec: 3 },
            { label: 'C1', tag: 'AI25_C1', fallback: 80.00, dec: 2 },
            { label: 'C2', tag: 'AI25_C2', fallback: 2.72, dec: 2 },
            { label: 'C3', tag: 'AI25_C3', fallback: 5.00, dec: 2 },
            { label: 'iC4', tag: 'AI25_IC4', fallback: 2.00, dec: 2 },
            { label: 'nC4', tag: 'AI25_NC4', fallback: 2.00, dec: 2 },
            { label: 'iC5', tag: 'AI25_IC5', fallback: 0.1000, dec: 4 },
          ].map((item, index) => {
            const value = measured(item.tag, item.fallback);
            return (
              <React.Fragment key={item.label}>
                <text x="779" y={25 + index * 14} fill={C.tag}>{item.label}</text>
                <text x="808" y={25 + index * 14} fill={C.white}>{value.toFixed(item.dec)}</text>
                <text x="847" y={25 + index * 14} fill={C.tag}>%</text>
              </React.Fragment>
            );
          })}
        </g>

        <KettleExchangerSymbol x={100} y={72} width={68} height={28} tag="4E-12" color={C.lime} />

        <defs>
          <clipPath id="scrub-column-sump-clip">
            <path d="M211 188 H246 V261 A17 17 0 0 1 211 261 Z" />
          </clipPath>
          <clipPath id="scrub-column-drum-clip">
            <path d="M511 154 Q511 142 524 142 H560 Q573 142 573 154 V207 Q573 221 542 221 Q511 221 511 207 Z" />
          </clipPath>
        </defs>
        <path d="M227 88 C211 88 199 100 199 115 V178 L211 190 V261 A17 17 0 0 0 245 261 V190 L255 178 V115 C255 100 243 88 227 88 Z" fill={C.bg} stroke={C.lime} strokeWidth="1.4" />
        <path d="M211 220 H220 V212 H237 V220 H245" fill="none" stroke={C.lime} strokeWidth="1.1" />
        <rect x="211" y={sumpTop} width="34" height={Math.max(0, sumpHeight)} fill="#00b7df" clipPath="url(#scrub-column-sump-clip)" />
        <text x="227" y="113" fill={C.lime} fontSize="10" fontFamily="Courier New, monospace" textAnchor="middle">3C-1</text>

        <KettleExchangerSymbol x={348} y={48} width={82} height={28} tag="4E-14" color={C.lime} />
        <KettleExchangerSymbol x={476} y={36} width={68} height={26} tag="4E-40" color={C.lime} />

        <path d="M511 154 Q511 142 524 142 H560 Q573 142 573 154 V207 Q573 221 542 221 Q511 221 511 207 Z" fill={C.bg} stroke={C.lime} strokeWidth="1.35" />
        <rect x="511" y={drumTop} width="62" height={Math.max(0, drumHeight)} fill="#ff1616" clipPath="url(#scrub-column-drum-clip)" />
        <text x="542" y="166" fill={C.lime} fontSize="9.3" fontFamily="Courier New, monospace" textAnchor="middle">3C-2</text>

        <DraggableTag
          screenId="SCRUB"
          tagId="EQUIP_3E-18"
          defaultX={608}
          defaultY={138}
          renderContent={() => (
            <ShellAndTubeExchangerSymbol x={0} y={0} width={90} height={32} tag="3E-18" color={C.lime} />
          )}
        />
        <DraggableTag
          screenId="SCRUB"
          tagId="EQUIP_3E-1"
          defaultX={96}
          defaultY={248}
          renderContent={() => (
            <ShellAndTubeExchangerSymbol x={0} y={0} width={92} height={32} tag="3E-1" color={C.lime} />
          )}
        />

        <path d="M66 347 Q66 335 76 335 Q87 335 87 347 V375 Q87 386 76 386 Q66 386 66 375 Z" fill={C.bg} stroke={C.lime} strokeWidth="1.2" />
        <text x="90" y="372" fill={C.lime} fontSize="8.1" fontFamily="Courier New, monospace">3C-13</text>

        {renderPump('3G-1A', 411, 244, '3G-1A')}
        {renderPump('3G-1B', 411, 303, '3G-1B')}

        <g fontFamily="Courier New, monospace" fontWeight="700">
          <text x="49" y="155" fill={C.red} fontSize="8.2" transform="translate(0 -8)">NG</text>
          <text x="49" y="155" fill={C.red} fontSize="8.2">FEED</text>
          <text x="49" y="242" fill={C.yellow} fontSize="8.3" transform="translate(0 -8)">LP</text>
          <text x="49" y="242" fill={C.yellow} fontSize="8.3">STM</text>
          <text x="573" y="142" fill={C.yellow} fontSize="8.2">LP</text>
          <text x="573" y="151" fill={C.yellow} fontSize="8.2">STM</text>
          <text x="488" y="237" fill={C.white} fontSize="8.1">LTSS</text>
          <text x="496" y="249" fill={C.white} fontSize="8.1">HDR</text>
          <text x="752" y="121" fill={C.lime} fontSize="9">5E-1</text>
          <text x="801" y="225" fill={C.white} fontSize="7.2">FUEL</text>
          <text x="801" y="235" fill={C.white} fontSize="7.2">GAS</text>
          <text x="169" y="394" fill={C.orange} fontSize="8.6">COND</text>
        </g>


        {renderTag('2TI127', 174, 52, { fallback: 0.6, decimals: 1, label: '2TI127', unit: '°C' })}
        {renderTag('TI158', 244, 56, { fallback: 10.0, decimals: 1, unit: '°C' })}
        {renderTag('TI159', 305, 110, { fallback: -20.0, decimals: 1, unit: '°C' })}
        {renderTag('FIC1', 402, 112, { fallback: 20.68, decimals: 2, unit: 'M3/H' })}
        {renderTag('FIC3', 369, 187, { fallback: 94.7, decimals: 1, unit: 'M3/H' })}
        {renderTag('TI176', 468, 89, { fallback: -20.0, decimals: 1, unit: '°C' })}
        {renderTag('FI4', 584, 106, { fallback: 238.0, decimals: 1, unit: 'T/H' })}
        {renderTag('HIC110', 479, 114, { fallback: 37.3, decimals: 1, unit: '%' })}
        {renderTag('TIC1', 177, 193, { fallback: -3.6, decimals: 1, unit: '°C' })}
        {renderTag('TI157', 179, 220, { fallback: 130.0, decimals: 1, unit: '°C' })}
        {renderTag('PI163', 80, 285, { fallback: 1.273, decimals: 3, unit: 'KGC2G' })}
        {renderTag('TI160', 185, 312, { fallback: 22.6, decimals: 1, unit: '°C' })}
        {renderTag('TI52', 190, 340, { fallback: 33.6, decimals: 1, unit: '°C' })}
        {renderTag('LIC2', 332, 255, { fallback: 100.0, decimals: 1, unit: '%' })}
        {renderTag('FIC2', 337, 322, { fallback: 87.0, decimals: 1, unit: 'M3/H' })}
        {renderTag('TI161', 337, 375, { fallback: 130.0, decimals: 1, unit: '°C' })}
        {renderTag('FI35', 454, 368, { fallback: 0.00, decimals: 2, unit: 'M3/H' })}
        {renderTag('TIC193', 624, 213, { fallback: 29.04, decimals: 2, unit: '°C' })}
        {renderTag('LIC3', 606, 245, { fallback: 38.2, decimals: 1, unit: '%' })}
        {renderTag('FIC80', 781, 137, { fallback: 0.0, decimals: 1, unit: 'KNM3/H' })}
        {renderTag('TI191', 778, 323, { fallback: 27.1, decimals: 1, unit: '°C' })}
        {renderTag('PI12', 653, 322, { fallback: -0.002, decimals: 3, unit: 'KGC2G' })}
        {renderTag('HIC1', 655, 289, { fallback: 0.0, decimals: 1, unit: '%' })}

        {lines.map((l) => (
          <DraggableProcessLine key={l.id} line={l} />
        ))}
        {symbols.map((s) => (
          <DraggableInstrumentSymbol key={s.id} symbol={s} />
        ))}
        {annotations.map((ann) => (
          <DraggableAnnotation key={ann.id} annotation={ann} />
        ))}
        <ProcessLineDrawer screenId="SCRUB" />

        {renderButton('CG0103', 72, 58, () => setActiveCG({ ...CGS[0] }))}
        {renderButton('CG0104', 174, 58, () => setActiveCG({ ...CGS[1] }))}
        {renderButton('CG0105', 276, 58, () => setActiveCG({ ...CGS[2] }))}
        {renderButton('CG0106', 379, 58, () => setActiveCG({ ...CGS[3] }))}
        {renderButton('CG0107', 480, 58, () => setActiveCG({ ...CGS[4] }))}
        {renderButton('CG0108', 583, 58, () => setActiveCG({ ...CGS[5] }))}
        {renderButton('TG0275', 686, 58, () => useDCSStore.getState().setActiveScreen('TREND'))}
        {renderButton('TG0108', 788, 58, () => useDCSStore.getState().setActiveScreen('TREND'))}
      </svg>

      <LayoutEditorToolbar screenId="SCRUB" />

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
