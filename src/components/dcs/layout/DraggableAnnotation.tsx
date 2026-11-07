import React, { useState, useRef } from 'react';
import { InterviewAnnotation, useLayoutStore } from '../../../stores/useLayoutStore';

interface DraggableAnnotationProps {
  annotation: InterviewAnnotation;
  onEdit?: (ann: InterviewAnnotation) => void;
}

export const DraggableAnnotation: React.FC<DraggableAnnotationProps> = ({ annotation, onEdit }) => {
  const isEditMode = useLayoutStore((s) => s.isEditMode);
  const isSelected = useLayoutStore((s) => s.selectedElementId === annotation.id);
  const setSelectedElementId = useLayoutStore((s) => s.setSelectedElementId);
  const updateAnnotation = useLayoutStore((s) => s.updateAnnotation);
  const deleteAnnotation = useLayoutStore((s) => s.deleteAnnotation);
  const toggleAnnotationResolved = useLayoutStore((s) => s.toggleAnnotationResolved);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ dx: number; dy: number } | null>(null);
  const isDragging = dragOffset !== null;

  const dragStartRef = useRef<{ startMouseX: number; startMouseY: number; startElemX: number; startElemY: number; svgCTMInverse?: DOMMatrix | null }>({
    startMouseX: 0,
    startMouseY: 0,
    startElemX: annotation.x,
    startElemY: annotation.y
  });

  const handlePointerDown = (e: React.PointerEvent<SVGGElement>) => {
    if (!isEditMode) return;
    e.stopPropagation();
    try {
      (e.target as Element).setPointerCapture?.(e.pointerId);
    } catch {}

    setSelectedElementId(annotation.id);
    setDragOffset({ dx: 0, dy: 0 });

    const svg = (e.currentTarget.ownerSVGElement || e.currentTarget.closest('svg')) as SVGSVGElement | null;
    const ctm = svg?.getScreenCTM();
    const inverseCTM = ctm ? ctm.inverse() : null;

    dragStartRef.current = {
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startElemX: annotation.x,
      startElemY: annotation.y,
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

    updateAnnotation(annotation.id, { x: finalX, y: finalY });
    setDragOffset(null);
  };

  const cardColors = {
    QUESTION: { bg: '#082f49', border: '#0284c7', text: '#38bdf8', badge: '#0284c7' },
    CHECKPOINT: { bg: '#064e3b', border: '#059669', text: '#34d399', badge: '#059669' },
    NOTE: { bg: '#312e81', border: '#6366f1', text: '#a5b4fc', badge: '#6366f1' },
    FAULT: { bg: '#4c0519', border: '#e11d48', text: '#fb7185', badge: '#e11d48' }
  };

  const theme = cardColors[annotation.type] || cardColors.QUESTION;
  const posX = isDragging ? annotation.x + (dragOffset?.dx || 0) : annotation.x;
  const posY = isDragging ? annotation.y + (dragOffset?.dy || 0) : annotation.y;
  const cardWidth = 180;
  const cardHeight = isCollapsed ? 22 : 65;

  return (
    <g
      id={`annotation-${annotation.id}`}
      transform={`translate(${posX}, ${posY})`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={(e) => {
        if (isEditMode) {
          e.stopPropagation();
          setSelectedElementId(annotation.id);
        }
      }}
      className={`select-none ${isEditMode ? 'cursor-move' : ''}`}
      style={{ touchAction: isEditMode ? 'none' : 'auto' }}
    >
      {/* Background card */}
      <rect
        x="0"
        y="0"
        width={cardWidth}
        height={cardHeight}
        rx="4"
        fill={theme.bg}
        fillOpacity="0.95"
        stroke={isSelected && isEditMode ? '#00e5ff' : theme.border}
        strokeWidth={isSelected && isEditMode ? 1.8 : 1.2}
      />

      {/* Header Accent Bar */}
      <rect x="0" y="0" width={cardWidth} height="3" fill={theme.badge} rx="2" />

      {/* Card Type Badge & Title */}
      <g transform="translate(6, 12)">
        <rect x="0" y="0" width="38" height="9" rx="1.5" fill={theme.badge} />
        <text x="19" y="7" fill="#ffffff" fontSize="6" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
          {annotation.type}
        </text>
        <text x="44" y="7" fill="#ffffff" fontSize="7.5" fontWeight="bold" fontFamily="monospace">
          {annotation.title.length > 20 ? `${annotation.title.substring(0, 18)}..` : annotation.title}
        </text>
      </g>

      {/* Collapse / Expand Toggle Icon */}
      <g
        transform={`translate(${cardWidth - 14}, 6)`}
        className="cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          setIsCollapsed(!isCollapsed);
        }}
      >
        <rect x="0" y="0" width="10" height="10" rx="2" fill="#030712" fillOpacity="0.5" />
        <text x="5" y="7.5" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">
          {isCollapsed ? '+' : '−'}
        </text>
      </g>

      {/* Content Text (Word Wrapped) */}
      {!isCollapsed && (
        <g transform="translate(6, 26)">
          <text fill={theme.text} fontSize="7" fontFamily="Courier New, monospace" fontWeight="600">
            {annotation.content.length > 90 ? (
              <>
                <tspan x="0" dy="0">{annotation.content.substring(0, 32)}</tspan>
                <tspan x="0" dy="9">{annotation.content.substring(32, 64)}</tspan>
                <tspan x="0" dy="9">{annotation.content.substring(64, 96)}...</tspan>
              </>
            ) : annotation.content.length > 45 ? (
              <>
                <tspan x="0" dy="0">{annotation.content.substring(0, 34)}</tspan>
                <tspan x="0" dy="9">{annotation.content.substring(34, 70)}</tspan>
                <tspan x="0" dy="9">{annotation.content.substring(70)}</tspan>
              </>
            ) : (
              <tspan x="0" dy="0">{annotation.content}</tspan>
            )}
          </text>
        </g>
      )}

      {/* Checkbox / Resolved status in Run mode */}
      {!isCollapsed && (
        <g
          transform={`translate(6, ${cardHeight - 11})`}
          className="cursor-pointer hover:opacity-80"
          onClick={(e) => {
            e.stopPropagation();
            toggleAnnotationResolved(annotation.id);
          }}
        >
          <rect x="0" y="0" width="7" height="7" rx="1.5" fill={annotation.resolved ? '#10b981' : '#1e293b'} stroke="#64748b" strokeWidth="0.6" />
          {annotation.resolved && (
            <text x="3.5" y="5.5" fill="#ffffff" fontSize="6" fontWeight="bold" textAnchor="middle">✓</text>
          )}
          <text x="10" y="5.5" fill="#94a3b8" fontSize="6.5" fontFamily="Courier New, monospace">
            {annotation.resolved ? 'RESOLVED / VERIFIED' : 'MARK AS CHECKED'}
          </text>
        </g>
      )}

      {/* Action Buttons in Edit Mode */}
      {isEditMode && !isCollapsed && (
        <g transform={`translate(${cardWidth - 36}, ${cardHeight - 13})`}>
          {/* Edit / Inspect Icon */}
          <g
            className="cursor-pointer hover:opacity-80"
            onClick={(e) => {
              e.stopPropagation();
              if (onEdit) onEdit(annotation);
            }}
          >
            <rect x="0" y="0" width="14" height="9" rx="1.5" fill="#0284c7" />
            <text x="7" y="6.5" fill="#ffffff" fontSize="6" fontWeight="bold" textAnchor="middle">✎</text>
          </g>

          {/* Delete Icon */}
          <g
            transform="translate(18, 0)"
            className="cursor-pointer hover:opacity-80"
            onClick={(e) => {
              e.stopPropagation();
              deleteAnnotation(annotation.id);
            }}
          >
            <rect x="0" y="0" width="14" height="9" rx="1.5" fill="#e11d48" />
            <text x="7" y="6.5" fill="#ffffff" fontSize="6" fontWeight="bold" textAnchor="middle">✕</text>
          </g>
        </g>
      )}

      {/* Edit Outline */}
      {isEditMode && isSelected && (
        <rect
          x="-3"
          y="-3"
          width={cardWidth + 6}
          height={cardHeight + 6}
          rx="5"
          fill="none"
          stroke="#00e5ff"
          strokeWidth="1"
          strokeDasharray="4 2"
          pointerEvents="none"
        />
      )}
    </g>
  );
};
