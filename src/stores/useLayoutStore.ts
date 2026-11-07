import { create } from 'zustand';

export type ScreenId = 'SCRUB' | 'DE_ETHANIZER' | 'DE_PROPANIZER' | 'DE_BUTANIZER' | 'REFRIGERATION' | 'OVERVIEW';

export type LineType = 'PROCESS' | 'SIGNAL' | 'PNEUMATIC' | 'STEAM' | 'REFRIGERANT' | 'CUSTOM';

export interface LinePoint {
  x: number;
  y: number;
}

export interface CustomProcessLine {
  id: string;
  screenId: ScreenId;
  type: LineType;
  points: LinePoint[];
  color: string;
  strokeWidth: number;
  dashed?: boolean | string;
  label?: string;
  arrowHead?: boolean;
  animated?: boolean;
}

export type InstrumentSymbolType =
  | 'TRANSMITTER_BUBBLE'
  | 'CONTROL_VALVE'
  | 'MANUAL_VALVE'
  | 'CHECK_VALVE'
  | 'PUMP'
  | 'HEAT_EXCHANGER'
  | 'KETTLE_EXCHANGER'
  | 'SHELL_TUBE_EXCHANGER'
  | 'AIR_COOLER'
  | 'VESSEL_NOZZLE'
  | 'TEXT_LABEL';

export interface CustomInstrumentSymbol {
  id: string;
  screenId: ScreenId;
  symbolType: InstrumentSymbolType;
  x: number;
  y: number;
  rotation?: number; // 0, 90, 180, 270
  tagId?: string; // e.g. "LIC2", "TIC1", "3G-1A"
  label: string;
  subLabel?: string;
  color?: string;
  scale?: number;
}

export interface ElementLayout {
  x: number;
  y: number;
  visible?: boolean;
  customLabel?: string;
  color?: string;
  style?: 'badge' | 'box' | 'minimal';
  scale?: number;
}

export interface InterviewAnnotation {
  id: string;
  screenId: ScreenId;
  x: number;
  y: number;
  type: 'QUESTION' | 'CHECKPOINT' | 'NOTE' | 'FAULT';
  title: string;
  content: string;
  author?: string;
  resolved?: boolean;
  color?: string;
}

export type EditorTool = 'SELECT' | 'DRAW_LINE' | 'ADD_SYMBOL' | 'ADD_ANNOTATION';

export interface LayoutStoreState {
  isEditMode: boolean;
  activeTool: EditorTool;
  drawingLineType: LineType;
  gridSnap: number; // 0, 5, 10, 20
  showGrid: boolean;
  selectedElementId: string | null;
  selectedLineId: string | null;
  selectedPointIndex: number | null;
  layouts: Record<ScreenId, Record<string, ElementLayout>>;
  annotations: InterviewAnnotation[];
  lines: CustomProcessLine[];
  symbols: CustomInstrumentSymbol[];

  // General Actions
  setEditMode: (enabled: boolean) => void;
  toggleEditMode: () => void;
  setActiveTool: (tool: EditorTool) => void;
  setDrawingLineType: (type: LineType) => void;
  setGridSnap: (snap: number) => void;
  toggleGrid: () => void;
  setSelectedElementId: (id: string | null) => void;
  setSelectedLineId: (id: string | null, pointIndex?: number | null) => void;

  // Position & Layout manipulation for Tags
  getElementPosition: (
    screenId: ScreenId,
    elementId: string,
    defaultX: number,
    defaultY: number
  ) => { x: number; y: number; visible: boolean; customLabel?: string; color?: string; style?: 'badge' | 'box' | 'minimal'; scale?: number };
  updateElementPosition: (screenId: ScreenId, elementId: string, x: number, y: number) => void;
  updateElementProps: (screenId: ScreenId, elementId: string, props: Partial<ElementLayout>) => void;
  toggleElementVisibility: (screenId: ScreenId, elementId: string) => void;
  resetElementPosition: (screenId: ScreenId, elementId: string) => void;
  resetScreenLayout: (screenId: ScreenId) => void;
  resetAllLayouts: () => void;

  // Process & Signal Lines manipulation
  addLine: (line: Omit<CustomProcessLine, 'id'>) => string;
  updateLine: (id: string, updates: Partial<CustomProcessLine>) => void;
  updateLinePoint: (id: string, pointIndex: number, x: number, y: number) => void;
  addLinePoint: (id: string, segmentIndex: number, x: number, y: number) => void;
  removeLinePoint: (id: string, pointIndex: number) => void;
  deleteLine: (id: string) => void;
  resetLinesToBaseline: (screenId: ScreenId) => void;

  // Custom Instrument & Equipment Symbols
  addInstrumentSymbol: (symbol: Omit<CustomInstrumentSymbol, 'id'>) => string;
  updateInstrumentSymbol: (id: string, updates: Partial<CustomInstrumentSymbol>) => void;
  deleteInstrumentSymbol: (id: string) => void;
  resetSymbolsToBaseline: (screenId: ScreenId) => void;

