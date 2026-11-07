import { describe, it, expect, beforeEach } from 'vitest';
import { useLayoutStore } from '../stores/useLayoutStore';

describe('useLayoutStore & Drag and Drop Layout Editor', () => {
  beforeEach(() => {
    useLayoutStore.getState().resetAllLayouts();
    useLayoutStore.setState({
      isEditMode: false,
      gridSnap: 5,
      showGrid: true,
      selectedElementId: null,
      selectedLineId: null,
      selectedPointIndex: null
    });
  });

  it('toggles edit mode and updates grid snap', () => {
    const store = useLayoutStore.getState();
    expect(store.isEditMode).toBe(false);

    store.toggleEditMode();
    expect(useLayoutStore.getState().isEditMode).toBe(true);

    store.setGridSnap(10);
    expect(useLayoutStore.getState().gridSnap).toBe(10);
  });

  it('updates element position with grid snapping', () => {
    const store = useLayoutStore.getState();
    store.setGridSnap(10);

    // Position (123, 456) with snap 10 should become (120, 460)
    store.updateElementPosition('SCRUB', 'TIC1', 123, 456);

    const pos = store.getElementPosition('SCRUB', 'TIC1', 0, 0);
    expect(pos.x).toBe(120);
    expect(pos.y).toBe(460);
    expect(pos.visible).toBe(true);
  });

  it('updates custom properties (label, color, style)', () => {
    const store = useLayoutStore.getState();
    store.updateElementPosition('SCRUB', 'TIC1', 100, 200);
    store.updateElementProps('SCRUB', 'TIC1', { customLabel: 'TIC-1 (Overhead Temp)', color: '#10b981' });

    const pos = store.getElementPosition('SCRUB', 'TIC1', 0, 0);
    expect(pos.customLabel).toBe('TIC-1 (Overhead Temp)');
    expect(pos.color).toBe('#10b981');
  });

  it('manages process and signal lines (add, point bending, delete)', () => {
    const store = useLayoutStore.getState();
    const lineId = store.addLine({
      screenId: 'SCRUB',
      type: 'PROCESS',
      points: [
        { x: 100, y: 100 },
        { x: 200, y: 100 }
      ],
      color: '#ffffff',
      strokeWidth: 2,
      label: 'TEST FEED LINE'
    });

    expect(lineId).toBeDefined();
    let currentLine = useLayoutStore.getState().lines.find((l) => l.id === lineId);
    expect(currentLine?.label).toBe('TEST FEED LINE');
    expect(currentLine?.points.length).toBe(2);

    // Add a bend point in the middle
    store.addLinePoint(lineId, 0, 150, 150);
    currentLine = useLayoutStore.getState().lines.find((l) => l.id === lineId);
    expect(currentLine?.points.length).toBe(3);
    expect(currentLine?.points[1]).toEqual({ x: 150, y: 150 });

    // Update point coordinate with snap
    store.setGridSnap(10);
    store.updateLinePoint(lineId, 1, 154, 156);
    currentLine = useLayoutStore.getState().lines.find((l) => l.id === lineId);
    expect(currentLine?.points[1]).toEqual({ x: 150, y: 160 });

    // Delete line
    store.deleteLine(lineId);
    currentLine = useLayoutStore.getState().lines.find((l) => l.id === lineId);
    expect(currentLine).toBeUndefined();
  });

  it('manages custom instrument and valve symbols', () => {
    const store = useLayoutStore.getState();
    const symId = store.addInstrumentSymbol({
      screenId: 'SCRUB',
      symbolType: 'CONTROL_VALVE',
      x: 250,
      y: 350,
      rotation: 90,
      tagId: 'LIC2',
      label: 'LV-200',
      color: '#38bdf8'
    });

    expect(symId).toBeDefined();
    let currentSym = useLayoutStore.getState().symbols.find((s) => s.id === symId);
    expect(currentSym?.symbolType).toBe('CONTROL_VALVE');
    expect(currentSym?.tagId).toBe('LIC2');
    expect(currentSym?.rotation).toBe(90);

    // Rotate and update position
    store.updateInstrumentSymbol(symId, { rotation: 180, x: 280 });
    currentSym = useLayoutStore.getState().symbols.find((s) => s.id === symId);
    expect(currentSym?.rotation).toBe(180);
    expect(currentSym?.x).toBe(280);

    // Delete symbol
    store.deleteInstrumentSymbol(symId);
    currentSym = useLayoutStore.getState().symbols.find((s) => s.id === symId);
    expect(currentSym).toBeUndefined();
  });

  it('manages interview annotations (add, update, resolve, delete)', () => {
    const store = useLayoutStore.getState();
    const annId = store.addAnnotation({
      screenId: 'SCRUB',
      x: 200,
      y: 300,
      type: 'QUESTION',
      title: 'Interview Q: Reboiler Duty',
      content: 'Explain 3E-1 duty regulation.',
      resolved: false
    });

    expect(annId).toBeDefined();
    let current = useLayoutStore.getState().annotations.find((a) => a.id === annId);
    expect(current?.title).toBe('Interview Q: Reboiler Duty');
    expect(current?.resolved).toBe(false);

    // Toggle resolved
    store.toggleAnnotationResolved(annId);
    current = useLayoutStore.getState().annotations.find((a) => a.id === annId);
    expect(current?.resolved).toBe(true);

    // Delete
    store.deleteAnnotation(annId);
    current = useLayoutStore.getState().annotations.find((a) => a.id === annId);
    expect(current).toBeUndefined();
  });

  it('exports and imports JSON layout configurations including lines and symbols', () => {
    const store = useLayoutStore.getState();
    store.updateElementPosition('DE_ETHANIZER', 'PIC3', 150, 250);
    const lineId = store.addLine({
      screenId: 'DE_ETHANIZER',
      type: 'STEAM',
      points: [{ x: 50, y: 50 }, { x: 80, y: 80 }],
      color: '#ef4444',
      strokeWidth: 2
    });

    const exported = store.exportLayoutJSON();
    expect(exported).toContain('DE_ETHANIZER');
    expect(exported).toContain('PIC3');
    expect(exported).toContain('STEAM');

    // Clear and re-import
    store.resetAllLayouts();
    expect(store.getElementPosition('DE_ETHANIZER', 'PIC3', 0, 0).x).toBe(0);

    const success = store.importLayoutJSON(exported);
    expect(success).toBe(true);
    expect(useLayoutStore.getState().getElementPosition('DE_ETHANIZER', 'PIC3', 0, 0).x).toBe(150);
    expect(useLayoutStore.getState().lines.some((l) => l.type === 'STEAM')).toBe(true);
  });
});
