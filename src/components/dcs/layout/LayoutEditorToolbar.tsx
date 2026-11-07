import React, { useState, useRef, useEffect } from 'react';
import { ScreenId, useLayoutStore, LineType, InstrumentSymbolType } from '../../../stores/useLayoutStore';
import { TagInspectorModal } from './TagInspectorModal';
import {
  Grid,
  Magnet,
  RotateCcw,
  Check,
  MousePointer,
  Sliders,
  PlusCircle,
  FileDown,
  FileUp,
  Sparkles,
  GitCommit,
  Radio,
  Workflow,
  GripHorizontal
} from 'lucide-react';

interface LayoutEditorToolbarProps {
  screenId: ScreenId;
}

export const LayoutEditorToolbar: React.FC<LayoutEditorToolbarProps> = ({ screenId }) => {
  const {
    isEditMode,
    setEditMode,
    activeTool,
    setActiveTool,
    drawingLineType,
    setDrawingLineType,
    gridSnap,
    setGridSnap,
    showGrid,
    toggleGrid,
    resetScreenLayout,
    resetLinesToBaseline,
    resetSymbolsToBaseline,
    exportLayoutJSON,
    importLayoutJSON,
    addInstrumentSymbol
  } = useLayoutStore();

  const [showInspector, setShowInspector] = useState(true);
  const [saveToast, setSaveToast] = useState(false);
  const [showLineMenu, setShowLineMenu] = useState(false);
  const [showSymbolMenu, setShowSymbolMenu] = useState(false);

  // Dragging State for Toolbar
  const [toolbarPos, setToolbarPos] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingToolbar, setIsDraggingToolbar] = useState(false);
  const tbDragRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({
    startX: 0,
    startY: 0,
    posX: 0,
    posY: 0
  });

  const handleToolbarMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;
    setIsDraggingToolbar(true);
    const tbEl = e.currentTarget as HTMLElement;
    const rect = tbEl.getBoundingClientRect();
    const currentX = toolbarPos ? toolbarPos.x : rect.left;
    const currentY = toolbarPos ? toolbarPos.y : rect.top;

    tbDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: currentX,
      posY: currentY
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingToolbar) return;
      const dx = e.clientX - tbDragRef.current.startX;
      const dy = e.clientY - tbDragRef.current.startY;
      const newX = Math.max(10, Math.min(window.innerWidth - 450, tbDragRef.current.posX + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - 60, tbDragRef.current.posY + dy));
      setToolbarPos({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDraggingToolbar(false);
    };

    if (isDraggingToolbar) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingToolbar]);


  if (!isEditMode) {
    return (
      <div className="absolute top-2 right-4 z-40 animate-fadeIn">
        <button
          onClick={() => {
            setEditMode(true);
            setShowInspector(true);
          }}
          className="flex items-center gap-2 bg-[#090f17]/90 hover:bg-[#121c2a] text-cyan-400 hover:text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 shadow-lg px-3 py-1.5 rounded-full text-xs font-mono font-bold transition-all backdrop-blur-md group"
          title="Customize layout, process lines, & instruments (F9)"
        >
          <Sparkles className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform text-cyan-400" />
          <span>Edit UI & P&ID</span>
        </button>
      </div>
    );
  }

  const handleSave = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const handleExport = () => {
    const json = exportLayoutJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `badak_ots_layout_${screenId.toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        if (importLayoutJSON(text)) {
          handleSave();
        }
      }
    };
    input.click();
  };

  const handleQuickAddSymbol = (symType: InstrumentSymbolType, label: string) => {
    addInstrumentSymbol({
      screenId,
      symbolType: symType,
      x: 350,
      y: 180,
      rotation: 0,
      label,
      color: '#38bdf8'
    });
    setShowSymbolMenu(false);
  };

  return (
    <>
      {/* Top Floating Glassmorphic Toolbar (Draggable) */}
      <div
        style={
          toolbarPos
            ? { left: `${toolbarPos.x}px`, top: `${toolbarPos.y}px`, transform: 'none' }
            : undefined
        }
        onMouseDown={handleToolbarMouseDown}
        className={`absolute ${
          toolbarPos ? '' : 'top-2 left-1/2 -translate-x-1/2'
        } z-40 flex items-center gap-2 bg-[#090f17]/95 border border-cyan-500/50 shadow-2xl rounded-full px-3 py-1 text-xs font-mono text-gray-200 backdrop-blur-md animate-slideDown select-none cursor-grab active:cursor-grabbing`}
        title="Klik & drag area toolbar untuk memindahkan posisinya"
      >
        {/* Active Badge & Drag Handle */}
        <div className="flex items-center gap-1.5 pr-2 border-r border-[#1e2d40]">
          <GripHorizontal size={14} className="text-cyan-400 opacity-80" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="font-bold text-white tracking-wider text-[11px]">P&ID EDITOR</span>
          <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-600/50 px-1 py-0.2 rounded">
            {screenId}
          </span>
        </div>


        {/* Tool Selector: Select (V) / Draw Line (P) / Add Instrument (I) */}
        <div className="flex items-center gap-1 bg-[#05080e] p-0.5 rounded-full border border-gray-800">
          <button
            onClick={() => setActiveTool('SELECT')}
            className={`p-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-all ${
              activeTool === 'SELECT'
                ? 'bg-cyan-500 text-black shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
            title="Select & Move Instruments/Lines"
          >
            <MousePointer size={13} />
            <span className="text-[10px] pr-1">Select</span>
          </button>

          {/* Draw Line Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setActiveTool('DRAW_LINE');
                setShowLineMenu(!showLineMenu);
              }}
              className={`p-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-all ${
                activeTool === 'DRAW_LINE'
                  ? 'bg-emerald-500 text-black shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
              title="Draw Process / Signal Lines"
            >
              <Workflow size={13} />
              <span className="text-[10px] pr-1">Line: {drawingLineType}</span>
            </button>

            {showLineMenu && (
              <div className="absolute top-8 left-0 w-36 bg-[#0b1320] border border-emerald-500/60 rounded-lg shadow-2xl p-1.5 z-50 space-y-1 text-[10px] font-mono">
                {(['PROCESS', 'SIGNAL', 'STEAM', 'REFRIGERANT'] as LineType[]).map((lt) => (
                  <button
                    key={lt}
                    onClick={() => {
                      setDrawingLineType(lt);
                      setActiveTool('DRAW_LINE');
                      setShowLineMenu(false);
                    }}
                    className={`w-full text-left px-2 py-1 rounded flex items-center justify-between ${
                      drawingLineType === lt ? 'bg-emerald-600 text-white font-bold' : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    <span>{lt}</span>
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor:
                          lt === 'SIGNAL'
                            ? '#00d2ff'
                            : lt === 'STEAM'
                            ? '#ef4444'
                            : lt === 'REFRIGERANT'
                            ? '#d946ef'
                            : '#ffffff'
                      }}
                    ></span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Add Symbol Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSymbolMenu(!showSymbolMenu)}
              className="p-1.5 rounded-full text-xs font-bold text-amber-400 hover:text-amber-300 hover:bg-gray-800 flex items-center gap-1 transition-all"
              title="Add Instrument or Valve Symbol"
            >
              <Radio size={13} />
              <span className="text-[10px] pr-1">+ Instrument</span>
            </button>

            {showSymbolMenu && (
              <div className="absolute top-8 left-0 w-44 bg-[#0b1320] border border-amber-500/60 rounded-lg shadow-2xl p-1.5 z-50 space-y-1 text-[10px] font-mono">
                <button
                  onClick={() => handleQuickAddSymbol('TRANSMITTER_BUBBLE', 'TT-NEW')}
                  className="w-full text-left px-2 py-1 rounded text-gray-300 hover:bg-gray-800 flex items-center gap-2"
                >
                  <span className="w-2.5 h-2.5 rounded-full border border-cyan-400 inline-block"></span>
                  <span>Transmitter Bubble</span>
                </button>
                <button
                  onClick={() => handleQuickAddSymbol('CONTROL_VALVE', 'CV-NEW')}
                  className="w-full text-left px-2 py-1 rounded text-gray-300 hover:bg-gray-800 flex items-center gap-2"
                >
                  <span className="text-amber-400 font-bold">⧓</span>
                  <span>Control Valve</span>
                </button>
                <button
                  onClick={() => handleQuickAddSymbol('MANUAL_VALVE', 'HV-NEW')}
                  className="w-full text-left px-2 py-1 rounded text-gray-300 hover:bg-gray-800 flex items-center gap-2"
                >
                  <span className="text-gray-400 font-bold">⋈</span>
                  <span>Manual Valve</span>
                </button>
                <button
                  onClick={() => handleQuickAddSymbol('PUMP', '3G-NEW')}
                  className="w-full text-left px-2 py-1 rounded text-gray-300 hover:bg-gray-800 flex items-center gap-2"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                  <span>Pump (Motor)</span>
                </button>
                <button
                  onClick={() => handleQuickAddSymbol('KETTLE_EXCHANGER', '4E-12')}
                  className="w-full text-left px-2 py-1 rounded text-gray-300 hover:bg-gray-800 flex items-center gap-2"
                >
                  <span className="text-lime-400 font-bold">⊏</span>
                  <span>Kettle Reboiler / Chiller</span>
                </button>
                <button
                  onClick={() => handleQuickAddSymbol('SHELL_TUBE_EXCHANGER', '3E-14')}
                  className="w-full text-left px-2 py-1 rounded text-gray-300 hover:bg-gray-800 flex items-center gap-2"
                >
                  <span className="text-emerald-400 font-bold">⊞</span>
                  <span>Shell & Tube Exchanger</span>
                </button>
                <button
                  onClick={() => handleQuickAddSymbol('AIR_COOLER', '4E-40')}
                  className="w-full text-left px-2 py-1 rounded text-gray-300 hover:bg-gray-800 flex items-center gap-2"
                >
                  <span className="text-cyan-400 font-bold">≡</span>
                  <span>Fin-Fan Air Cooler</span>
                </button>
                <button
                  onClick={() => handleQuickAddSymbol('HEAT_EXCHANGER', '3E-NEW')}
                  className="w-full text-left px-2 py-1 rounded text-gray-300 hover:bg-gray-800 flex items-center gap-2"
                >
                  <span className="text-purple-400 font-bold">⊚</span>
                  <span>Generic Exchanger</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Snap Grid Toggle (0, 5, 10, 20px) */}
        <div className="flex items-center gap-1 px-2 border-l border-[#1e2d40]">
          <Magnet size={13} className="text-amber-400" />
          {[0, 5, 10, 20].map((snap) => (
            <button
              key={snap}
              onClick={() => setGridSnap(snap)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                gridSnap === snap
                  ? 'bg-amber-500 text-black'
                  : 'bg-transparent text-gray-400 hover:text-white'
              }`}
            >
              {snap === 0 ? 'OFF' : `${snap}px`}
            </button>
          ))}
        </div>

        {/* Background Grid Toggle */}
        <button
          onClick={toggleGrid}
          className={`p-1 rounded ${showGrid ? 'text-cyan-400' : 'text-gray-600'} hover:text-white`}
          title="Toggle Grid Lines"
        >
          <Grid size={14} />
        </button>

        {/* Inspector Panel Toggle */}
        <button
          onClick={() => setShowInspector(!showInspector)}
          className={`p-1 rounded ${showInspector ? 'text-cyan-400 bg-cyan-950/50' : 'text-gray-400'} hover:text-white`}
          title="Toggle Inspector Sidebar"
        >
          <Sliders size={14} />
        </button>

        {/* Reset to Kiln Baseline */}
        <button
          onClick={() => {
            if (confirm(`Reset all custom elements & lines on ${screenId} to real plant baseline?`)) {
              resetScreenLayout(screenId);
              resetLinesToBaseline(screenId);
              resetSymbolsToBaseline(screenId);
              handleSave();
            }
          }}
          className="p-1 rounded text-gray-400 hover:text-amber-400"
          title="Reset screen layout & lines to baseline"
        >
          <RotateCcw size={14} />
        </button>

        {/* Import / Export JSON */}
        <div className="flex items-center gap-1 px-2 border-l border-[#1e2d40]">
          <button
            onClick={handleExport}
            className="p-1 text-gray-400 hover:text-cyan-300"
            title="Export layout JSON file"
          >
            <FileDown size={14} />
          </button>
          <button
            onClick={handleImport}
            className="p-1 text-gray-400 hover:text-cyan-300"
            title="Import layout JSON file"
          >
            <FileUp size={14} />
          </button>
        </div>

        {/* Done / Exit Edit Mode */}
        <button
          onClick={() => {
            setEditMode(false);
            setActiveTool('SELECT');
          }}
          className="ml-2 flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-full font-bold text-xs shadow-md transition-colors"
        >
          <Check size={13} />
          <span>DONE</span>
        </button>
      </div>

      {/* Floating Save Toast */}
      {saveToast && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-emerald-700 text-white px-4 py-1.5 rounded-full text-xs font-mono font-bold shadow-2xl z-50 flex items-center gap-2 animate-bounce">
          <Check size={14} />
          <span>Plant Layout & Piping Changes Saved!</span>
        </div>
      )}

      {/* Floating Inspector Modal */}
      {showInspector && <TagInspectorModal screenId={screenId} onClose={() => setShowInspector(false)} />}
    </>
  );
};