  // Interview Annotations
  addAnnotation: (annotation: Omit<InterviewAnnotation, 'id'>) => string;
  updateAnnotation: (id: string, updates: Partial<InterviewAnnotation>) => void;
  deleteAnnotation: (id: string) => void;
  toggleAnnotationResolved: (id: string) => void;

  // Import / Export
  exportLayoutJSON: () => string;
  importLayoutJSON: (jsonStr: string) => boolean;
}

const STORAGE_KEY_LAYOUTS = 'BADAK_LNG_OTS_CUSTOM_LAYOUTS_V3';
const STORAGE_KEY_ANNOTATIONS = 'BADAK_LNG_OTS_INTERVIEW_ANNOTATIONS_V3';
const STORAGE_KEY_LINES = 'BADAK_LNG_OTS_PROCESS_LINES_V4';
const STORAGE_KEY_SYMBOLS = 'BADAK_LNG_OTS_INSTRUMENT_SYMBOLS_V6';


const safeGetItem = (key: string): string | null => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch (e) {}
  return null;
};

const safeSetItem = (key: string, val: string): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, val);
    }
  } catch (e) {}
};

const safeRemoveItem = (key: string): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch (e) {}
};

const loadSavedLayouts = (): Record<ScreenId, Record<string, ElementLayout>> => {
  try {
    const saved = safeGetItem(STORAGE_KEY_LAYOUTS);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {}
  return {
    SCRUB: {},
    DE_ETHANIZER: {},
    DE_PROPANIZER: {},
    DE_BUTANIZER: {},
    REFRIGERATION: {},
    OVERVIEW: {}
  };
};

const getDefaultLines = (screenId?: ScreenId): CustomProcessLine[] => {
  const allLines: CustomProcessLine[] = [
    // ==================== SCRUB COLUMN (GRH0033) PROCESS PIPING ====================
    // 1. NG Feed to 4E-12 Chiller
    {
      id: 'scrub_feed_1',
      screenId: 'SCRUB',
      type: 'PROCESS',
      points: [{ x: 49, y: 155 }, { x: 100, y: 155 }, { x: 100, y: 108 }, { x: 112, y: 108 }],
      color: '#ff1e1e',
      strokeWidth: 1.5,
      label: 'NG FEED'
    },
    // 2. 4E-12 Chiller Outlet to 3C-1 Feed Nozzle
    {
      id: 'scrub_feed_2',
      screenId: 'SCRUB',
      type: 'PROCESS',
      points: [{ x: 165, y: 88 }, { x: 177, y: 88 }, { x: 177, y: 184 }, { x: 211, y: 184 }],
      color: '#ff1e1e',
      strokeWidth: 1.5,
      label: '4E-12 TO 3C-1'
    },
    // 3. 3C-1 Column Overhead to 4E-14 Chiller
    {
      id: 'scrub_oh_1',
      screenId: 'SCRUB',
      type: 'PROCESS',
      points: [{ x: 228, y: 88 }, { x: 228, y: 74 }, { x: 326, y: 74 }],
      color: '#ff1e1e',
      strokeWidth: 1.5,
      label: '3C-1 OVERHEAD'
    },
    {
      id: 'scrub_oh_2',
      screenId: 'SCRUB',
      type: 'PROCESS',
      points: [{ x: 346, y: 74 }, { x: 346, y: 61 }, { x: 350, y: 61 }],
      color: '#ff1e1e',
      strokeWidth: 1.5
    },
    // 4. 4E-14 to 4E-40 Condenser Chiller
    {
      id: 'scrub_oh_3',
      screenId: 'SCRUB',
      type: 'PROCESS',
      points: [{ x: 431, y: 61 }, { x: 445, y: 61 }, { x: 445, y: 48 }, { x: 480, y: 48 }],
      color: '#ff1e1e',
      strokeWidth: 1.5,
      label: '4E-14 TO 4E-40'
    },
    // 5. 4E-40 to 3C-2 Reflux Drum
    {
      id: 'scrub_oh_4',
      screenId: 'SCRUB',
      type: 'PROCESS',
      points: [{ x: 531, y: 48 }, { x: 549, y: 48 }, { x: 549, y: 60 }, { x: 507, y: 60 }, { x: 507, y: 118 }, { x: 495, y: 118 }, { x: 495, y: 159 }, { x: 510, y: 159 }],
      color: '#ff1e1e',
      strokeWidth: 1.5,
      label: '4E-40 TO 3C-2'
    },
    // 6. 3C-2 Overhead Gas to 5E-1 / De-Ethanizer
    {
      id: 'scrub_3c2_oh_1',
      screenId: 'SCRUB',
      type: 'PROCESS',
      points: [{ x: 540, y: 142 }, { x: 540, y: 117 }, { x: 631, y: 117 }, { x: 751, y: 117 }],
      color: '#ff1e1e',
      strokeWidth: 1.5,
      label: '3C-2 OH TO 5E-1'
    },
    // 7. 3E-18 Startup Heater Branch
    {
      id: 'scrub_3e18_branch',
      screenId: 'SCRUB',
      type: 'PROCESS',
      points: [{ x: 682, y: 118 }, { x: 682, y: 146 }],
      color: '#ff1e1e',
      strokeWidth: 1.5
    },
    {
      id: 'scrub_3e18_loop',
      screenId: 'SCRUB',
      type: 'PROCESS',
      points: [{ x: 704, y: 145 }, { x: 711, y: 145 }, { x: 711, y: 138 }, { x: 734, y: 138 }, { x: 734, y: 225 }, { x: 704, y: 225 }, { x: 704, y: 197 }],
      color: '#ff1e1e',
      strokeWidth: 1.5
    },
    // 8. 3C-1 Side Draw & Reflux Circuit
    {
      id: 'scrub_reflux_1',
      screenId: 'SCRUB',
      type: 'PROCESS',
      points: [{ x: 254, y: 171 }, { x: 311, y: 171 }, { x: 311, y: 201 }, { x: 330, y: 201 }, { x: 330, y: 267 }, { x: 373, y: 267 }],
      color: '#ff1e1e',
      strokeWidth: 1.5,
      label: '3C-1 SIDE DRAW'
    },
    {
      id: 'scrub_reflux_2',
      screenId: 'SCRUB',
      type: 'PROCESS',
      points: [{ x: 373, y: 267 }, { x: 373, y: 309 }, { x: 428, y: 309 }, { x: 428, y: 236 }, { x: 511, y: 236 }],
      color: '#ff1e1e',
      strokeWidth: 1.5
    },
    {
      id: 'scrub_reflux_3',
      screenId: 'SCRUB',
      type: 'PROCESS',
      points: [{ x: 433, y: 236 }, { x: 433, y: 285 }, { x: 455, y: 285 }, { x: 455, y: 344 }, { x: 550, y: 344 }, { x: 550, y: 264 }, { x: 540, y: 264 }],
      color: '#ff1e1e',
      strokeWidth: 1.5
    },
    // 9. Purple Butane Recycle Line
    {
      id: 'scrub_recycle_c4',
      screenId: 'SCRUB',
      type: 'REFRIGERANT',
      points: [{ x: 450, y: 201 }, { x: 402, y: 201 }, { x: 402, y: 122 }, { x: 340, y: 122 }, { x: 340, y: 75 }],
      color: '#d800d8',
      strokeWidth: 1.4,
      label: 'BUTANE RECYCLE'
    },
    // 10. LP Steam Header & Supply to 3E-1 Reboiler
    {
      id: 'scrub_steam_1',
      screenId: 'SCRUB',
      type: 'STEAM',
      points: [{ x: 50, y: 242 }, { x: 88, y: 242 }, { x: 88, y: 265 }, { x: 109, y: 265 }],
      color: '#dfdf00',
      strokeWidth: 1.4,
      label: 'LP STEAM 3E-1'
    },
    {
      id: 'scrub_steam_2',
      screenId: 'SCRUB',
      type: 'STEAM',
      points: [{ x: 88, y: 266 }, { x: 88, y: 291 }, { x: 100, y: 291 }],
      color: '#dfdf00',
      strokeWidth: 1.4
    },
    {
      id: 'scrub_steam_3',
      screenId: 'SCRUB',
      type: 'STEAM',
      points: [{ x: 109, y: 265 }, { x: 109, y: 293 }, { x: 110, y: 294 }, { x: 110, y: 355 }, { x: 76, y: 355 }],
      color: '#dfdf00',
      strokeWidth: 1.4
    },
    {
      id: 'scrub_steam_right',
      screenId: 'SCRUB',
      type: 'STEAM',
      points: [{ x: 586, y: 142 }, { x: 628, y: 142 }, { x: 628, y: 157 }, { x: 651, y: 157 }, { x: 651, y: 171 }],
      color: '#dfdf00',
      strokeWidth: 1.4,
      label: 'LP STEAM 3E-18'
    },
    // 11. 3E-1 Reboiler Liquid In & Vapor Return
    {
      id: 'scrub_reboiler_in_1',
      screenId: 'SCRUB',
      type: 'PROCESS',
      points: [{ x: 211, y: 252 }, { x: 199, y: 252 }, { x: 199, y: 278 }, { x: 149, y: 278 }, { x: 149, y: 265 }],
      color: '#00b7df',
      strokeWidth: 1.4,
      label: '3E-1 IN'
    },
    {
      id: 'scrub_reboiler_in_2',
      screenId: 'SCRUB',
      type: 'PROCESS',
      points: [{ x: 149, y: 278 }, { x: 149, y: 300 }, { x: 108, y: 300 }, { x: 108, y: 286 }],
      color: '#00b7df',
      strokeWidth: 1.4
    },
    {
      id: 'scrub_reboiler_vap_ret',
      screenId: 'SCRUB',
      type: 'PROCESS',
      points: [{ x: 211, y: 232 }, { x: 174, y: 232 }, { x: 174, y: 252 }, { x: 150, y: 252 }],
      color: '#00b7df',
      strokeWidth: 1.4,
      label: 'VAPOR RETURN'
    },
    // 12. 3C-1 Bottoms Runout to 3E-14 / De-Ethanizer
    {
      id: 'scrub_bottoms_runout_1',
      screenId: 'SCRUB',
      type: 'PROCESS',
      points: [{ x: 228, y: 272 }, { x: 228, y: 361 }, { x: 379, y: 361 }, { x: 379, y: 391 }, { x: 693, y: 391 }],
      color: '#00b7df',
      strokeWidth: 1.5,
      label: '3C-1 BOTTOM RUNOUT'
    },
    {
      id: 'scrub_bottoms_runout_2',
      screenId: 'SCRUB',
      type: 'PROCESS',
      points: [{ x: 228, y: 361 }, { x: 149, y: 361 }, { x: 149, y: 286 }],
      color: '#00b7df',
      strokeWidth: 1.4
    },
    {
      id: 'scrub_bottoms_runout_3',
      screenId: 'SCRUB',
      type: 'PROCESS',
      points: [{ x: 228, y: 361 }, { x: 228, y: 370 }, { x: 349, y: 370 }],
      color: '#00b7df',
      strokeWidth: 1.4
    },
    {
      id: 'scrub_bottoms_cooler_line',
      screenId: 'SCRUB',
      type: 'PROCESS',
      points: [{ x: 455, y: 344 }, { x: 455, y: 361 }, { x: 554, y: 361 }, { x: 554, y: 374 }, { x: 693, y: 374 }],
      color: '#00b7df',
      strokeWidth: 1.4,
      label: 'TO 3E-14/3C-4'
    },
    // 13. Orange Steam Condensate Line
    {
      id: 'scrub_condensate',
      screenId: 'SCRUB',
      type: 'PROCESS',
      points: [{ x: 76, y: 355 }, { x: 76, y: 391 }, { x: 167, y: 391 }],
      color: '#e69138',
      strokeWidth: 1.4,
      label: 'CONDENSATE'
    },
    // 14. White Headers & LTSS Bypasses
    {
      id: 'scrub_bypass_1',
      screenId: 'SCRUB',
      type: 'PROCESS',
      points: [{ x: 428, y: 236 }, { x: 455, y: 236 }, { x: 455, y: 231 }, { x: 484, y: 231 }],
      color: '#bfbfbf',
      strokeWidth: 1.2
    },
    {
      id: 'scrub_bypass_2',
      screenId: 'SCRUB',
      type: 'PROCESS',
      points: [{ x: 703, y: 171 }, { x: 703, y: 340 }, { x: 718, y: 340 }],
      color: '#bfbfbf',
      strokeWidth: 1.2
    },
    {
      id: 'scrub_bypass_3',
      screenId: 'SCRUB',
      type: 'PROCESS',
      points: [{ x: 703, y: 197 }, { x: 703, y: 225 }, { x: 800, y: 225 }],
      color: '#bfbfbf',
      strokeWidth: 1.2,
      label: 'LTSS HDR'
    },
    {
      id: 'scrub_bypass_4',
      screenId: 'SCRUB',
      type: 'PROCESS',
      points: [{ x: 703, y: 340 }, { x: 703, y: 348 }, { x: 806, y: 348 }],
      color: '#bfbfbf',
      strokeWidth: 1.2
    },

    // ==================== SCRUB COLUMN (GRH0033) SIGNAL LINES ====================
    {
      id: 'scrub_sig_1',
      screenId: 'SCRUB',
      type: 'SIGNAL',
      points: [{ x: 188, y: 50 }, { x: 188, y: 112 }, { x: 171, y: 112 }],
      color: '#00d2ff',
      strokeWidth: 0.9,
      dashed: '2.4 2.4',
      label: 'TI159'
    },
    {
      id: 'scrub_sig_2',
      screenId: 'SCRUB',
      type: 'SIGNAL',
      points: [{ x: 160, y: 118 }, { x: 160, y: 241 }, { x: 132, y: 241 }],
      color: '#00d2ff',
      strokeWidth: 0.9,
      dashed: '2.4 2.4',
      label: 'FIC2'
    },
    {
      id: 'scrub_sig_3',
      screenId: 'SCRUB',
      type: 'SIGNAL',
      points: [{ x: 137, y: 243 }, { x: 137, y: 281 }, { x: 252, y: 281 }],
      color: '#00d2ff',
      strokeWidth: 0.9,
      dashed: '2.4 2.4',
      label: 'LIC2'
    },
    {
      id: 'scrub_sig_4',
      screenId: 'SCRUB',
      type: 'SIGNAL',
      points: [{ x: 273, y: 131 }, { x: 273, y: 171 }, { x: 314, y: 171 }, { x: 314, y: 189 }],
      color: '#00d2ff',
      strokeWidth: 0.9,
      dashed: '2.4 2.4',
      label: 'FIC3'
    },
    {
      id: 'scrub_sig_5',
      screenId: 'SCRUB',
      type: 'SIGNAL',
      points: [{ x: 293, y: 194 }, { x: 260, y: 194 }, { x: 260, y: 242 }, { x: 296, y: 242 }],
      color: '#00d2ff',
      strokeWidth: 0.9,
      dashed: '2.4 2.4',
      label: 'FIC1'
    },
    {
      id: 'scrub_sig_6',
      screenId: 'SCRUB',
      type: 'SIGNAL',
      points: [{ x: 372, y: 119 }, { x: 372, y: 92 }, { x: 450, y: 92 }, { x: 450, y: 144 }],
      color: '#00d2ff',
      strokeWidth: 0.9,
      dashed: '2.4 2.4',
      label: '3C2'
    },
    {
      id: 'scrub_sig_7',
      screenId: 'SCRUB',
      type: 'SIGNAL',
      points: [{ x: 397, y: 144 }, { x: 397, y: 126 }, { x: 495, y: 126 }, { x: 495, y: 180 }],
      color: '#00d2ff',
      strokeWidth: 0.9,
      dashed: '2.4 2.4',
      label: 'TIC1'
    },
    {
      id: 'scrub_sig_8',
      screenId: 'SCRUB',
      type: 'SIGNAL',
      points: [{ x: 480, y: 178 }, { x: 480, y: 232 }, { x: 453, y: 232 }],
      color: '#00d2ff',
      strokeWidth: 0.9,
      dashed: '2.4 2.4',
      label: 'TI157'
    },
    {
      id: 'scrub_sig_9',
      screenId: 'SCRUB',
      type: 'SIGNAL',
      points: [{ x: 494, y: 246 }, { x: 494, y: 293 }, { x: 438, y: 293 }],
      color: '#00d2ff',
      strokeWidth: 0.9,
      dashed: '2.4 2.4',
      label: 'TI52'
    },
    {
      id: 'scrub_sig_10',
      screenId: 'SCRUB',
      type: 'SIGNAL',
      points: [{ x: 459, y: 318 }, { x: 459, y: 348 }, { x: 349, y: 348 }],
      color: '#00d2ff',
      strokeWidth: 0.9,
      dashed: '2.4 2.4',
      label: 'TIC193'
    },
    {
      id: 'scrub_sig_11',
      screenId: 'SCRUB',
      type: 'SIGNAL',
      points: [{ x: 273, y: 267 }, { x: 273, y: 355 }, { x: 373, y: 355 }],
      color: '#00d2ff',
      strokeWidth: 0.9,
      dashed: '2.4 2.4',
      label: 'PI12'
    },
    {
      id: 'scrub_sig_12',
      screenId: 'SCRUB',
      type: 'SIGNAL',
      points: [{ x: 179, y: 344 }, { x: 278, y: 344 }, { x: 278, y: 361 }],
      color: '#00d2ff',
      strokeWidth: 0.9,
      dashed: '2.4 2.4',
      label: 'TI161'
    },
    {
      id: 'scrub_sig_13',
      screenId: 'SCRUB',
      type: 'SIGNAL',
      points: [{ x: 639, y: 105 }, { x: 639, y: 181 }, { x: 609, y: 181 }],
      color: '#00d2ff',
      strokeWidth: 0.9,
      dashed: '2.4 2.4'
    },
    {
      id: 'scrub_sig_14',
      screenId: 'SCRUB',
      type: 'SIGNAL',
      points: [{ x: 645, y: 185 }, { x: 645, y: 253 }, { x: 610, y: 253 }],
      color: '#00d2ff',
      strokeWidth: 0.9,
      dashed: '2.4 2.4'
    },
    {
      id: 'scrub_sig_15',
      screenId: 'SCRUB',
      type: 'SIGNAL',
      points: [{ x: 602, y: 249 }, { x: 602, y: 256 }, { x: 508, y: 256 }],
      color: '#00d2ff',
      strokeWidth: 0.9,
      dashed: '2.4 2.4'
    },
    {
      id: 'scrub_sig_16',
      screenId: 'SCRUB',
      type: 'SIGNAL',
      points: [{ x: 654, y: 118 }, { x: 744, y: 118 }, { x: 744, y: 22 }],
      color: '#00d2ff',
      strokeWidth: 0.9,
      dashed: '2.4 2.4'
    },
    {
      id: 'scrub_sig_17',
      screenId: 'SCRUB',
      type: 'SIGNAL',
      points: [{ x: 707, y: 96 }, { x: 707, y: 161 }, { x: 760, y: 161 }],
      color: '#00d2ff',
      strokeWidth: 0.9,
      dashed: '2.4 2.4'
    },
    {
      id: 'scrub_sig_18',
      screenId: 'SCRUB',
      type: 'SIGNAL',
      points: [{ x: 719, y: 165 }, { x: 719, y: 209 }, { x: 811, y: 209 }],
      color: '#00d2ff',
      strokeWidth: 0.9,
      dashed: '2.4 2.4'
    },
    {
      id: 'scrub_sig_19',
      screenId: 'SCRUB',
      type: 'SIGNAL',
      points: [{ x: 760, y: 205 }, { x: 760, y: 259 }, { x: 827, y: 259 }],
      color: '#00d2ff',
      strokeWidth: 0.9,
      dashed: '2.4 2.4'
    },
    {
      id: 'scrub_sig_20',
      screenId: 'SCRUB',
      type: 'SIGNAL',
      points: [{ x: 692, y: 261 }, { x: 692, y: 311 }, { x: 753, y: 311 }],
      color: '#00d2ff',
      strokeWidth: 0.9,
      dashed: '2.4 2.4'
    },
    {
      id: 'scrub_sig_21',
      screenId: 'SCRUB',
      type: 'SIGNAL',
      points: [{ x: 690, y: 306 }, { x: 670, y: 306 }, { x: 670, y: 262 }],
      color: '#00d2ff',
      strokeWidth: 0.9,
      dashed: '2.4 2.4'
    }
  ];

  if (screenId) {
    return allLines.filter((l) => l.screenId === screenId);
  }
  return allLines;
};

const loadSavedLines = (): CustomProcessLine[] => {
  try {
    const saved = safeGetItem(STORAGE_KEY_LINES);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter((l: CustomProcessLine) => l.screenId !== 'DE_ETHANIZER' && l.screenId !== 'DE_PROPANIZER' && l.screenId !== 'DE_BUTANIZER');
      }
    }
  } catch (e) {}
  return getDefaultLines();
};

