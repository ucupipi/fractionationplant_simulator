import React, { useState, useRef, useEffect } from 'react';
import {
  ScreenId,
  useLayoutStore,
  LineType,
  InstrumentSymbolType
} from '../../../stores/useLayoutStore';
import { TAG_METADATA_REGISTRY } from '../../../data/tags';
import {
  X,
  Eye,
  EyeOff,
  RotateCcw,
  Palette,
  Move,
  Plus,
  Trash2,
  Workflow,
  Radio,
  HelpCircle,
  Settings,
  Copy,
  FileDown,
  FileUp,
  Sliders,
  RotateCw,
  GripHorizontal,
  Minimize2,
  Maximize2
} from 'lucide-react';

interface TagInspectorModalProps {
  screenId: ScreenId;
  onClose?: () => void;
}

export const TagInspectorModal: React.FC<TagInspectorModalProps> = ({ screenId, onClose }) => {
  const {
    selectedElementId,
    setSelectedElementId,
    selectedLineId,
    setSelectedLineId,
    layouts,
    lines,
    symbols,
    annotations,
    updateElementPosition,
    updateElementProps,
    toggleElementVisibility,
    resetElementPosition,
    resetScreenLayout,
    addLine,
    updateLine,
    deleteLine,
    resetLinesToBaseline,
    addInstrumentSymbol,
    updateInstrumentSymbol,
    deleteInstrumentSymbol,
    resetSymbolsToBaseline,
    addAnnotation,
    deleteAnnotation,
    exportLayoutJSON,
    importLayoutJSON
  } = useLayoutStore();

  const [activeTab, setActiveTab] = useState<'TAGS' | 'LINES' | 'SYMBOLS' | 'ANNOTATIONS' | 'SETTINGS'>('TAGS');
  const [isMinimized, setIsMinimized] = useState(false);

  // Dragging State for Modal Window
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({
    startX: 0,
    startY: 0,
    posX: 0,
    posY: 0
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input') || (e.target as HTMLElement).closest('select') || (e.target as HTMLElement).closest('textarea')) {
      return;
    }
    setIsDragging(true);
    const modalEl = e.currentTarget.closest('.draggable-inspector-modal') as HTMLElement | null;
    const rect = modalEl?.getBoundingClientRect();
    const currentX = position ? position.x : (rect ? rect.left : window.innerWidth - 410);
    const currentY = position ? position.y : (rect ? rect.top : 64);

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: currentX,
      posY: currentY
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      const newX = Math.max(10, Math.min(window.innerWidth - 300, dragRef.current.posX + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - 80, dragRef.current.posY + dy));
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Annotation Form State
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<'QUESTION' | 'CHECKPOINT' | 'NOTE' | 'FAULT'>('QUESTION');

  // Tag & Line selections
  const screenLayout = layouts[screenId] || {};
  const currentItem = selectedElementId ? screenLayout[selectedElementId] : null;
  const tagMeta = selectedElementId ? TAG_METADATA_REGISTRY[selectedElementId] : null;

  const currentLines = lines.filter((l) => l.screenId === screenId);
  const currentLine = selectedLineId ? lines.find((l) => l.id === selectedLineId) : currentLines[0];

  const currentSymbols = symbols.filter((s) => s.screenId === screenId);
  const currentSymbol = selectedElementId ? symbols.find((s) => s.id === selectedElementId) : currentSymbols[0];

  const currentAnnotations = annotations.filter((a) => a.screenId === screenId);

  const availableTags = Object.keys(TAG_METADATA_REGISTRY);

  const handleAddAnnotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addAnnotation({
      screenId,
      x: 350,
      y: 120,
      type: newType,
      title: newTitle.trim(),
      content: newContent.trim() || 'No description provided.',
      resolved: false
    });
    setNewTitle('');
    setNewContent('');
  };

  const handleAddDefaultLine = (type: LineType) => {
    const isSignal = type === 'SIGNAL';
    const color = isSignal ? '#00d2ff' : type === 'STEAM' ? '#ef4444' : type === 'REFRIGERANT' ? '#d946ef' : '#ffffff';
    addLine({
      screenId,
      type,
      points: [
        { x: 200, y: 150 },
        { x: 300, y: 150 }
      ],
      color,
      strokeWidth: isSignal ? 0.9 : 1.5,
      dashed: isSignal ? '2.4 2.4' : 'none',
      label: 'NEW LINE'
    });
  };

  const handleAddSymbol = (symType: InstrumentSymbolType) => {
    addInstrumentSymbol({
      screenId,
      symbolType: symType,
      x: 350,
      y: 180,
      rotation: 0,
      label: symType === 'TRANSMITTER_BUBBLE' ? 'TI-NEW' : symType === 'CONTROL_VALVE' ? 'CV-NEW' : 'SYM-NEW',
      color: '#38bdf8'
    });
  };

  return (
    <div
      style={
        position
          ? { left: `${position.x}px`, top: `${position.y}px`, right: 'auto', bottom: 'auto' }
          : undefined
      }
      className={`draggable-inspector-modal fixed ${
        position ? '' : 'top-16 right-4'
      } w-96 ${
        isMinimized ? 'max-h-12' : 'max-h-[85vh]'
      } bg-[#090f17]/95 border border-[#1e2d40] rounded-xl shadow-2xl backdrop-blur-md p-3 text-xs font-mono text-gray-200 z-50 animate-fadeIn select-none flex flex-col justify-between overflow-hidden transition-[max-height] duration-200`}
    >
      {/* Draggable Header */}
      <div
        onMouseDown={handleMouseDown}
        className="flex items-center justify-between border-b border-[#1e2d40] pb-2 mb-2 cursor-grab active:cursor-grabbing hover:bg-white/5 rounded px-1 -mx-1 transition-colors"
        title="Klik & drag untuk memindahkan jendela inspector"
      >
        <div className="flex items-center gap-2">
          <GripHorizontal size={14} className="text-cyan-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></div>
          <span className="font-bold text-white tracking-wider text-[11px]">PROCESS & P&ID INSPECTOR</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 text-gray-400 hover:text-cyan-300 rounded hover:bg-gray-800"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
          </button>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-red-300 rounded hover:bg-gray-800" title="Close Inspector">
            <X size={14} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* 5-Tab Navigation Bar */}
          <div className="flex gap-1 border-b border-[#1e2d40] pb-2 mb-3 overflow-x-auto text-[10px]">
            {[
              { id: 'TAGS', label: 'Tags', icon: Move },
              { id: 'LINES', label: 'Pipes & Signals', icon: Workflow },
              { id: 'SYMBOLS', label: 'Instruments', icon: Radio },
              { id: 'ANNOTATIONS', label: 'Interview Q&A', icon: HelpCircle },
              { id: 'SETTINGS', label: 'JSON & Reset', icon: Settings }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-1 px-1.5 rounded flex items-center justify-center gap-1 font-bold whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-cyan-500 text-black shadow-sm'
                      : 'bg-[#0f172a] text-gray-400 hover:text-white hover:bg-[#1e293b]'
                  }`}
                >
                  <Icon size={11} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>


      {/* Tab 1: TAGS INSPECTOR */}
      {activeTab === 'TAGS' && (
        <div className="space-y-3 overflow-y-auto max-h-[55vh] pr-1">
          {selectedElementId && currentItem ? (
            <div className="space-y-3">
              <div className="bg-[#0b1320] p-2.5 rounded border border-cyan-500/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-300">{selectedElementId}</span>
                  <span className="text-[10px] text-gray-400">{tagMeta?.engineeringUnit || ''}</span>
                </div>
                <div className="text-[10px] text-gray-400 truncate">{tagMeta?.name || 'Process Instrument'}</div>
              </div>

              {/* Coordinates X, Y */}
              <div className="grid grid-cols-2 gap-2 bg-[#0b1320] p-2.5 rounded border border-[#1e2d40]">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">X Position</label>
                  <input
                    type="number"
                    value={currentItem.x}
                    onChange={(e) => updateElementPosition(screenId, selectedElementId, parseInt(e.target.value) || 0, currentItem.y)}
                    className="w-full bg-[#05080e] border border-gray-700 text-white px-2 py-1 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Y Position</label>
                  <input
                    type="number"
                    value={currentItem.y}
                    onChange={(e) => updateElementPosition(screenId, selectedElementId, currentItem.x, parseInt(e.target.value) || 0)}
                    className="w-full bg-[#05080e] border border-gray-700 text-white px-2 py-1 rounded text-xs"
                  />
                </div>
              </div>

              {/* Custom Label & Color */}
              <div className="space-y-2 bg-[#0b1320] p-2.5 rounded border border-[#1e2d40]">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Custom Label (Optional)</label>
                  <input
                    type="text"
                    placeholder={selectedElementId}
                    value={currentItem.customLabel || ''}
                    onChange={(e) => updateElementProps(screenId, selectedElementId, { customLabel: e.target.value })}
                    className="w-full bg-[#05080e] border border-gray-700 text-white px-2 py-1 rounded text-xs"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Accent Color</label>
                  <div className="flex gap-1.5">
                    {['#00e5ff', '#38bdf8', '#22c55e', '#facc15', '#ef4444', '#a855f7', '#ffffff'].map((c) => (
                      <button
                        key={c}
                        onClick={() => updateElementProps(screenId, selectedElementId, { color: c })}
                        className={`w-5 h-5 rounded-full border ${
                          currentItem.color === c ? 'border-white ring-2 ring-cyan-400' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => toggleElementVisibility(screenId, selectedElementId)}
                  className={`flex-1 py-1.5 px-3 rounded flex items-center justify-center gap-1.5 font-bold border ${
                    currentItem.visible === false
                      ? 'bg-gray-800 border-gray-700 text-gray-400'
                      : 'bg-cyan-950 border-cyan-700 text-cyan-300'
                  }`}
                >
                  {currentItem.visible === false ? <EyeOff size={12} /> : <Eye size={12} />}
                  <span>{currentItem.visible === false ? 'HIDDEN' : 'VISIBLE'}</span>
                </button>

                <button
                  onClick={() => resetElementPosition(screenId, selectedElementId)}
                  className="py-1.5 px-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded font-bold flex items-center gap-1 border border-gray-700"
                  title="Reset to default coordinates"
                >
                  <RotateCcw size={12} />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 space-y-2">
              <Move className="w-8 h-8 mx-auto text-gray-600" />
              <p>Click any tag or instrument on the graphic to customize its coordinates, labels, or colors.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: PIPES & SIGNALS */}
      {activeTab === 'LINES' && (
        <div className="space-y-3 overflow-y-auto max-h-[55vh] pr-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-400 font-bold">PIPES ON THIS SCREEN ({currentLines.length})</span>
            <div className="flex gap-1">
              <button
                onClick={() => handleAddDefaultLine('PROCESS')}
                className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold"
              >
                + Pipe
              </button>
              <button
                onClick={() => handleAddDefaultLine('SIGNAL')}
                className="px-2 py-0.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[10px] font-bold"
              >
                + Signal
              </button>
            </div>
          </div>

          {currentLine ? (
            <div className="bg-[#0b1320] p-3 rounded border border-emerald-500/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400">{currentLine.label || currentLine.id}</span>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-1.5 py-0.5 rounded">
                  {currentLine.type} ({currentLine.points.length} waypoints)
                </span>
              </div>

              {/* Line Type Selector */}
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Piping / Signal Classification</label>
                <select
                  value={currentLine.type}
                  onChange={(e) => updateLine(currentLine.id, { type: e.target.value as LineType })}
                  className="w-full bg-[#05080e] border border-gray-700 text-white px-2 py-1 rounded text-xs"
                >
                  <option value="PROCESS">PROCESS PIPING (Solid)</option>
                  <option value="SIGNAL">DCS SIGNAL (Dotted Blue)</option>
                  <option value="STEAM">STEAM HEADER (Red)</option>
                  <option value="REFRIGERANT">PROPANE REFRIGERANT (Purple)</option>
                  <option value="PNEUMATIC">PNEUMATIC INSTRUMENT AIR</option>
                  <option value="CUSTOM">CUSTOM COLOR / DASH</option>
                </select>
              </div>

              {/* Line Label */}
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Line Label (e.g. NG FEED, STEAM, REFLUX)</label>
                <input
                  type="text"
                  value={currentLine.label || ''}
                  onChange={(e) => updateLine(currentLine.id, { label: e.target.value })}
                  placeholder="e.g. 40.0 BAR FEED"
                  className="w-full bg-[#05080e] border border-gray-700 text-white px-2 py-1 rounded text-xs"
                />
              </div>

              {/* Color & Stroke Width */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Color Palette</label>
                  <div className="flex gap-1 flex-wrap">
                    {['#ffffff', '#00d2ff', '#38bdf8', '#22c55e', '#ef4444', '#d946ef', '#eab308'].map((c) => (
                      <button
                        key={c}
                        onClick={() => updateLine(currentLine.id, { color: c })}
                        className={`w-4 h-4 rounded-full border ${
                          currentLine.color === c ? 'border-white ring-2 ring-emerald-400' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Stroke Width ({currentLine.strokeWidth}px)</label>
                  <input
                    type="range"
                    min="0.6"
                    max="4.0"
                    step="0.2"
                    value={currentLine.strokeWidth}
                    onChange={(e) => updateLine(currentLine.id, { strokeWidth: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-400"
                  />
                </div>
              </div>

              {/* Delete Line */}
              <button
                onClick={() => deleteLine(currentLine.id)}
                className="w-full py-1.5 bg-red-950/60 hover:bg-red-900 border border-red-700 text-red-300 rounded font-bold flex items-center justify-center gap-1.5 text-xs"
              >
                <Trash2 size={12} />
                <span>Delete Line</span>
              </button>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Click any line or add a new pipe above.</p>
          )}

          {/* Quick list of lines */}
          <div className="space-y-1">
            <span className="text-[10px] text-gray-500 font-bold block">ALL PIPING / SIGNALS:</span>
            {currentLines.map((l) => (
              <div
                key={l.id}
                onClick={() => setSelectedLineId(l.id)}
                className={`p-1.5 rounded cursor-pointer flex items-center justify-between text-[10px] ${
                  selectedLineId === l.id ? 'bg-emerald-950 border border-emerald-500 text-white' : 'bg-[#0b1320] text-gray-300 hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-0.5 rounded" style={{ backgroundColor: l.color }}></span>
                  <span className="font-bold">{l.label || l.id}</span>
                </div>
                <span className="text-gray-500">[{l.type}]</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: INSTRUMENTS & VALVES */}
      {activeTab === 'SYMBOLS' && (
        <div className="space-y-3 overflow-y-auto max-h-[55vh] pr-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-400 font-bold">INSTRUMENTS ({currentSymbols.length})</span>
            <button
              onClick={() => handleAddSymbol('TRANSMITTER_BUBBLE')}
              className="px-2 py-0.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[10px] font-bold"
            >
              + Symbol
            </button>
          </div>

          {currentSymbol ? (
            <div className="bg-[#0b1320] p-3 rounded border border-cyan-500/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-300">{currentSymbol.label}</span>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-700 px-1.5 py-0.5 rounded">
                  {currentSymbol.symbolType}
                </span>
              </div>

              {/* Symbol Type */}
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Symbol Type</label>
                <select
                  value={currentSymbol.symbolType}
                  onChange={(e) => updateInstrumentSymbol(currentSymbol.id, { symbolType: e.target.value as InstrumentSymbolType })}
                  className="w-full bg-[#05080e] border border-gray-700 text-white px-2 py-1 rounded text-xs"
                >
                  <option value="TRANSMITTER_BUBBLE">TRANSMITTER BUBBLE (FT/PT/TT/LT)</option>
                  <option value="CONTROL_VALVE">CONTROL VALVE (Diaphragm)</option>
                  <option value="MANUAL_VALVE">MANUAL BLOCK VALVE (HV)</option>
                  <option value="CHECK_VALVE">CHECK VALVE (NRV)</option>
                  <option value="PUMP">CENTRIFUGAL PUMP (Motor)</option>
                  <option value="KETTLE_EXCHANGER">KETTLE REBOILER / CHILLER (4E-12, 4E-14, 4E-40, 3E-1)</option>
                  <option value="SHELL_TUBE_EXCHANGER">SHELL & TUBE EXCHANGER (3E-14, 3E-18)</option>
                  <option value="AIR_COOLER">FIN-FAN AIR COOLER</option>
                  <option value="HEAT_EXCHANGER">GENERIC HEAT EXCHANGER</option>
                  <option value="VESSEL_NOZZLE">VESSEL NOZZLE</option>
                  <option value="TEXT_LABEL">TEXT LABEL (Editable Free Text)</option>
                </select>
              </div>

              {/* Tag Binding */}
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Bind Simulation Tag (Realtime Live Data)</label>
                <select
                  value={currentSymbol.tagId || ''}
                  onChange={(e) => updateInstrumentSymbol(currentSymbol.id, { tagId: e.target.value || undefined })}
                  className="w-full bg-[#05080e] border border-gray-700 text-white px-2 py-1 rounded text-xs"
                >
                  <option value="">-- No Tag Binding (Static) --</option>
                  {availableTags.map((t) => (
                    <option key={t} value={t}>
                      {t} - {TAG_METADATA_REGISTRY[t]?.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Text / Label Setting */}
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Symbol Text / Label</label>
                <input
                  type="text"
                  value={currentSymbol.label || ''}
                  onChange={(e) => updateInstrumentSymbol(currentSymbol.id, { label: e.target.value })}
                  className="w-full bg-[#05080e] border border-gray-700 text-white px-2 py-1 rounded text-xs"
                />
              </div>

              {/* Scale */}
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Scale / Text Size ({currentSymbol.scale || 1}x)</label>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  value={currentSymbol.scale || 1}
                  onChange={(e) => updateInstrumentSymbol(currentSymbol.id, { scale: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400"
                />
              </div>

              {/* Color */}
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Color Palette</label>
                <div className="flex gap-1 flex-wrap">
                  {['#ffffff', '#00d2ff', '#38bdf8', '#22c55e', '#ef4444', '#d946ef', '#eab308', '#ff3333', '#f8fafc'].map((c) => (
                    <button
                      key={c}
                      onClick={() => updateInstrumentSymbol(currentSymbol.id, { color: c })}
                      className={`w-4 h-4 rounded-full border ${
                        currentSymbol.color === c ? 'border-white ring-2 ring-cyan-400' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Rotation */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400">Orientation</span>
                <div className="flex gap-1">
                  {[0, 90, 180, 270].map((deg) => (
                    <button
                      key={deg}
                      onClick={() => updateInstrumentSymbol(currentSymbol.id, { rotation: deg })}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        (currentSymbol.rotation || 0) === deg ? 'bg-cyan-500 text-black' : 'bg-gray-800 text-gray-300'
                      }`}
                    >
                      {deg}°
                    </button>
                  ))}
                </div>
              </div>

              {/* Delete Symbol */}
              <button
                onClick={() => deleteInstrumentSymbol(currentSymbol.id)}
                className="w-full py-1.5 bg-red-950/60 hover:bg-red-900 border border-red-700 text-red-300 rounded font-bold flex items-center justify-center gap-1.5 text-xs"
              >
                <Trash2 size={12} />
                <span>Delete Instrument</span>
              </button>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Select an instrument symbol above to configure.</p>
          )}

          {/* Quick list of symbols */}
          <div className="space-y-1">
            <span className="text-[10px] text-gray-500 font-bold block">ALL INSTRUMENTS ON SCREEN:</span>
            {currentSymbols.map((s) => (
              <div
                key={s.id}
                onClick={() => setSelectedElementId(s.id)}
                className={`p-1.5 rounded cursor-pointer flex items-center justify-between text-[10px] ${
                  selectedElementId === s.id ? 'bg-cyan-950 border border-cyan-500 text-white' : 'bg-[#0b1320] text-gray-300 hover:bg-gray-800'
                }`}
              >
                <span className="font-bold">{s.label}</span>
                <span className="text-cyan-400">[{s.tagId || s.symbolType}]</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: INTERVIEW CARDS */}
      {activeTab === 'ANNOTATIONS' && (
        <div className="space-y-3 overflow-y-auto max-h-[55vh] pr-1">
          {/* Add Annotation Form */}
          <form onSubmit={handleAddAnnotation} className="bg-[#0b1320] p-2.5 rounded border border-purple-500/40 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-purple-300 text-[10.5px]">Add Interview Card</span>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="bg-[#05080e] border border-gray-700 text-white px-1.5 py-0.5 rounded text-[10px]"
              >
                <option value="QUESTION">Question</option>
                <option value="CHECKPOINT">Checkpoint</option>
                <option value="NOTE">Note</option>
                <option value="FAULT">Fault Hint</option>
              </select>
            </div>
            <input
              type="text"
              placeholder="Question Title (e.g. Q1: Sump Level Control)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full bg-[#05080e] border border-gray-700 text-white px-2 py-1 rounded text-xs"
            />
            <textarea
              placeholder="Question or instruction text..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={2}
              className="w-full bg-[#05080e] border border-gray-700 text-white px-2 py-1 rounded text-xs resize-none"
            />
            <button
              type="submit"
              className="w-full py-1 bg-purple-700 hover:bg-purple-600 text-white rounded font-bold text-xs flex items-center justify-center gap-1"
            >
              <Plus size={12} />
              <span>Place Card on Graphic</span>
            </button>
          </form>

          {/* List existing cards */}
          <div className="space-y-1.5">
            {currentAnnotations.map((ann) => (
              <div key={ann.id} className="bg-[#0b1320] p-2 rounded border border-gray-800 flex justify-between items-start gap-2">
                <div>
                  <div className="font-bold text-white text-[11px]">{ann.title}</div>
                  <div className="text-[10px] text-gray-400 line-clamp-2">{ann.content}</div>
                </div>
                <button onClick={() => deleteAnnotation(ann.id)} className="text-gray-500 hover:text-red-400 p-1">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: SETTINGS & EXPORT */}
      {activeTab === 'SETTINGS' && (
        <div className="space-y-3 overflow-y-auto max-h-[55vh] pr-1">
          <div className="bg-[#0b1320] p-3 rounded border border-gray-800 space-y-2">
            <span className="font-bold text-white block">JSON Preset Management</span>
            <p className="text-[10px] text-gray-400">
              Export and import your custom piping, instrument layouts, and training annotations as JSON.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(exportLayoutJSON());
                  alert('Layout JSON copied to clipboard!');
                }}
                className="flex-1 py-1.5 bg-cyan-900/60 hover:bg-cyan-800 text-cyan-300 rounded font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Copy size={12} />
                <span>Copy JSON</span>
              </button>
            </div>
          </div>

          <div className="bg-red-950/30 p-3 rounded border border-red-800/60 space-y-2">
            <span className="font-bold text-red-300 block">Reset Controls</span>
            <button
              onClick={() => {
                if (confirm(`Reset screen ${screenId} to default plant layout?`)) {
                  resetScreenLayout(screenId);
                  resetLinesToBaseline(screenId);
                  resetSymbolsToBaseline(screenId);
                }
              }}
              className="w-full py-1.5 bg-red-800/80 hover:bg-red-700 text-white rounded font-bold text-xs"
            >
              Reset {screenId} to Baseline
            </button>
          </div>
        </div>
      )}
    </>
  )}
</div>
);
};


