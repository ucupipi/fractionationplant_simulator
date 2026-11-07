import React from 'react';
import { ScreenId } from '../../stores/useLayoutStore';
import { DraggableTag } from '../../components/dcs/layout/DraggableTag';
import { TagLiveValue } from '../../data/tags';

/* ══════════════════════════════════════════════════════════════════════════
   Yokogawa Centum VP DCS Color Palette — Strictly matched to Picture2/3/4
   ══════════════════════════════════════════════════════════════════════════ */
export const DCS_COLORS = {
  bg: '#000000',
  green: '#00ff00',       // Equipment outlines, running status, CW
  cyan: '#00ffff',        // Process lines, tags, PV units
  white: '#ffffff',       // Values, secondary piping, column body text
  yellow: '#ffff00',      // LP STM utility lines & text
  orange: '#e69138',      // COND condensate lines & text
  red: '#ff1e1e',         // Alarm states, tripped/stopped pumps, UV valves
  magenta: '#d946ef',     // C3/C4 product lines & labels
  pink: '#f472b6',        // Overhead drum liquid level (3C-7, 3C-9)
  blue: '#00b0ff',        // Hydrocarbon liquid sump fill (3C-4, 3C-6, 3C-8)
  levelWhite: '#e0f7fa',  // 3C-5 drum liquid fill
  pumpGreen: '#19ff19',   // Running pump motor
  alarmRed: '#ff2020',    // Alarm blink
  signal: '#0080ff',      // Instrument dashed signal line
  font: 'Courier New, monospace',
};

/* ══════════════════════════════════════════════════════════════════════════
   Standard Yokogawa Tag Component
   Format: TAG_ID on top, PV value + unit on bottom
   ══════════════════════════════════════════════════════════════════════════ */
interface DcsTagProps {
  screenId: ScreenId;
  tagId: string;
  x: number;
  y: number;
  label?: string;
  unit?: string;
  decimals?: number;
  color?: string;
  tagState?: TagLiveValue;
  onOpenFaceplate?: (tagId: string) => void;
}

