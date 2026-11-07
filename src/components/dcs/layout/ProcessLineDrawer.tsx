import React, { useState, useRef, useEffect } from 'react';
import { ScreenId, useLayoutStore, LineType } from '../../../stores/useLayoutStore';
import { Check, X, CircleDot, GripHorizontal } from 'lucide-react';

interface ProcessLineDrawerProps {
  screenId: ScreenId;
}

export const ProcessLineDrawer: React.FC<ProcessLineDrawerProps> = ({ screenId }) => {
  const isEditMode = useLayoutStore((s) => s.isEditMode);
  const activeTool = useLayoutStore((s) => s.activeTool);
  const drawingLineType = useLayoutStore((s) => s.drawingLineType);
  const gridSnap = useLayoutStore((s) => s.gridSnap);
  const addLine = useLayoutStore((s) => s.addLine);
  const setActiveTool = useLayoutStore((s) => s.setActiveTool);

  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [currentCursor, setCurrentCursor] = useState<{ x: number; y: number } | null>(null);

  // Dragging state for the Drawing Control Overlay
  const [boxPos, setBoxPos] = useState<{ x: number; y: number }>({ x: 20, y: 20 });
  const [isDraggingBox, setIsDraggingBox] = useState(false);
  const boxDragRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({
    startX: 0,
    startY: 0,
    posX: 20,
    posY: 20
  });

  const handleBoxMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.stopPropagation();
    setIsDraggingBox(true);
    boxDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: boxPos.x,
      posY: boxPos.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingBox) return;
      const dx = e.clientX - boxDragRef.current.startX;
      const dy = e.clientY - boxDragRef.current.startY;
      setBoxPos({
        x: Math.max(5, Math.min(650, boxDragRef.current.posX + dx)),
        y: Math.max(5, Math.min(350, boxDragRef.current.posY + dy))
      });
    };

    const handleMouseUp = () => {
      setIsDraggingBox(false);
    };

    if (isDraggingBox) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingBox]);

  if (!isEditMode || activeTool !== 'DRAW_LINE') {
    return null;
  }

  const snap = gridSnap > 0 ? gridSnap : 1;

  const handleCanvasClick = (e: React.MouseEvent<SVGElement>) => {
    e.stopPropagation();
    const svg = (e.currentTarget.ownerSVGElement || e.currentTarget.closest('svg')) as SVGSVGElement | null;
    const ctm = svg?.getScreenCTM();
    if (!ctm) return;

    const inverse = ctm.inverse();
    const svgX = Math.round((e.clientX * inverse.a + inverse.e) / snap) * snap;
    const svgY = Math.round((e.clientY * inverse.d + inverse.f) / snap) * snap;

    setPoints((prev) => [...prev, { x: svgX, y: svgY }]);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGElement>) => {
    const svg = (e.currentTarget.ownerSVGElement || e.currentTarget.closest('svg')) as SVGSVGElement | null;
    const ctm = svg?.getScreenCTM();
    if (!ctm) return;

    const inverse = ctm.inverse();
    const svgX = Math.round((e.clientX * inverse.a + inverse.e) / snap) * snap;
    const svgY = Math.round((e.clientY * inverse.d + inverse.f) / snap) * snap;

    setCurrentCursor({ x: svgX, y: svgY });
  };

  const handleFinishLine = () => {
    if (points.length >= 2) {
      const isSignal = drawingLineType === 'SIGNAL';
      const isSteam = drawingLineType === 'STEAM';
      const isRefrigerant = drawingLineType === 'REFRIGERANT';

      const color = isSignal
        ? '#00d2ff'
        : isSteam
        ? '#ef4444'
        : isRefrigerant
        ? '#d946ef'
        : '#ffffff';

      const strokeWidth = isSignal ? 0.9 : 1.5;
      const dashed = isSignal ? '2.4 2.4' : isRefrigerant ? '3 1' : 'none';

      addLine({
        screenId,
        type: drawingLineType,
        points: [...points],
        color,
        strokeWidth,
        dashed
      });
    }
    setPoints([]);
    setActiveTool('SELECT');
  };

  const handleCancel = () => {
    setPoints([]);
    setActiveTool('SELECT');
  };

  const allPoints = currentCursor && points.length > 0 ? [...points, currentCursor] : points;
  const pointsStr = allPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <>
      {/* Invisible overlay capturing click events on the whole SVG */}
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="transparent"
        className="cursor-crosshair"
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onDoubleClick={handleFinishLine}
      />

      {/* Line being drawn */}
      {points.length > 0 && (
        <g pointerEvents="none">
          <polyline
            points={pointsStr}
            fill="none"
            stroke="#22c55e"
            strokeWidth="1.8"
            strokeDasharray={drawingLineType === 'SIGNAL' ? '3 2' : 'none'}
          />

          {points.map((pt, idx) => (
            <circle key={idx} cx={pt.x} cy={pt.y} r="3.5" fill="#22c55e" stroke="#ffffff" strokeWidth="1" />
          ))}

          {currentCursor && (
            <circle
              cx={currentCursor.x}
              cy={currentCursor.y}
              r="4"
              fill="none"
              stroke="#22c55e"
              strokeWidth="1.5"
              className="animate-ping"
            />
          )}
        </g>
      )}

      {/* Floating Drawing Control Overlay (Draggable) */}
      <foreignObject x={boxPos.x} y={boxPos.y} width="300" height="84" pointerEvents="auto">
        <div className="bg-[#0b1320]/95 border border-emerald-500/80 rounded-lg p-2.5 shadow-2xl backdrop-blur font-mono text-xs text-gray-200 flex flex-col gap-2 select-none">
          <div
            onMouseDown={handleBoxMouseDown}
            className="flex items-center justify-between cursor-grab active:cursor-grabbing hover:bg-white/5 px-1 py-0.5 rounded -mx-1 transition-colors"
            title="Drag to move this box anywhere"
          >
            <span className="font-bold text-emerald-400 flex items-center gap-1.5 text-[11px]">
              <GripHorizontal size={13} className="text-emerald-400 opacity-80" />
              <CircleDot size={12} className="animate-spin text-emerald-400" />
              DRAWING {drawingLineType} ({points.length} pts)
            </span>
            <span className="text-[9px] text-gray-400">Drag handle</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleFinishLine}
              disabled={points.length < 2}
              className={`flex-1 py-1 px-2 rounded font-bold text-[10px] flex items-center justify-center gap-1 ${
                points.length >= 2
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Check size={12} />
              <span>Complete Line</span>
            </button>
            <button
              onClick={handleCancel}
              className="py-1 px-2.5 bg-red-900/60 hover:bg-red-800 text-red-200 rounded font-bold text-[10px] flex items-center gap-1"
            >
              <X size={12} />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      </foreignObject>
    </>
  );
};

