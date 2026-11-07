import React, { useState, useRef } from 'react';
import { ScreenId, useLayoutStore } from '../../../stores/useLayoutStore';

interface DraggableTagProps {
  screenId: ScreenId;
  tagId: string;
  defaultX: number;
  defaultY: number;
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  label?: string;
  valueText?: string;
  unit?: string;
  hasAlarm?: boolean;
  isUnack?: boolean;
  color?: string;
  decimals?: number;
  renderContent?: (pos: { x: number; y: number }, isEdit: boolean, isSelected: boolean) => React.ReactNode;
}

export const DraggableTag: React.FC<DraggableTagProps> = ({
  screenId,
  tagId,
  defaultX,
  defaultY,
  children,
  onClick,
  className = '',
  label,
  valueText,
  unit = '',
  hasAlarm = false,
  isUnack = false,
  color = '#00e5ff',
  renderContent
}) => {
  const isEditMode = useLayoutStore((s) => s.isEditMode);
  const isSelected = useLayoutStore((s) => s.selectedElementId === tagId);
  const setSelectedElementId = useLayoutStore((s) => s.setSelectedElementId);
  const updateElementPosition = useLayoutStore((s) => s.updateElementPosition);
  const savedItem = useLayoutStore((s) => s.layouts[screenId]?.[tagId]);

  const rawX = savedItem?.x ?? defaultX;
  const rawY = savedItem?.y ?? defaultY;
  const isVisible = savedItem?.visible !== false;

  const [dragOffset, setDragOffset] = useState<{ dx: number; dy: number } | null>(null);
  const isDragging = dragOffset !== null;

  const dragStartRef = useRef<{ startMouseX: number; startMouseY: number; startElemX: number; startElemY: number; svgCTMInverse?: DOMMatrix | null }>({
    startMouseX: 0,
    startMouseY: 0,
    startElemX: rawX,
    startElemY: rawY
  });

  if (!isVisible && !isEditMode) {
    return null;
  }

  const handlePointerDown = (e: React.PointerEvent<SVGGElement>) => {
    if (!isEditMode) return;
    e.stopPropagation();
    try {
      (e.target as Element).setPointerCapture?.(e.pointerId);
    } catch {}

    setSelectedElementId(tagId);
    setDragOffset({ dx: 0, dy: 0 });

    const svg = (e.currentTarget.ownerSVGElement || e.currentTarget.closest('svg')) as SVGSVGElement | null;
    const ctm = svg?.getScreenCTM();
    const inverseCTM = ctm ? ctm.inverse() : null;

    dragStartRef.current = {
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startElemX: rawX,
      startElemY: rawY,
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

    const { startElemX, startElemY } = dragStartRef.current;
    const finalX = startElemX + (dragOffset?.dx || 0);
    const finalY = startElemY + (dragOffset?.dy || 0);

    updateElementPosition(screenId, tagId, finalX, finalY);
    setDragOffset(null);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isEditMode) {
      e.stopPropagation();
      setSelectedElementId(tagId);
      return;
    }
    if (onClick) {
      onClick(e);
    }
  };

  const posX = isDragging ? rawX + (dragOffset?.dx || 0) : rawX;
  const posY = isDragging ? rawY + (dragOffset?.dy || 0) : rawY;

  return (
    <g
      id={`tag-${tagId}`}
      transform={`translate(${posX}, ${posY})`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handleClick}
      className={`${className} ${
        isEditMode ? 'cursor-move select-none' : onClick ? 'cursor-pointer hover:opacity-90' : ''
      }`}
      style={{ touchAction: isEditMode ? 'none' : 'auto' }}
    >
      {/* Custom renderContent if passed */}
      {renderContent ? (
        renderContent({ x: posX, y: posY }, isEditMode, isSelected)
      ) : children ? (
        children
      ) : (
        /* Default Yokogawa-style rectangular tag display */
        <g>
          <rect
            x="0"
            y="0"
            width={72}
            height={28}
            fill="#030712"
            stroke={hasAlarm ? '#ef4444' : isSelected && isEditMode ? '#00e5ff' : '#1e293b'}
            strokeWidth={isSelected && isEditMode ? 1.5 : 1}
            className={isUnack ? 'animate-pulse' : ''}
            rx={2}
          />
          <text
            x="4"
            y="11"
            fill={hasAlarm ? '#f87171' : color}
            fontSize="8.5"
            fontFamily="Courier New, monospace"
            fontWeight="bold"
          >
            {label || tagId}
          </text>
          <text
            x={unit ? "48" : "68"}
            y="23"
            fill={hasAlarm ? '#ffffff' : '#ffffff'}
            fontSize="10"
            fontFamily="Courier New, monospace"
            fontWeight="bold"
            textAnchor="end"
          >
            {valueText !== undefined ? valueText : '0.0'}
          </text>
          {unit && (
            <text
              x="68"
              y="23"
              fill="#64748b"
              fontSize="7"
              fontFamily="Courier New, monospace"
              textAnchor="end"
            >
              {unit}
            </text>
          )}
        </g>
      )}

      {/* Visual outline and coordinate tooltip when in Edit Mode */}
      {isEditMode && isSelected && (
        <g pointerEvents="none">
          <rect
            x="-4"
            y="-4"
            width={80}
            height={36}
            fill="none"
            stroke="#00e5ff"
            strokeWidth="1"
            strokeDasharray="3 2"
            rx="3"
          />
          {/* Coordinates tooltip */}
          <g transform="translate(0, -14)">
            <rect x="0" y="0" width="60" height="12" fill="#0284c7" rx="2" />
            <text
              x="30"
              y="9"
              fill="#ffffff"
              fontSize="7.5"
              fontFamily="Courier New, monospace"
              fontWeight="bold"
              textAnchor="middle"
            >
              {posX},{posY}
            </text>
          </g>
        </g>
      )}

      {/* Tiny anchor point marker in edit mode */}
      {isEditMode && (
        <circle
          cx="0"
          cy="0"
          r="2.5"
          fill={isSelected ? '#00e5ff' : '#94a3b8'}
          stroke="#000000"
          strokeWidth="0.5"
        />
      )}
    </g>
  );
};
