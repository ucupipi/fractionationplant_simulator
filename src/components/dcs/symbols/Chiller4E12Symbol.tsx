import React from 'react';

interface Chiller4E12SymbolProps {
  x?: number;
  y?: number;
  scale?: number;
  className?: string;
  tag?: string;
  onClick?: () => void;
}

/**
 * 4E-12 Chiller / Electronic Heat Exchanger Component Symbol
 * Designed per exact specifications:
 * - Dimensions: 150px width x 50px height (Canvas: 150x100)
 * - Semi-circular left end (r=25px) with vertical divider at x=25
 * - Right rounded rectangle (r=15px)
 * - Yellow-green (#9ACD32) outline & label
 * - Dual red indicator arrows pointing toward divider at (25, 20) and (25, 30)
 */
export const Chiller4E12Symbol: React.FC<Chiller4E12SymbolProps> = ({
  x = 0,
  y = 0,
  scale = 1,
  className = '',
  tag = '4E-12',
  onClick
}) => {
  return (
    <g
      id="component-4e-12"
      transform={`translate(${x}, ${y}) scale(${scale})`}
      className={className}
      onClick={onClick}
    >
      {/* 1. Main Capsule / Bullet Body */}
      <g id="body-group">
        {/* Outer Contour: Semi-circular left (r=25) + Rounded Rect right (r=15) */}
        <path
          id="capsule-outline"
          d="M 25 0 
             A 25 25 0 0 0 25 50 
             L 135 50 
             A 15 15 0 0 0 150 35 
             L 150 15 
             A 15 15 0 0 0 135 0 
             Z"
          fill="#000000"
          stroke="#9ACD32"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Vertical Divider Line at x=25px */}
        <line
          id="divider-line"
          x1="25"
          y1="0"
          x2="25"
          y2="50"
          stroke="#9ACD32"
          strokeWidth="2"
        />
      </g>

      {/* 2. Text Label: Centered in right section at (87, 25) */}
      <g id="label-group">
        <text
          id="label-text"
          x="87"
          y="25"
          fill="#9ACD32"
          fontFamily="monospace"
          fontSize="16"
          fontWeight="bold"
          textAnchor="middle"
          dominantBaseline="central"
        >
          {tag}
        </text>
      </g>

      {/* 3. Indicator Arrows at Divider Line (x=25) */}
      <g id="indicator-arrows-group">
        {/* Top Indicator Arrow (Pointing Down to (25, 20)) */}
        <g id="top-indicator-arrow">
          <line
            id="top-arrow-stem"
            x1="25"
            y1="0"
            x2="25"
            y2="15"
            stroke="#FF0000"
            strokeWidth="2"
          />
          <polygon
            id="top-arrow-head"
            points="21,12 29,12 25,20"
            fill="#FF0000"
            stroke="#FF0000"
            strokeWidth="1"
          />
        </g>

        {/* Bottom Indicator Arrow (Pointing Up to (25, 30)) */}
        <g id="bottom-indicator-arrow">
          <line
            id="bottom-arrow-stem"
            x1="25"
            y1="50"
            x2="25"
            y2="35"
            stroke="#FF0000"
            strokeWidth="2"
          />
          <polygon
            id="bottom-arrow-head"
            points="21,38 29,38 25,30"
            fill="#FF0000"
            stroke="#FF0000"
          />
        </g>
      </g>
    </g>
  );
};

export default Chiller4E12Symbol;
