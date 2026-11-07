import React, { useState, useRef } from 'react';
import { CustomInstrumentSymbol, useLayoutStore } from '../../../stores/useLayoutStore';
import { useSimulationStore } from '../../../stores/simulationStore';
import { useDCSStore } from '../../../stores/dcsStore';
import { TAG_METADATA_REGISTRY } from '../../../data/tags';

interface DraggableInstrumentSymbolProps {
  symbol: CustomInstrumentSymbol;
}

export const DraggableInstrumentSymbol: React.FC<DraggableInstrumentSymbolProps> = ({ symbol }) => {
  const isEditMode = useLayoutStore((s) => s.isEditMode);
  const selectedElementId = useLayoutStore((s) => s.selectedElementId);
  const setSelectedElementId = useLayoutStore((s) => s.setSelectedElementId);
  const updateInstrumentSymbol = useLayoutStore((s) => s.updateInstrumentSymbol);

  const { tags, pumps, setControllerMV } = useSimulationStore();
  const { openFaceplate, openPumpPopup } = useDCSStore();

  const isSelected = selectedElementId === symbol.id;
  const [dragOffset, setDragOffset] = useState<{ dx: number; dy: number } | null>(null);
  const isDragging = dragOffset !== null;

  const dragStartRef = useRef<{
    startMouseX: number;
    startMouseY: number;
    startPointX: number;
    startPointY: number;
    svgCTMInverse?: DOMMatrix | null;
  }>({
    startMouseX: 0,
    startMouseY: 0,
    startPointX: symbol.x,
    startPointY: symbol.y
  });

  const handlePointerDown = (e: React.PointerEvent<SVGGElement>) => {
    if (!isEditMode) return;
    e.stopPropagation();
    try {
      (e.target as Element).setPointerCapture?.(e.pointerId);
    } catch {}

    setSelectedElementId(symbol.id);
    setDragOffset({ dx: 0, dy: 0 });

    const svg = (e.currentTarget.ownerSVGElement || e.currentTarget.closest('svg')) as SVGSVGElement | null;
    const ctm = svg?.getScreenCTM();
    const inverseCTM = ctm ? ctm.inverse() : null;

    dragStartRef.current = {
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startPointX: symbol.x,
      startPointY: symbol.y,
      svgCTMInverse: inverseCTM
    };
  };

  const handlePointerMove = (e: React.PointerEvent<SVGGElement>) => {
    if (!isDragging || !isEditMode) return;
    e.stopPropagation();

    const { startMouseX, startMouseY, svgCTMInverse } = dragStartRef.current;

    let dx = e.clientX - startMouseX;
    let dy = e.clientY - startMouseY;

    if (svgCTMInverse) {
      dx = dx * svgCTMInverse.a;
      dy = dy * svgCTMInverse.d;
    }

    setDragOffset({ dx: Math.round(dx), dy: Math.round(dy) });
  };

  const handlePointerUp = (e: React.PointerEvent<SVGGElement>) => {
    if (!isDragging || !isEditMode) return;
    e.stopPropagation();
    try {
      (e.target as Element).releasePointerCapture?.(e.pointerId);
    } catch {}

    const { startPointX, startPointY } = dragStartRef.current;
    const finalX = startPointX + (dragOffset?.dx || 0);
    const finalY = startPointY + (dragOffset?.dy || 0);

    updateInstrumentSymbol(symbol.id, { x: finalX, y: finalY });
    setDragOffset(null);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isEditMode) {
      e.stopPropagation();
      setSelectedElementId(symbol.id);
      return;
    }

    if (symbol.tagId) {
      if (symbol.symbolType === 'PUMP') {
        openPumpPopup(symbol.tagId);
      } else if (symbol.symbolType === 'MANUAL_VALVE') {
        const currentMv = liveTag?.mv ?? 0;
        const newMv = currentMv > 50 ? 0 : 100;
        setControllerMV(symbol.tagId, newMv);
      } else {
        openFaceplate(symbol.tagId);
      }
    }
  };

  const posX = isDragging ? symbol.x + (dragOffset?.dx || 0) : symbol.x;
  const posY = isDragging ? symbol.y + (dragOffset?.dy || 0) : symbol.y;
  const rotation = symbol.rotation || 0;
  const scale = symbol.scale || 1;

  // Live simulation binding
  const liveTag = symbol.tagId ? tags[symbol.tagId] : null;
  const tagMeta = symbol.tagId ? TAG_METADATA_REGISTRY[symbol.tagId] : null;
  const livePump = symbol.tagId ? pumps[symbol.tagId] : null;

  const hasAlarm = liveTag?.alarmState && liveTag.alarmState !== 'NORMAL';
  const isUnack = liveTag?.alarmState === 'ACTIVE_UNACK';
  const measuredVal =
    liveTag?.measuredValue !== undefined
      ? liveTag.measuredValue.toFixed(tagMeta?.decimals ?? 1)
      : symbol.subLabel || '';

  // Render symbol graphic according to ISA standard
  const renderSymbolGraphic = () => {
    const mainColor = symbol.color || '#38bdf8';

    switch (symbol.symbolType) {
      case 'TRANSMITTER_BUBBLE':
        return (
          <g>
            <circle
              cx="0"
              cy="0"
              r="10"
              fill="#030712"
              stroke={hasAlarm ? '#ef4444' : mainColor}
              strokeWidth="1.2"
              className={isUnack ? 'animate-pulse' : ''}
            />
            <line x1="-10" y1="0" x2="10" y2="0" stroke={mainColor} strokeWidth="0.7" />
            <text x="0" y="-2.5" fill="#ffffff" fontSize="6" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              {symbol.label || (symbol.tagId ? symbol.tagId.substring(0, 4) : 'TX')}
            </text>
            <text x="0" y="6.5" fill={hasAlarm ? '#f87171' : '#38bdf8'} fontSize="5.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              {measuredVal}
            </text>
          </g>
        );

      case 'CONTROL_VALVE': {
        const mvVal = liveTag?.mv !== undefined ? `${liveTag.mv.toFixed(0)}%` : '';
        return (
          <g>
            {/* Actuator Diaphragm Dome */}
            <path d="M -6,-7 Q 0,-13 6,-7 Z" fill="#1e293b" stroke={mainColor} strokeWidth="0.8" />
            <line x1="0" y1="-7" x2="0" y2="0" stroke={mainColor} strokeWidth="0.9" />
            {/* Opposing Triangles (Valve Body) */}
            <polygon points="-7,-4 0,0 -7,4" fill={mainColor} fillOpacity="0.4" stroke={mainColor} strokeWidth="1" />
            <polygon points="7,-4 0,0 7,4" fill={mainColor} fillOpacity="0.4" stroke={mainColor} strokeWidth="1" />
            {/* Valve Label */}
            <text x="0" y="11" fill="#ffffff" fontSize="5.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              {symbol.label || (symbol.tagId ? symbol.tagId : 'CV')}
            </text>
            {mvVal && (
              <text x="0" y="17" fill="#22c55e" fontSize="5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                {mvVal}
              </text>
            )}
          </g>
        );
      }

      case 'MANUAL_VALVE': {
        const isOpen = (liveTag?.mv ?? 0) > 50;
        const valveColor = isOpen ? '#10b981' : mainColor; // Green if open, else default (usually blue #38bdf8)
        return (
          <g style={{ cursor: 'pointer' }}>
            <line x1="0" y1="-5" x2="0" y2="0" stroke={valveColor} strokeWidth="0.9" />
            <line x1="-4" y1="-5" x2="4" y2="-5" stroke={valveColor} strokeWidth="1.2" />
            <polygon points="-6,-3.5 0,0 -6,3.5" fill={valveColor} fillOpacity={isOpen ? "0.8" : "0.3"} stroke={valveColor} strokeWidth="0.9" />
            <polygon points="6,-3.5 0,0 6,3.5" fill={valveColor} fillOpacity={isOpen ? "0.8" : "0.3"} stroke={valveColor} strokeWidth="0.9" />
            <text x="0" y="9" fill={isOpen ? "#10b981" : "#94a3b8"} fontSize="5" fontFamily="monospace" textAnchor="middle">
              {symbol.label || 'HV'}
            </text>
          </g>
        );
      }

      case 'CHECK_VALVE':
        return (
          <g>
            <polygon points="-6,-3.5 0,0 -6,3.5" fill={mainColor} fillOpacity="0.4" stroke={mainColor} strokeWidth="0.9" />
            <line x1="0" y1="-4" x2="0" y2="4" stroke={mainColor} strokeWidth="1" />
            <line x1="0" y1="0" x2="6" y2="0" stroke={mainColor} strokeWidth="1" />
            <text x="0" y="8" fill="#94a3b8" fontSize="5" fontFamily="monospace" textAnchor="middle">
              NRV
            </text>
          </g>
        );

      case 'PUMP': {
        const isRunning = livePump ? livePump.running : false;
        const isTripped = livePump ? livePump.tripped : false;
        const pumpColor = isTripped ? '#ef4444' : isRunning ? '#10b981' : '#64748b';
        return (
          <g>
            <circle cx="0" cy="0" r="8" fill="#0b1320" stroke={pumpColor} strokeWidth="1.2" className={isTripped ? 'animate-pulse' : ''} />
            <polygon points="5,-5 9,0 5,5" fill={pumpColor} />
            <circle cx="0" cy="-11" r="4.5" fill="#1e293b" stroke="#ffffff" strokeWidth="0.8" />
            <text x="0" y="-9" fill="#ffffff" fontSize="5.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              M
            </text>
            <text x="0" y="14" fill="#ffffff" fontSize="6" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              {symbol.label || (symbol.tagId ? symbol.tagId : 'PUMP')}
            </text>
          </g>
        );
      }

      case 'HEAT_EXCHANGER':
        return (
          <g>
            <circle cx="0" cy="0" r="11" fill="#08101a" stroke={mainColor} strokeWidth="1.2" />
            <path d="M -8,0 L -3,-4 L 3,4 L 8,0" fill="none" stroke={mainColor} strokeWidth="1" />
            <text x="0" y="17" fill="#ffffff" fontSize="6" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              {symbol.label || 'HEX'}
            </text>
          </g>
        );

      case 'KETTLE_EXCHANGER':
        return (
          <g transform="translate(-35, -15)">
            <path
              d="M 4,28 A 9,9 0 0,1 4,10 L 16,10 L 20,10 L 32,3 L 60,3 A 12,12 0 0,1 60,28 L 4,28 Z"
              fill="#030712"
              stroke={mainColor}
              strokeWidth="1.3"
            />
            <line x1="16" y1="8" x2="16" y2="30" stroke={mainColor} strokeWidth="1.2" />
            <line x1="18" y1="8" x2="18" y2="30" stroke={mainColor} strokeWidth="1.2" />
            <path d="M 18,15 L 48,15 A 5,5 0 0,1 48,25 L 18,25" fill="none" stroke={mainColor} strokeWidth="0.9" />
            <line x1="54" y1="13" x2="54" y2="28" stroke={mainColor} strokeWidth="1" />
            <text x="44" y="10" fill="#ffffff" fontSize="5.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              {symbol.label || 'KETTLE'}
            </text>
          </g>
        );

      case 'SHELL_TUBE_EXCHANGER':
        return (
          <g transform="translate(-28, -10)">
            <rect x="12" y="3" width="32" height="14" fill="#030712" stroke={mainColor} strokeWidth="1.2" />
            <path d="M 12,3 L 7,3 A 7,7 0 0,0 7,17 L 12,17 Z" fill="#030712" stroke={mainColor} strokeWidth="1.2" />
            <path d="M 44,3 L 49,3 A 7,7 0 0,1 49,17 L 44,17 Z" fill="#030712" stroke={mainColor} strokeWidth="1.2" />
            <line x1="12" y1="10" x2="44" y2="10" stroke={mainColor} strokeWidth="0.8" strokeDasharray="2 1.5" />
            <text x="28" y="11" fill="#ffffff" fontSize="5.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle" dominantBaseline="central">
              {symbol.label || 'E-HEX'}
            </text>
          </g>
        );

      case 'AIR_COOLER':
        return (
          <g transform="translate(-25, -12)">
            <rect x="4" y="2" width="42" height="10" fill="#030712" stroke={mainColor} strokeWidth="1.2" />
            <line x1="11" y1="2" x2="11" y2="12" stroke={mainColor} strokeWidth="0.6" />
            <line x1="18" y1="2" x2="18" y2="12" stroke={mainColor} strokeWidth="0.6" />
            <line x1="25" y1="2" x2="25" y2="12" stroke={mainColor} strokeWidth="0.6" />
            <line x1="32" y1="2" x2="32" y2="12" stroke={mainColor} strokeWidth="0.6" />
            <line x1="39" y1="2" x2="39" y2="12" stroke={mainColor} strokeWidth="0.6" />
            <path d="M 8,12 L 12,20 L 38,20 L 42,12 Z" fill="none" stroke={mainColor} strokeWidth="1.0" />
            <text x="25" y="7" fill="#ffffff" fontSize="5" fontFamily="monospace" fontWeight="bold" textAnchor="middle" dominantBaseline="central">
              {symbol.label || 'FIN-FAN'}
            </text>
          </g>
        );

      case 'VESSEL_NOZZLE':
        return (
          <g>
            <rect x="-3" y="-3" width="6" height="6" fill={mainColor} rx="1" />
            <text x="0" y="8" fill="#94a3b8" fontSize="5" fontFamily="monospace" textAnchor="middle">
              {symbol.label || 'NOZZLE'}
            </text>
          </g>
        );

      case 'TEXT_LABEL':
        return (
          <g>
            <text x="0" y="0" fill={mainColor} fontSize={symbol.scale ? 8 * symbol.scale : 8} fontFamily="monospace" fontWeight="bold" textAnchor="middle" dominantBaseline="central">
              {symbol.label || 'TEXT'}
            </text>
          </g>
        );

      default:
        return null;
    }
  };

  return (
    <g
      id={`symbol-${symbol.id}`}
      transform={`translate(${posX}, ${posY}) rotate(${rotation}) scale(${scale})`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handleClick}
      className={`select-none ${isEditMode ? 'cursor-move' : 'cursor-pointer hover:opacity-90'}`}
      style={{ touchAction: isEditMode ? 'none' : 'auto' }}
    >
      {/* Symbol Graphics */}
      {renderSymbolGraphic()}

      {/* Edit Outline */}
      {isEditMode && isSelected && (
        <circle
          cx="0"
          cy="0"
          r="16"
          fill="none"
          stroke="#00e5ff"
          strokeWidth="1"
          strokeDasharray="3 2"
          pointerEvents="none"
        />
      )}
    </g>
  );
};