const getDefaultSymbols = (screenId?: ScreenId): CustomInstrumentSymbol[] => {
  const allSymbols: CustomInstrumentSymbol[] = [
    // Clean Symbols registry (manual valves and minor clutter removed)
  ];

  if (screenId) {
    return allSymbols.filter((s) => s.screenId === screenId);
  }
  return allSymbols;
};


const loadSavedSymbols = (): CustomInstrumentSymbol[] => {
  try {
    const saved = safeGetItem(STORAGE_KEY_SYMBOLS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return getDefaultSymbols();
};

const loadSavedAnnotations = (): InterviewAnnotation[] => {
  try {
    const saved = safeGetItem(STORAGE_KEY_ANNOTATIONS);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {}
  return [
    {
      id: 'ann_scrub_1',
      screenId: 'SCRUB',
      x: 215,
      y: 195,
      type: 'QUESTION',
      title: 'Interview Q1: Stripping Zone Control',
      content: 'Jelaskan hubungan antara temperatur tray-1 (TIC1: -3.6°C) dengan steam 3E-1 saat laju alir umpan berubah!',
      color: '#00e5ff',
      resolved: false
    },
    {
      id: 'ann_scrub_2',
      screenId: 'SCRUB',
      x: 375,
      y: 185,
      type: 'CHECKPOINT',
      title: 'Trainee Checkpoint: Reflux Ratio',
      content: 'Pastikan pompa 3G-1A/B mempertahankan aliran reflux FIC3 minimal 85 m³/h untuk mencegah heavy slip ke overhead.',
      color: '#10b981',
      resolved: false
    }
  ];
};

export const useLayoutStore = create<LayoutStoreState>((set, get) => ({
  isEditMode: false,
  activeTool: 'SELECT',
  drawingLineType: 'PROCESS',
  gridSnap: 5,
  showGrid: true,
  selectedElementId: null,
  selectedLineId: null,
  selectedPointIndex: null,
  layouts: loadSavedLayouts(),
  annotations: loadSavedAnnotations(),
  lines: loadSavedLines(),
  symbols: loadSavedSymbols(),

  setEditMode: (enabled) => set({ isEditMode: enabled }),
  toggleEditMode: () => set((state) => ({ isEditMode: !state.isEditMode })),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setDrawingLineType: (type) => set({ drawingLineType: type }),
  setGridSnap: (snap) => set({ gridSnap: snap }),
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  setSelectedElementId: (id) => set({ selectedElementId: id, selectedLineId: null, selectedPointIndex: null }),
  setSelectedLineId: (id, pointIndex = null) =>
    set({ selectedLineId: id, selectedPointIndex: pointIndex, selectedElementId: null }),

  getElementPosition: (screenId, elementId, defaultX, defaultY) => {
    const screenLayout = get().layouts[screenId] || {};
    const item = screenLayout[elementId];
    if (item) {
      return {
        x: item.x,
        y: item.y,
        visible: item.visible !== false,
        customLabel: item.customLabel,
        color: item.color,
        style: item.style || 'badge',
        scale: item.scale || 1
      };
    }
    return {
      x: defaultX,
      y: defaultY,
      visible: true,
      style: 'badge',
      scale: 1
    };
  },

  updateElementPosition: (screenId, elementId, x, y) => {
    const { gridSnap, layouts } = get();
    const snap = gridSnap > 0 ? gridSnap : 1;
    const snappedX = Math.round(x / snap) * snap;
    const snappedY = Math.round(y / snap) * snap;

    const screenLayout = { ...(layouts[screenId] || {}) };
    const currentProps = screenLayout[elementId] || { visible: true };

    screenLayout[elementId] = {
      ...currentProps,
      x: snappedX,
      y: snappedY
    };

    const newLayouts = {
      ...layouts,
      [screenId]: screenLayout
    };

    set({ layouts: newLayouts });
    safeSetItem(STORAGE_KEY_LAYOUTS, JSON.stringify(newLayouts));
  },

  updateElementProps: (screenId, elementId, props) => {
    const { layouts } = get();
    const screenLayout = { ...(layouts[screenId] || {}) };
    const current = screenLayout[elementId] || { x: 0, y: 0, visible: true };

    screenLayout[elementId] = {
      ...current,
      ...props
    };

    const newLayouts = {
      ...layouts,
      [screenId]: screenLayout
    };

    set({ layouts: newLayouts });
    safeSetItem(STORAGE_KEY_LAYOUTS, JSON.stringify(newLayouts));
  },

  toggleElementVisibility: (screenId, elementId) => {
    const { layouts } = get();
    const screenLayout = { ...(layouts[screenId] || {}) };
    const current = screenLayout[elementId] || { x: 0, y: 0, visible: true };

    screenLayout[elementId] = {
      ...current,
      visible: current.visible === false
    };

    const newLayouts = {
      ...layouts,
      [screenId]: screenLayout
    };

    set({ layouts: newLayouts });
    safeSetItem(STORAGE_KEY_LAYOUTS, JSON.stringify(newLayouts));
  },

  resetElementPosition: (screenId, elementId) => {
    const { layouts } = get();
    const screenLayout = { ...(layouts[screenId] || {}) };
    delete screenLayout[elementId];

    const newLayouts = {
      ...layouts,
      [screenId]: screenLayout
    };

    set({ layouts: newLayouts });
    safeSetItem(STORAGE_KEY_LAYOUTS, JSON.stringify(newLayouts));
  },

  resetScreenLayout: (screenId) => {
    const { layouts } = get();
    const newLayouts = {
      ...layouts,
      [screenId]: {}
    };
    set({ layouts: newLayouts });
    safeSetItem(STORAGE_KEY_LAYOUTS, JSON.stringify(newLayouts));
  },

  resetAllLayouts: () => {
    const emptyLayouts: Record<ScreenId, Record<string, ElementLayout>> = {
      SCRUB: {},
      DE_ETHANIZER: {},
      DE_PROPANIZER: {},
      DE_BUTANIZER: {},
      REFRIGERATION: {},
      OVERVIEW: {}
    };
    const defaultLines = getDefaultLines();
    const defaultSymbols = getDefaultSymbols();
    set({
      layouts: emptyLayouts,
      lines: defaultLines,
      symbols: defaultSymbols,
      annotations: [],
      selectedLineId: null,
      selectedPointIndex: null,
      selectedElementId: null
    });
    safeRemoveItem(STORAGE_KEY_LAYOUTS);
    safeRemoveItem(STORAGE_KEY_LINES);
    safeRemoveItem(STORAGE_KEY_SYMBOLS);
    safeRemoveItem(STORAGE_KEY_ANNOTATIONS);
  },

  // Process & Signal Lines implementation
  addLine: (line) => {
    const id = `line_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newLine: CustomProcessLine = {
      ...line,
      id
    };
    const newLines = [...get().lines, newLine];
    set({ lines: newLines, selectedLineId: id });
    safeSetItem(STORAGE_KEY_LINES, JSON.stringify(newLines));
    return id;
  },

  updateLine: (id, updates) => {
    const newLines = get().lines.map((l) => (l.id === id ? { ...l, ...updates } : l));
    set({ lines: newLines });
    safeSetItem(STORAGE_KEY_LINES, JSON.stringify(newLines));
  },

  updateLinePoint: (id, pointIndex, x, y) => {
    const { gridSnap, lines } = get();
    const snap = gridSnap > 0 ? gridSnap : 1;
    const snappedX = Math.round(x / snap) * snap;
    const snappedY = Math.round(y / snap) * snap;

    const newLines = lines.map((l) => {
      if (l.id !== id) return l;
      const newPoints = [...l.points];
      if (pointIndex >= 0 && pointIndex < newPoints.length) {
        newPoints[pointIndex] = { x: snappedX, y: snappedY };
      }
      return { ...l, points: newPoints };
    });

    set({ lines: newLines });
    safeSetItem(STORAGE_KEY_LINES, JSON.stringify(newLines));
  },

  addLinePoint: (id, segmentIndex, x, y) => {
    const { gridSnap, lines } = get();
    const snap = gridSnap > 0 ? gridSnap : 1;
    const snappedX = Math.round(x / snap) * snap;
    const snappedY = Math.round(y / snap) * snap;

    const newLines = lines.map((l) => {
      if (l.id !== id) return l;
      const newPoints = [...l.points];
      newPoints.splice(segmentIndex + 1, 0, { x: snappedX, y: snappedY });
      return { ...l, points: newPoints };
    });

    set({ lines: newLines });
    safeSetItem(STORAGE_KEY_LINES, JSON.stringify(newLines));
  },

  removeLinePoint: (id, pointIndex) => {
    const { lines } = get();
    const newLines = lines.map((l) => {
      if (l.id !== id) return l;
      if (l.points.length <= 2) return l; // Keep at least 2 points
      const newPoints = l.points.filter((_, idx) => idx !== pointIndex);
      return { ...l, points: newPoints };
    });

    set({ lines: newLines });
    safeSetItem(STORAGE_KEY_LINES, JSON.stringify(newLines));
  },

  deleteLine: (id) => {
    const newLines = get().lines.filter((l) => l.id !== id);
    set({ lines: newLines, selectedLineId: null, selectedPointIndex: null });
    safeSetItem(STORAGE_KEY_LINES, JSON.stringify(newLines));
  },

  resetLinesToBaseline: (screenId) => {
    const defaultLinesForScreen = getDefaultLines(screenId);
    const otherLines = get().lines.filter((l) => l.screenId !== screenId);
    const newLines = [...otherLines, ...defaultLinesForScreen];
    set({ lines: newLines });
    safeSetItem(STORAGE_KEY_LINES, JSON.stringify(newLines));
  },

  // Custom Instrument & Equipment Symbols implementation
  addInstrumentSymbol: (symbol) => {
    const id = `sym_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newSym: CustomInstrumentSymbol = {
      ...symbol,
      id
    };
    const newSymbols = [...get().symbols, newSym];
    set({ symbols: newSymbols, selectedElementId: id });
    safeSetItem(STORAGE_KEY_SYMBOLS, JSON.stringify(newSymbols));
    return id;
  },

  updateInstrumentSymbol: (id, updates) => {
    const newSymbols = get().symbols.map((s) => (s.id === id ? { ...s, ...updates } : s));
    set({ symbols: newSymbols });
    safeSetItem(STORAGE_KEY_SYMBOLS, JSON.stringify(newSymbols));
  },

  deleteInstrumentSymbol: (id) => {
    const newSymbols = get().symbols.filter((s) => s.id !== id);
    set({ symbols: newSymbols });
    safeSetItem(STORAGE_KEY_SYMBOLS, JSON.stringify(newSymbols));
  },

  resetSymbolsToBaseline: (screenId) => {
    const defaultSyms = getDefaultSymbols(screenId);
    const otherSyms = get().symbols.filter((s) => s.screenId !== screenId);
    const newSymbols = [...otherSyms, ...defaultSyms];
    set({ symbols: newSymbols });
    safeSetItem(STORAGE_KEY_SYMBOLS, JSON.stringify(newSymbols));
  },

  // Interview Annotations implementation
  addAnnotation: (annotation) => {
    const id = `ann_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newAnn: InterviewAnnotation = {
      ...annotation,
      id
    };
    const newAnnotations = [...get().annotations, newAnn];
    set({ annotations: newAnnotations });
    safeSetItem(STORAGE_KEY_ANNOTATIONS, JSON.stringify(newAnnotations));
    return id;
  },

  updateAnnotation: (id, updates) => {
    const newAnnotations = get().annotations.map((ann) => (ann.id === id ? { ...ann, ...updates } : ann));
    set({ annotations: newAnnotations });
    safeSetItem(STORAGE_KEY_ANNOTATIONS, JSON.stringify(newAnnotations));
  },

  deleteAnnotation: (id) => {
    const newAnnotations = get().annotations.filter((ann) => ann.id !== id);
    set({ annotations: newAnnotations });
    safeSetItem(STORAGE_KEY_ANNOTATIONS, JSON.stringify(newAnnotations));
  },

  toggleAnnotationResolved: (id) => {
    const newAnnotations = get().annotations.map((ann) => (ann.id === id ? { ...ann, resolved: !ann.resolved } : ann));
    set({ annotations: newAnnotations });
    safeSetItem(STORAGE_KEY_ANNOTATIONS, JSON.stringify(newAnnotations));
  },

  exportLayoutJSON: () => {
    const { layouts, annotations, lines, symbols } = get();
    return JSON.stringify({ layouts, annotations, lines, symbols }, null, 2);
  },

  importLayoutJSON: (jsonStr) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && typeof parsed === 'object') {
        const layouts = parsed.layouts || {};
        const annotations = parsed.annotations || [];
        const lines = parsed.lines || getDefaultLines();
        const symbols = parsed.symbols || getDefaultSymbols();

        set({ layouts, annotations, lines, symbols });
        safeSetItem(STORAGE_KEY_LAYOUTS, JSON.stringify(layouts));
        safeSetItem(STORAGE_KEY_ANNOTATIONS, JSON.stringify(annotations));
        safeSetItem(STORAGE_KEY_LINES, JSON.stringify(lines));
        safeSetItem(STORAGE_KEY_SYMBOLS, JSON.stringify(symbols));
        return true;
      }
    } catch (e) {
      console.error('Failed to import layout JSON', e);
    }
    return false;
  }
}));