export const DcsTag: React.FC<DcsTagProps> = ({
  screenId,
  tagId,
  x,
  y,
  label,
  unit,
  decimals = 1,
  color = DCS_COLORS.cyan,
  tagState,
  onOpenFaceplate,
}) => {
  const val = tagState && typeof tagState.measuredValue === 'number' && isFinite(tagState.measuredValue)
    ? tagState.measuredValue.toFixed(decimals)
    : '---';

  const hasAlarm = tagState && tagState.alarmState !== 'NORMAL';
  const isUnack = tagState && tagState.alarmState === 'ACTIVE_UNACK';

  return (
    <DraggableTag
      screenId={screenId}
      tagId={tagId}
      defaultX={x}
      defaultY={y}
      onClick={(e) => {
        e.stopPropagation();
        onOpenFaceplate?.(tagId);
      }}
      renderContent={() => (
        <g>
          <text
            x="0"
            y="0"
            fill={DCS_COLORS.white}
            fontSize="9"
            fontFamily={DCS_COLORS.font}
            fontWeight="bold"
          >
            {label || tagId}
          </text>
          <text
            x="0"
            y="12"
            fill={hasAlarm ? DCS_COLORS.alarmRed : color}
            fontSize="10"
            fontFamily={DCS_COLORS.font}
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

/* ══════════════════════════════════════════════════════════════════════════
   Yokogawa Centum Pump Symbol
   Features: Label, Motor circle with 'M', Shafts, Status rectangle (Green/Red),
   Amps indicator & optional Alarm status (IALL)
   ══════════════════════════════════════════════════════════════════════════ */
interface DcsPumpProps {
  screenId: ScreenId;
  pumpId: string;
  x: number;
  y: number;
  label: string;
  isRunning?: boolean;
  isTripped?: boolean;
  amps?: number;
  ampsLabel?: string;
  hasIall?: boolean;
  onOpenPumpPopup?: (pumpId: string) => void;
}

export const DcsPump: React.FC<DcsPumpProps> = ({
  screenId,
  pumpId,
  x,
  y,
  label,
  isRunning = false,
  isTripped = false,
  amps,
  ampsLabel,
  hasIall = false,
  onOpenPumpPopup,
}) => {
  const motorFill = isTripped ? DCS_COLORS.alarmRed : isRunning ? DCS_COLORS.pumpGreen : DCS_COLORS.alarmRed;

  return (
    <DraggableTag
      screenId={screenId}
      tagId={pumpId}
      defaultX={x}
      defaultY={y}
      onClick={(e) => {
        e.stopPropagation();
        onOpenPumpPopup?.(pumpId);
      }}
      renderContent={() => (
        <g>
          {/* Pump tag label */}
          <text
            x="0"
            y="-18"
            fill={DCS_COLORS.green}
            fontSize="9"
            fontFamily={DCS_COLORS.font}
            fontWeight="bold"
            textAnchor="middle"
          >
            {label}
          </text>
          {/* Top motor shaft */}
          <line x1="0" y1="-15" x2="0" y2="-9" stroke={DCS_COLORS.green} strokeWidth="1" />
          {/* Motor circle */}
          <circle cx="0" cy="-2" r="8" fill={DCS_COLORS.bg} stroke={DCS_COLORS.green} strokeWidth="1.2" />
          <text
            x="0"
            y="1.5"
            fill={DCS_COLORS.green}
            fontSize="8"
            fontFamily={DCS_COLORS.font}
            fontWeight="bold"
            textAnchor="middle"
          >
            M
          </text>
          {/* Bottom motor shaft */}
          <line x1="0" y1="6" x2="0" y2="12" stroke={DCS_COLORS.green} strokeWidth="1" />
          {/* Status box */}
          <rect x="-8" y="12" width="16" height="14" fill={DCS_COLORS.bg} stroke={DCS_COLORS.green} strokeWidth="1" />
          <rect
            x="-5.5"
            y="14.5"
            width="11"
            height="9"
            fill={motorFill}
            className={isTripped ? 'animate-pulse' : ''}
          />

          {/* Optional Motor Amps / Current readout (Yokogawa Centum format) */}
          {amps !== undefined && (
            <g transform="translate(18, 5)">
              {hasIall && (
                <text x="0" y="-10" fill={DCS_COLORS.red} fontSize="8" fontFamily={DCS_COLORS.font} fontWeight="bold">
                  IALL
                </text>
              )}
              {ampsLabel && (
                <text x="0" y="0" fill={DCS_COLORS.cyan} fontSize="8" fontFamily={DCS_COLORS.font} fontWeight="bold">
                  {ampsLabel}
                </text>
              )}
              <text x="0" y="10" fill={DCS_COLORS.white} fontSize="8.5" fontFamily={DCS_COLORS.font} fontWeight="bold">
                {amps.toFixed(2)}A
              </text>
            </g>
          )}
        </g>
      )}
    />
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   Standard Yokogawa Valve Symbols
   ══════════════════════════════════════════════════════════════════════════ */
export const DcsControlValve: React.FC<{
  x: number;
  y: number;
  color?: string;
  rotation?: number;
  scale?: number;
  isOpen?: boolean;
}> = ({ x, y, color = DCS_COLORS.green, rotation = 0, scale = 1, isOpen = true }) => (
  <g transform={`translate(${x},${y}) rotate(${rotation}) scale(${scale})`}>
    <path d="M -6,-5 L 0,0 L -6,5 Z" fill={isOpen ? 'none' : color} stroke={color} strokeWidth="1.4" />
    <path d="M 6,-5 L 0,0 L 6,5 Z" fill={isOpen ? 'none' : color} stroke={color} strokeWidth="1.4" />
    <line x1="0" y1="-5" x2="0" y2="-10" stroke={color} strokeWidth="1.2" />
    <line x1="-4" y1="-10" x2="4" y2="-10" stroke={color} strokeWidth="1.6" />
  </g>
);

export const DcsBlockValve: React.FC<{
  x: number;
  y: number;
  color?: string;
  rotation?: number;
  scale?: number;
}> = ({ x, y, color = DCS_COLORS.green, rotation = 0, scale = 1 }) => (
  <g transform={`translate(${x},${y}) rotate(${rotation}) scale(${scale})`}>
    <path d="M -5,-4 L 0,0 L -5,4 Z" fill="none" stroke={color} strokeWidth="1.3" />
    <path d="M 5,-4 L 0,0 L 5,4 Z" fill="none" stroke={color} strokeWidth="1.3" />
  </g>
);

/* ══════════════════════════════════════════════════════════════════════════
   Shell & Tube Heat Exchanger (Horizontal)
   Exact Yokogawa shape: Left & Right Channel heads + tubesheet flanges + shell body
   ══════════════════════════════════════════════════════════════════════════ */
export const DcsShellTubeExchanger: React.FC<{
  x: number;
  y: number;
  width: number;
  height: number;
  tag: string;
  color?: string;
}> = ({ x, y, width, height, tag, color = DCS_COLORS.green }) => {
  const headW = 8;
  const shellW = width - 2 * headW;
  return (
    <g transform={`translate(${x},${y})`}>
      {/* Left channel head */}
      <rect x={0} y={0} width={headW} height={height} rx={2} fill={DCS_COLORS.bg} stroke={color} strokeWidth="1.4" />
      <line x1={headW} y1={-3} x2={headW} y2={height + 3} stroke={color} strokeWidth="1.4" />
      {/* Main shell */}
      <rect x={headW} y={2} width={shellW} height={height - 4} fill={DCS_COLORS.bg} stroke={color} strokeWidth="1.4" />
      {/* Right channel head */}
      <line x1={headW + shellW} y1={-3} x2={headW + shellW} y2={height + 3} stroke={color} strokeWidth="1.4" />
      <rect x={headW + shellW} y={0} width={headW} height={height} rx={2} fill={DCS_COLORS.bg} stroke={color} strokeWidth="1.4" />
      {/* Tag label */}
      <text
        x={width / 2}
        y={height / 2 + 3}
        fill={color}
        fontSize="9.5"
        fontFamily={DCS_COLORS.font}
        fontWeight="bold"
        textAnchor="middle"
      >
        {tag}
      </text>
    </g>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   Kettle Reboiler Symbol (3E-4, 3E-6, 3E-8)
   Features: Tube channel head on left, enlarged kettle shell with dome on right
   ══════════════════════════════════════════════════════════════════════════ */
export const DcsKettleReboiler: React.FC<{
  x: number;
  y: number;
  width: number;
  height: number;
  tag: string;
  color?: string;
}> = ({ x, y, width, height, tag, color = DCS_COLORS.green }) => {
  const headW = 10;
  const shellW = width - headW;
  const domeR = height / 2;
  return (
    <g transform={`translate(${x},${y})`}>
      {/* Left channel head */}
      <rect x={0} y={height * 0.25} width={headW} height={height * 0.5} fill={DCS_COLORS.bg} stroke={color} strokeWidth="1.4" />
      <line x1={headW} y1={height * 0.15} x2={headW} y2={height * 0.85} stroke={color} strokeWidth="1.4" />
      {/* Kettle shell body with dome on right */}
      <path
        d={`
          M ${headW},${height * 0.1}
          L ${headW + shellW - domeR},${height * 0.1}
          A ${domeR},${height * 0.4} 0 0,1 ${headW + shellW - domeR},${height * 0.9}
          L ${headW},${height * 0.9}
          Z
        `}
        fill={DCS_COLORS.bg}
        stroke={color}
        strokeWidth="1.4"
      />
      {/* Tag label */}
      <text
        x={headW + shellW * 0.45}
        y={height * 0.55}
        fill={color}
        fontSize="9.5"
        fontFamily={DCS_COLORS.font}
        fontWeight="bold"
        textAnchor="middle"
      >
        {tag}
      </text>
    </g>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   Horizontal Drum (3C-5, 3C-7, 3C-9)
   Horizontal cylinder with 2 hemispherical heads & dynamic liquid level
   ══════════════════════════════════════════════════════════════════════════ */
export const DcsHorizontalDrum: React.FC<{
  x: number;
  y: number;
  width: number;
  height: number;
  tag: string;
  levelPercent: number;
  levelColor?: string;
  color?: string;
}> = ({ x, y, width, height, tag, levelPercent, levelColor = DCS_COLORS.pink, color = DCS_COLORS.green }) => {
  const domeR = height / 2;
  const clampedLevel = Math.max(0, Math.min(100, levelPercent));
  const fillH = (clampedLevel / 100) * height;
  const fillY = y + height - fillH;
  const clipId = `drum-clip-${tag.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <rect x={x} y={y} width={width} height={height} rx={domeR} />
        </clipPath>
      </defs>

      {/* Drum outer shell */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={domeR}
        fill={DCS_COLORS.bg}
        stroke={color}
        strokeWidth="2"
      />

      {/* Liquid level fill */}
      <rect
        x={x}
        y={fillY}
        width={width}
        height={fillH}
        fill={levelColor}
        opacity={0.85}
        clipPath={`url(#${clipId})`}
      />

      {/* Drum tag label */}
      <text
        x={x + width / 2}
        y={y + height / 2 + 4}
        fill={DCS_COLORS.green}
        fontSize="10"
        fontFamily={DCS_COLORS.font}
        fontWeight="bold"
        textAnchor="middle"
      >
        {tag}
      </text>
    </g>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   Vertical Fractionator Column (3C-6, 3C-8)
   Tall column with hemispherical top/bottom domes, chimney tray weir,
   internal trays, and dynamic liquid sump level.
   ══════════════════════════════════════════════════════════════════════════ */
export const DcsVerticalColumn: React.FC<{
  x: number;
  y: number;
  width: number;
  height: number;
  tag: string;
  sumpLevelPercent: number;
  color?: string;
}> = ({ x, y, width, height, tag, sumpLevelPercent, color = DCS_COLORS.green }) => {
  const domeR = width / 2;
  const clampedLevel = Math.max(0, Math.min(100, sumpLevelPercent));
  const sumpZoneH = height * 0.28;
  const fillH = (clampedLevel / 100) * sumpZoneH;
  const fillY = y + height - domeR - fillH;
  const clipId = `col-clip-${tag.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <path
            d={`
              M ${x},${y + domeR}
              A ${domeR},${domeR} 0 0,1 ${x + width},${y + domeR}
              L ${x + width},${y + height - domeR}
              A ${domeR},${domeR} 0 0,1 ${x},${y + height - domeR}
              Z
            `}
          />
        </clipPath>
      </defs>

      {/* Column body */}
      <path
        d={`
          M ${x},${y + domeR}
          A ${domeR},${domeR} 0 0,1 ${x + width},${y + domeR}
          L ${x + width},${y + height - domeR}
          A ${domeR},${domeR} 0 0,1 ${x},${y + height - domeR}
          Z
        `}
        fill="#0a1520"
        stroke={color}
        strokeWidth="2"
      />

      {/* Chimney / internal seal tray shelf (as visible in Yokogawa graphics) */}
      <path
        d={`
          M ${x},${y + height * 0.72}
          L ${x + width * 0.38},${y + height * 0.72}
          L ${x + width * 0.38},${y + height * 0.69}
          L ${x + width * 0.62},${y + height * 0.69}
          L ${x + width * 0.62},${y + height * 0.72}
          L ${x + width},${y + height * 0.72}
        `}
        fill="none"
        stroke={color}
        strokeWidth="1.4"
      />

      {/* Internal distillation trays */}
      {[0.15, 0.25, 0.35, 0.45, 0.55].map((frac, i) => (
        <line
          key={`tray-${i}`}
          x1={x + 4}
          y1={y + domeR + (height - 2 * domeR) * frac}
          x2={x + width - 4}
          y2={y + domeR + (height - 2 * domeR) * frac}
          stroke={color}
          strokeWidth="0.5"
          opacity="0.3"
        />
      ))}

      {/* Sump liquid level */}
      <rect
        x={x}
        y={fillY}
        width={width}
        height={fillH + domeR}
        fill={DCS_COLORS.blue}
        opacity={0.9}
        clipPath={`url(#${clipId})`}
      />

      {/* Column Tag */}
      <text
        x={x + width / 2}
        y={y + height * 0.35}
        fill={color}
        fontSize="12"
        fontFamily={DCS_COLORS.font}
        fontWeight="bold"
        textAnchor="middle"
      >
        {tag}
      </text>
    </g>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   Yokogawa Centum 3D Bevelled Button Bar (CG/TG Navigation)
   ══════════════════════════════════════════════════════════════════════════ */
export interface DcsButtonDef {
  label: string;
  x: number;
  width: number;
  onClick: () => void;
}

export const DcsButtonBar: React.FC<{ buttons: DcsButtonDef[] }> = ({ buttons }) => (
  <g transform="translate(0, 528)">
    {buttons.map((b) => (
      <g
        key={b.label}
        transform={`translate(${b.x}, 0)`}
        onClick={b.onClick}
        style={{ cursor: 'pointer' }}
      >
        <rect x="0" y="0" width={b.width} height="24" fill="#bfbfbf" stroke="#6b6b6b" strokeWidth="1" />
        <line x1="1" y1="1" x2={b.width - 1} y2="1" stroke="#ffffff" strokeWidth="1.3" />
        <line x1="1" y1="1" x2="1" y2="23" stroke="#ffffff" strokeWidth="1.3" />
        <line x1="1" y1="23" x2={b.width - 1} y2="23" stroke="#565656" strokeWidth="1.3" />
        <line x1={b.width - 1} y1="1" x2={b.width - 1} y2="23" stroke="#565656" strokeWidth="1.3" />
        <text
          x={b.width / 2}
          y="16"
          fill="#101010"
          fontSize="10"
          fontFamily={DCS_COLORS.font}
          fontWeight="bold"
          textAnchor="middle"
        >
          {b.label}
        </text>
      </g>
    ))}
  </g>
);
