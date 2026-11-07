import React from 'react';

export interface HeatExchangerSymbolProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  tag?: string;
  duty?: string | number;
  flipHorizontal?: boolean;
  showInternals?: boolean;
  color?: string;
  fillColor?: string;
  className?: string;
  onClick?: () => void;
}

/**
 * Standard ISA-5.1 / ISO-10628 Kettle Heat Exchanger (Kettle Reboiler / Kettle Chiller)
 * Exactly matching standard industrial P&ID CAD specifications:
 * - Flanged Channel Head on tube inlet/outlet
 * - Sloped eccentric cone expander transition to enlarged upper vapor disengagement dome
 * - Elliptical/Hemispherical shell end cap
 * - Inner U-tube bundle & liquid overflow weir plate
 * - Shell-side vapor outlet (top) & liquid inlet/overflow (bottom) nozzles
 */
export const KettleExchangerSymbol: React.FC<HeatExchangerSymbolProps> = ({
  x = 0,
  y = 0,
  width = 90,
  height = 36,
  tag = '4E-12',
  duty,
  flipHorizontal = false,
  showInternals = true,
  color = '#9ACD32',
  fillColor = '#000000',
  className = '',
  onClick
}) => {
  // Base coordinates designed on a 100 x 40 coordinate canvas
  // Small channel head width: 22, height: 24 (y from 14 to 38)
  // Flange at x=22
  // Cone slope from x=28 to x=46, expanding y from 14 up to 4
  // Main kettle shell from x=46 to x=88, y from 4 to 38
  // Right end dome from x=88 to x=100 with r=12

  return (
    <g
      id={`kettle-${tag.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
      transform={`translate(${x}, ${y}) ${flipHorizontal ? `translate(${width}, 0) scale(-1, 1)` : ''} scale(${width / 100}, ${height / 40})`}
      className={`select-none ${className}`}
      onClick={onClick}
    >
      {/* ==================== 1. MAIN KETTLE SHELL BODY ==================== */}
      {/* Outer Shell Path: Channel Head -> Flange -> Sloped Expander Cone -> Vapor Dome -> End Cap -> Flat Bottom */}
      <path
        id="kettle-shell-outline"
        d="M 6,38 
           A 12,12 0 0,1 6,14 
           L 22,14 
           L 28,14 
           L 46,4 
           L 86,4 
           A 17,17 0 0,1 86,38 
           L 6,38 
           Z"
        fill={fillColor}
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      {/* Channel Head Flange Pair */}
      <g id="channel-flange-pair" stroke={color} strokeWidth="1.6">
        <line x1="22" y1="11" x2="22" y2="41" />
        <line x1="25" y1="11" x2="25" y2="41" />
      </g>

      {/* Internal Tube-Sheet Baffle Line */}
      <line
        id="tubesheet-line"
        x1="25"
        y1="14"
        x2="25"
        y2="38"
        stroke={color}
        strokeWidth="1.5"
      />

      {/* ==================== 2. INTERNAL U-TUBE BUNDLE & WEIR ==================== */}
      {showInternals && (
        <g id="kettle-internals" opacity="0.85">
          {/* U-Tube Bundle inside liquid section */}
          <path
            id="u-tube-bundle"
            d="M 25,20 L 68,20 A 7,7 0 0,1 68,34 L 25,34"
            fill="none"
            stroke={color}
            strokeWidth="1.2"
            strokeDasharray="none"
          />
          <path
            id="u-tube-inner"
            d="M 25,24 L 66,24 A 3,3 0 0,1 66,30 L 25,30"
            fill="none"
            stroke={color}
            strokeWidth="1.0"
          />

          {/* Liquid Overflow Weir Plate */}
          <line
            id="weir-plate"
            x1="76"
            y1="18"
            x2="76"
            y2="38"
            stroke={color}
            strokeWidth="1.4"
          />

          {/* Liquid Level Indication (Dotted) */}
          <line
            id="liquid-level"
            x1="30"
            y1="18"
            x2="76"
            y2="18"
            stroke="#00e5ff"
            strokeWidth="0.8"
            strokeDasharray="2 1.5"
            opacity="0.6"
          />
        </g>
      )}

      {/* ==================== 3. FLANGED PROCESS NOZZLES ==================== */}
      {/* Top Vapor Disengagement Outlet Nozzle */}
      <g id="nozzle-top-vapor" stroke={color} strokeWidth="1.5">
        <line x1="66" y1="4" x2="66" y2="0" />
        <line x1="62" y1="0" x2="70" y2="0" strokeWidth="1.6" />
      </g>

      {/* Bottom Liquid Boiling In / Drain Nozzle */}
      <g id="nozzle-bottom-inlet" stroke={color} strokeWidth="1.5">
        <line x1="48" y1="38" x2="48" y2="42" />
        <line x1="44" y1="42" x2="52" y2="42" strokeWidth="1.6" />
      </g>

      {/* Bottom Liquid Overflow Draw Nozzle (After Weir) */}
      <g id="nozzle-bottom-overflow" stroke={color} strokeWidth="1.5">
        <line x1="82" y1="38" x2="82" y2="42" />
        <line x1="78" y1="42" x2="86" y2="42" strokeWidth="1.6" />
      </g>

      {/* Tube-Side Inlet / Outlet Flanges (Axial or Top/Bottom) */}
      <g id="nozzle-tube-channel" stroke={color} strokeWidth="1.4">
        <line x1="14" y1="14" x2="14" y2="10" />
        <line x1="11" y1="10" x2="17" y2="10" strokeWidth="1.6" />
        <line x1="14" y1="38" x2="14" y2="42" />
        <line x1="11" y1="42" x2="17" y2="42" strokeWidth="1.6" />
      </g>

      {/* ==================== 4. TAG TEXT & DUTY LABEL ==================== */}
      <g id="kettle-labels" transform={flipHorizontal ? 'scale(-1, 1) translate(-100, 0)' : ''}>
        <text
          id="tag-label"
          x={flipHorizontal ? 34 : 66}
          y="13"
          fill={color}
          fontFamily="monospace"
          fontSize="7.5"
          fontWeight="bold"
          textAnchor="middle"
        >
          {tag}
        </text>
        {duty && (
          <text
            id="duty-label"
            x={flipHorizontal ? 34 : 66}
            y="32"
            fill="#00e5ff"
            fontFamily="monospace"
            fontSize="6"
            fontWeight="bold"
            textAnchor="middle"
          >
            {duty}
          </text>
        )}
      </g>
    </g>
  );
};

/**
 * Standard ISA-5.1 / ISO-10628 Fixed Tube Sheet / Floating Head Shell & Tube Heat Exchanger
 * Matching DCS display: hemispherical left channel head, rectangular shell body,
 * separate squared right bonnet, double flange pairs between sections,
 * optional valve symbol on top.
 */
export const ShellAndTubeExchangerSymbol: React.FC<HeatExchangerSymbolProps & { showValve?: boolean }> = ({
  x = 0,
  y = 0,
  width = 80,
  height = 28,
  tag = '3E-14',
  duty,
  color = '#22c55e',
  fillColor = '#000000',
  showValve = false,
  className = '',
  onClick
}) => {
  // Canvas: 100 x 36
  // Left channel head (hemispherical): x 0-16
  // Left flange pair: x 16-19
  // Shell body (rectangle): x 19-72
  // Right flange pair: x 72-75
  // Right bonnet (squared box): x 75-92
  // Right bonnet flange: x 92-95
  // Right bonnet end cap: x 95-100

  return (
    <g
      id={`st-${tag.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
      transform={`translate(${x}, ${y}) scale(${width / 100}, ${height / 36})`}
      className={`select-none ${className}`}
      onClick={onClick}
    >
      {/* ====== LEFT CHANNEL HEAD (Hemispherical Dome) ====== */}
      <path
        d="M 18,6 L 10,6 A 12,12 0 0,0 10,30 L 18,30 Z"
        fill={fillColor}
        stroke={color}
        strokeWidth="1.8"
      />

      {/* ====== LEFT FLANGE PAIR ====== */}
      <line x1="16" y1="3" x2="16" y2="33" stroke={color} strokeWidth="1.5" />
      <line x1="18" y1="3" x2="18" y2="33" stroke={color} strokeWidth="1.5" />

      {/* ====== SHELL BODY (Main Rectangle) ====== */}
      <rect
        x="18"
        y="6"
        width="54"
        height="24"
        fill={fillColor}
        stroke={color}
        strokeWidth="1.8"
      />

      {/* ====== RIGHT FLANGE PAIR (Shell to Bonnet) ====== */}
      <line x1="72" y1="3" x2="72" y2="33" stroke={color} strokeWidth="1.5" />
      <line x1="74" y1="3" x2="74" y2="33" stroke={color} strokeWidth="1.5" />

      {/* ====== RIGHT BONNET (Squared Box) ====== */}
      <rect
        x="74"
        y="6"
        width="18"
        height="24"
        fill={fillColor}
        stroke={color}
        strokeWidth="1.8"
      />

      {/* Right Bonnet end flange line */}
      <line x1="92" y1="3" x2="92" y2="33" stroke={color} strokeWidth="1.5" />

      {/* ====== OPTIONAL VALVE ON TOP ====== */}
      {showValve && (
        <g id={`valve-top-${tag}`}>
          {/* Vertical stem from shell top */}
          <line x1="45" y1="6" x2="45" y2="-2" stroke={color} strokeWidth="1.4" />
          {/* Valve body (bowtie / butterfly shape) */}
          <path
            d="M 39,-2 L 45,-8 L 51,-2 Z"
            fill="#dfdf00"
            stroke="#dfdf00"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <path
            d="M 39,-14 L 45,-8 L 51,-14 Z"
            fill="#dfdf00"
            stroke="#dfdf00"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          {/* Valve handle */}
          <line x1="45" y1="-14" x2="45" y2="-18" stroke="#dfdf00" strokeWidth="1.4" />
          <line x1="40" y1="-18" x2="50" y2="-18" stroke="#dfdf00" strokeWidth="1.6" />
        </g>
      )}

      {/* ====== TAG LABEL ====== */}
      <text
        x="45"
        y="19"
        fill="#ffffff"
        fontFamily="Courier New, monospace"
        fontSize="9"
        fontWeight="bold"
        textAnchor="middle"
        dominantBaseline="central"
      >
        {tag}
      </text>
    </g>
  );
};

/**
 * Standard ISA-5.1 Fin-Fan / Forced Air Cooler Heat Exchanger
 * Matching: "FORCED AIR COOLER" / "FIN EXCHANGER" in reference
 */
export const AirCoolerExchangerSymbol: React.FC<HeatExchangerSymbolProps> = ({
  x = 0,
  y = 0,
  width = 75,
  height = 32,
  tag = '4E-40',
  duty,
  color = '#22c55e',
  fillColor = '#000000',
  className = '',
  onClick
}) => {
  return (
    <g
      id={`aircooler-${tag.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
      transform={`translate(${x}, ${y}) scale(${width / 75}, ${height / 32})`}
      className={`select-none ${className}`}
      onClick={onClick}
    >
      {/* Fin Tube Bundle (Top Rectangle) */}
      <rect
        x="6"
        y="4"
        width="63"
        height="14"
        fill={fillColor}
        stroke={color}
        strokeWidth="1.6"
      />
      {/* Cooling Fins / Tube Zigzag */}
      <line x1="16" y1="4" x2="16" y2="18" stroke={color} strokeWidth="0.8" />
      <line x1="26" y1="4" x2="26" y2="18" stroke={color} strokeWidth="0.8" />
      <line x1="36" y1="4" x2="36" y2="18" stroke={color} strokeWidth="0.8" />
      <line x1="46" y1="4" x2="46" y2="18" stroke={color} strokeWidth="0.8" />
      <line x1="56" y1="4" x2="56" y2="18" stroke={color} strokeWidth="0.8" />

      {/* Fan Plenum / Fan Ring below tube bundle */}
      <path
        d="M 12,18 L 18,28 L 57,28 L 63,18 Z"
        fill="none"
        stroke={color}
        strokeWidth="1.4"
      />
      {/* Fan Blades */}
      <line x1="37.5" y1="28" x2="37.5" y2="23" stroke={color} strokeWidth="1.2" />
      <path
        d="M 28,24 Q 37.5,21 47,24"
        fill="none"
        stroke={color}
        strokeWidth="1.4"
      />

      {/* Tag Label */}
      <text
        x="37.5"
        y="12"
        fill="#ffffff"
        fontFamily="monospace"
        fontSize="7"
        fontWeight="bold"
        textAnchor="middle"
        dominantBaseline="central"
      >
        {tag}
      </text>
    </g>
  );
};
