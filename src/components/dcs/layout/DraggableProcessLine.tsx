import React, { useState, useRef } from 'react';
import { CustomProcessLine, useLayoutStore } from '../../../stores/useLayoutStore';

interface DraggableProcessLineProps {
  line: CustomProcessLine;
  onSelect?: (lineId: string) => void;
}

export const DraggableProcessLine: React.FC<DraggableProcessLineProps> = ({ line, onSelect }) => {
  const isEditMode = useLayoutStore((s) => s.isEditMode);
  const gridSnap = useLayoutStore((s) => s.gridSnap);
  const selectedLineId = useLayoutStore((s) => s.selectedLineId);
  const selectedPointIndex = useLayoutStore((s) => s.selectedPointIndex);
  const setSelectedLineId = useLayoutStore((s) => s.setSelectedLineId);
  const updateLine = useLayoutStore((s) => useLayoutStore.getState().updateLine);
  const updateLinePoint = useLayoutStore((s) => useLayoutStore.getState().updateLinePoint);
  const addLinePoint = useLayoutStore((s) => useLayoutStore.getState().addLinePoint);
  const removeLinePoint = useLayoutStore((s) => useLayoutStore.getState().removeLinePoint);

  const isSelected = selectedLineId === line.id;
  const snap = gridSnap > 0 ? gridSnap : 1;

  // activeDragPoint: null = idle, -1 = dragging whole line, >=0 = dragging specific vertex index
  const [activeDragPoint, setActiveDragPoint] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState<{ dx: number; dy: number } | null>(null);

  const dragStartRef = useRef<{
    startMouseX: number;
    startMouseY: number;
    startPointX: number;
    startPointY: number;
    pointIndex: number;
    origPoints: { x: number; y: number }[];
    svgCTMInverse?: DOMMatrix | null;
  }>({
    startMouseX: 0,
    startMouseY: 0,
    startPointX: 0,
    startPointY: 0,
    pointIndex: 0,
    origPoints: []
  });

  // Handle dragging specific vertex
  const handlePointPointerDown = (e: React.PointerEvent<SVGCircleElement>, pointIndex: number) => {
    if (!isEditMode) return;
    e.stopPropagation();
    try {
      (e.target as Element).setPointerCapture?.(e.pointerId);
    } catch {}

    setSelectedLineId(line.id, pointIndex);
    setActiveDragPoint(pointIndex);
    setDragOffset({ dx: 0, dy: 0 });

    const currentPt = line.points[pointIndex] || { x: 0, y: 0 };
    const svg = (e.currentTarget.ownerSVGElement || e.currentTarget.closest('svg')) as SVGSVGElement | null;
    const ctm = svg?.getScreenCTM();
    const inverseCTM = ctm ? ctm.inverse() : null;

    dragStartRef.current = {
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startPointX: currentPt.x,
      startPointY: currentPt.y,
      pointIndex,
      origPoints: [...line.points],
      svgCTMInverse: inverseCTM
    };
  };

  const handlePointPointerMove = (e: React.PointerEvent<SVGCircleElement>) => {
    if (activeDragPoint === null || !isEditMode) return;
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

  const handlePointPointerUp = (e: React.PointerEvent<SVGCircleElement>) => {
    if (activeDragPoint === null || !isEditMode) return;
    e.stopPropagation();
    try {
      (e.target as Element).releasePointerCapture?.(e.pointerId);
    } catch {}

    const { startPointX, startPointY, pointIndex } = dragStartRef.current;
    const finalX = startPointX + (dragOffset?.dx || 0);
    const finalY = startPointY + (dragOffset?.dy || 0);

    updateLinePoint(line.id, pointIndex, finalX, finalY);
    setActiveDragPoint(null);
    setDragOffset(null);
  };

  // Handle dragging whole line body
  const handleLinePointerDown = (e: React.PointerEvent<SVGElement>) => {
    if (!isEditMode) return;
    e.stopPropagation();
    try {
      (e.target as Element).setPointerCapture?.(e.pointerId);
    } catch {}

    setSelectedLineId(line.id);
    if (onSelect) onSelect(line.id);
    setActiveDragPoint(-1);
    setDragOffset({ dx: 0, dy: 0 });

    const svg = (e.currentTarget.ownerSVGElement || e.currentTarget.closest('svg')) as SVGSVGElement | null;
    const ctm = svg?.getScreenCTM();
    const inverseCTM = ctm ? ctm.inverse() : null;

    dragStartRef.current = {
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startPointX: 0,
      startPointY: 0,
      pointIndex: -1,
      origPoints: [...line.points],
      svgCTMInverse: inverseCTM
    };
  };

  const handleLinePointerMove = (e: React.PointerEvent<SVGElement>) => {
    if (activeDragPoint !== -1 || !isEditMode) return;
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

  const handleLinePointerUp = (e: React.PointerEvent<SVGElement>) => {
    if (activeDragPoint !== -1 || !isEditMode) return;
    e.stopPropagation();
    try {
      (e.target as Element).releasePointerCapture?.(e.pointerId);
    } catch {}

    const { origPoints } = dragStartRef.current;
    const dx = dragOffset?.dx || 0;
    const dy = dragOffset?.dy || 0;

    const newPoints = origPoints.map((p) => ({
      x: Math.round((p.x + dx) / snap) * snap,
      y: Math.round((p.y + dy) / snap) * snap
    }));

    updateLine(line.id, { points: newPoints });
    setActiveDragPoint(null);
    setDragOffset(null);
  };

  // Compute rendered points coordinates during live dragging
  const currentPoints = line.points.map((pt, idx) => {
    if (activeDragPoint === -1 && dragOffset) {
      return {
        x: pt.x + dragOffset.dx,
        y: pt.y + dragOffset.dy
      };
    }
    if (activeDragPoint === idx && dragOffset) {
      return {
        x: pt.x + dragOffset.dx,
        y: pt.y + dragOffset.dy
      };
    }
    return pt;
  });

  const pointsString = currentPoints.map((p) => `${p.x},${p.y}`).join(' ');

  // Midpoints for inserting new bends
  const midPoints = [];
  if (isEditMode && isSelected) {
    for (let i = 0; i < currentPoints.length - 1; i++) {
      const p1 = currentPoints[i];
      const p2 = currentPoints[i + 1];
      midPoints.push({
        segmentIndex: i,
        x: Math.round((p1.x + p2.x) / 2),
        y: Math.round((p1.y + p2.y) / 2)
      });
    }
  }

  const strokeDash =
    line.dashed === true
      ? '3 3'
      : typeof line.dashed === 'string'
      ? line.dashed
      : line.type === 'SIGNAL'
      ? '2.4 2.4'
      : line.type === 'PNEUMATIC'
      ? '5 3'
      : 'none';

  return (
    <g id={`line-${line.id}`} className={`select-none ${isEditMode ? 'cursor-pointer' : ''}`}>
      {/* Invisible wider hit area for easy clicking & whole line dragging in edit mode */}
      {isEditMode && (
        <polyline
          points={pointsString}
          fill="none"
          stroke="transparent"
          strokeWidth={Math.max(14, line.strokeWidth + 10)}
          strokeLinecap="round"
          strokeLinejoin="round"
          onPointerDown={handleLinePointerDown}
          onPointerMove={handleLinePointerMove}
          onPointerUp={handleLinePointerUp}
        />
      )}

      {/* Selected glow effect */}
      {isEditMode && isSelected && (
        <polyline
          points={pointsString}
          fill="none"
          stroke="#00e5ff"
          strokeWidth={line.strokeWidth + 3.5}
          strokeOpacity={0.7}
          strokeLinecap="round"
          strokeLinejoin="round"
          onPointerDown={handleLinePointerDown}
          onPointerMove={handleLinePointerMove}
          onPointerUp={handleLinePointerUp}
        />
      )}

      {/* Actual Process or Signal Line */}
      <polyline
        points={pointsString}
        fill="none"
        stroke={line.color || '#00d2ff'}
        strokeWidth={line.strokeWidth || 1}
        strokeDasharray={strokeDash}
        strokeLinecap="round"
        strokeLinejoin="round"
        onPointerDown={isEditMode ? handleLinePointerDown : undefined}
        onPointerMove={isEditMode ? handleLinePointerMove : undefined}
        onPointerUp={isEditMode ? handleLinePointerUp : undefined}
      />

      {/* Optional Line Label Removed per user request */}

      {/* Interactive Vertex Handles in Edit Mode */}
      {isEditMode && isSelected && (
        <g>
          {currentPoints.map((pt, idx) => {
            const isPointSelected = selectedPointIndex === idx || activeDragPoint === idx;
            return (
              <g key={`handle-${idx}`}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isPointSelected ? 5 : 3.8}
                  fill={isPointSelected ? '#00e5ff' : '#ffffff'}
                  stroke="#0284c7"
                  strokeWidth="1.4"
                  className="cursor-move hover:scale-125 transition-transform"
                  onPointerDown={(e) => handlePointPointerDown(e, idx)}
                  onPointerMove={handlePointPointerMove}
                  onPointerUp={handlePointPointerUp}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (currentPoints.length > 2) {
                      removeLinePoint(line.id, idx);
                    }
                  }}
                />
                {/* Vertex coordinate tooltip */}
                {isPointSelected && (
                  <g transform={`translate(${pt.x + 6}, ${pt.y - 8})`} pointerEvents="none">
                    <rect x="0" y="0" width="45" height="10" fill="#0f172a" rx="1.5" stroke="#0284c7" strokeWidth="0.5" />
                    <text x="22" y="7.5" fill="#38bdf8" fontSize="6" textAnchor="middle" fontFamily="monospace">
                      {pt.x},{pt.y}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Add Bend Point handles at segment midpoints */}
          {midPoints.map((mp, mIdx) => (
            <g
              key={`mid-${mIdx}`}
              transform={`translate(${mp.x}, ${mp.y})`}
              className="cursor-pointer hover:scale-125 transition-transform"
              onClick={(e) => {
                e.stopPropagation();
                addLinePoint(line.id, mp.segmentIndex, mp.x, mp.y);
              }}
            >
              <circle cx="0" cy="0" r="3.2" fill="#10b981" stroke="#ffffff" strokeWidth="0.8" />
              <text x="0" y="2.5" fill="#ffffff" fontSize="6.5" fontWeight="bold" textAnchor="middle">
                +
              </text>
            </g>
          ))}
        </g>
      )}
    </g>
  );
};
