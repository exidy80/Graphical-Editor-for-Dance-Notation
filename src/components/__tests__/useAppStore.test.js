import { act } from '@testing-library/react';
import { useAppStore } from '../../stores';
import * as ShapeTypes from '../../constants/shapeTypes';

describe('useAppStore', () => {
  beforeEach(() => {
    const { getState, setState } = useAppStore;
    // Reset selections, clear locks, and normalize dancer/hand state for isolation
    const panels = getState().panels.map((p) => ({
      ...p,
      locks: [],
      dancers: p.dancers.map((d) => ({
        ...d,
        x: 0,
        y: 0,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        leftHandPos: { x: 0, y: 0 },
        rightHandPos: { x: 0, y: 0 },
        leftElbowPos: { x: -45, y: -12 },
        rightElbowPos: { x: 45, y: -12 },
        leftHandRotation: 0,
        rightHandRotation: 0,
      })),
      shapes: p.shapes,
    }));
    setState(
      {
        panelSize: { width: 300, height: 300 },
        selectedPanel: null,
        selectedHand: null,
        selectedDancer: null,
        selectedShapeId: null,
        panels,
        lockUi: { active: false, selected: [] },
        opacity: {
          dancers: { value: 1, disabled: false },
          symbols: { value: 1, disabled: false },
        },
      },
      false,
    );
  });

  const absOf = (d, side) => ({
    x: (d.x || 0) + (d[`${side}HandPos`].x || 0),
    y: (d.y || 0) + (d[`${side}HandPos`].y || 0),
  });
  const expectAbsEqual = (a, b, eps = 1e-6) => {
    expect(Math.abs(a.x - b.x)).toBeLessThanOrEqual(eps);
    expect(Math.abs(a.y - b.y)).toBeLessThanOrEqual(eps);
  };

  test('initial panel contains stageX and stageNext symbols', () => {
    const { getState } = useAppStore;
    const panels = getState().panels;

    expect(panels.length).toBeGreaterThan(0);
    const firstPanel = panels[0];

    // Check for stageX (origin marker)
    const stageX = firstPanel.shapes.find((s) => s.type === ShapeTypes.STAGE_X);
    expect(stageX).toBeDefined();
    expect(stageX.text).toBe('O');
    expect(stageX.fill).toBe('black');

    // Check for stageNext (plus marker)
    const stageNext = firstPanel.shapes.find(
      (s) => s.type === ShapeTypes.STAGE_NEXT,
    );
    expect(stageNext).toBeDefined();
    expect(stageNext.text).toBe('+');
    expect(stageNext.fill).toBe('black');

    // Both should be at same initial position
    expect(stageX.x).toBe(stageNext.x);
    expect(stageX.y).toBe(stageNext.y);
  });

  test('select dancer toggles selection', () => {
    const { getState } = useAppStore;
    const panelId = getState().panels[0].id;
    const dancerId = getState().panels[0].dancers[0].id;
    act(() => getState().handleDancerSelection(panelId, dancerId));
    expect(getState().selectedDancer).toEqual({ panelId, dancerId });
    act(() => getState().handleDancerSelection(panelId, dancerId));
    expect(getState().selectedDancer).toBeNull();
  });

  test('head and hand selection update panel data', () => {
    const { getState } = useAppStore;
    const panelId = getState().panels[0].id;
    const dancerId = getState().panels[0].dancers[0].id;
    act(() => getState().handleDancerSelection(panelId, dancerId));
    act(() => getState().handleHeadSelection('Bow'));
    const panel = getState().panels[0];
    const idx = panel.dancers.findIndex((d) => d.id === dancerId);
    expect(panel.headShapes[idx]).toBe('Bow');

    act(() => getState().handleHandClick(panelId, dancerId, 'left'));
    act(() => getState().handleHandSelection('Shoulder'));
    const panel2 = getState().panels[0];
    expect(panel2.handShapes[idx].left).toBe('Shoulder');
  });

  test('shape draw and delete', () => {
    const { getState, setState } = useAppStore;
    const panelId = getState().panels[0].id;
    act(() => setState({ selectedPanel: panelId }, false));
    const shape = { id: 's1', type: 'signal', x: 0, y: 0, draggable: true };
    act(() => getState().handleShapeDraw(shape));
    expect(getState().panels[0].shapes.some((s) => s.id === 's1')).toBe(true);
    act(() => getState().handleDelete({ panelId, shapeId: 's1' }));
    expect(getState().panels[0].shapes.some((s) => s.id === 's1')).toBe(false);
  });

  test('apply and remove group lock, propagate hand position', () => {
    const { getState } = useAppStore;
    const panel = getState().panels[0];
    const a = { dancerId: panel.dancers[0].id, side: 'left' };
    const b = { dancerId: panel.dancers[1].id, side: 'right' };
    act(() => getState().setSelectedPanel(panel.id));
    act(() => getState().setLockModeActive(true));
    act(() => getState().handleHandClick(panel.id, a.dancerId, a.side));
    act(() => getState().handleHandClick(panel.id, b.dancerId, b.side));
    act(() => getState().applySelectedLock(panel.id));
    const lock = getState().panels[0].locks[0];
    expect(lock.members).toHaveLength(2);

    act(() =>
      getState().updateHandPosition(panel.id, a.dancerId, a.side, {
        x: 10,
        y: 20,
      }),
    );
    const p = getState().panels[0];
    const da = p.dancers.find((d) => d.id === a.dancerId);
    const db = p.dancers.find((d) => d.id === b.dancerId);
    expectAbsEqual(absOf(da, 'left'), absOf(db, 'right'));

    act(() => getState().removeLockById(panel.id, lock.id));
    expect(getState().panels[0].locks).toHaveLength(0);
  });

  test('multi-member lock (3+ members) propagates to all', () => {
    const { getState } = useAppStore;
    const panel = getState().panels[0];
    const members = [
      { dancerId: panel.dancers[0].id, side: 'left' },
      { dancerId: panel.dancers[1].id, side: 'right' },
      { dancerId: panel.dancers[0].id, side: 'right' },
    ];
    act(() => getState().setSelectedPanel(panel.id));
    act(() => getState().setLockModeActive(true));
    members.forEach((m) =>
      act(() => getState().handleHandClick(panel.id, m.dancerId, m.side)),
    );
    act(() => getState().applySelectedLock(panel.id));
    const lock = getState().panels[0].locks[0];
    expect(lock.members.length).toBeGreaterThanOrEqual(2);
    act(() =>
      getState().updateHandPosition(
        panel.id,
        members[0].dancerId,
        members[0].side,
        { x: 99, y: 77 },
      ),
    );
    const p = getState().panels[0];
    const d0 = p.dancers.find((d) => d.id === members[0].dancerId);
    const d1 = p.dancers.find((d) => d.id === members[1].dancerId);
    const d2 = p.dancers.find((d) => d.id === members[2].dancerId);
    const abs0 = absOf(d0, 'left');
    const abs1 = absOf(d1, 'right');
    const abs2 = absOf(d2, 'right');
    expectAbsEqual(abs0, abs1);
    expectAbsEqual(abs0, abs2);
  });

  test('dancer movement enforces locks for both hands', () => {
    const { getState } = useAppStore;
    const panel = getState().panels[0];
    const leftPair = [
      { dancerId: panel.dancers[0].id, side: 'left' },
      { dancerId: panel.dancers[1].id, side: 'right' },
    ];
    act(() => getState().setSelectedPanel(panel.id));
    act(() => getState().setLockModeActive(true));
    leftPair.forEach((m) =>
      act(() => getState().handleHandClick(panel.id, m.dancerId, m.side)),
    );
    act(() => getState().applySelectedLock(panel.id));

    // Move dancer 0; enforceLocksForDancer should align counterpart
    const d0 = getState().panels[0].dancers[0];
    const newX = (d0.x || 0) + 20;
    const newY = (d0.y || 0) + 10;
    act(() =>
      getState().updateDancerState(panel.id, d0.id, { x: newX, y: newY }),
    );
    act(() => getState().enforceLocksForDancer(panel.id, d0.id));

    const p = getState().panels[0];
    const da = p.dancers.find((d) => d.id === leftPair[0].dancerId);
    const db = p.dancers.find((d) => d.id === leftPair[1].dancerId);
    expectAbsEqual(absOf(da, 'left'), absOf(db, 'right'));
  });

  test('lockOverlappingHands groups overlapped hands and persists through movement', () => {
    const { getState } = useAppStore;
    const panel = getState().panels[0];
    const d0 = panel.dancers[0];
    const d1 = panel.dancers[1];
    // Force overlap of d0.left and d1.right in absolute space
    const targetAbs = { x: 50, y: 60 };
    act(() => getState().updateDancerState(panel.id, d0.id, { x: 0, y: 0 }));
    act(() => getState().updateDancerState(panel.id, d1.id, { x: 0, y: 0 }));
    act(() =>
      getState().updateHandPosition(panel.id, d0.id, 'left', targetAbs),
    );
    act(() =>
      getState().updateHandPosition(panel.id, d1.id, 'right', targetAbs),
    );

    act(() => getState().lockOverlappingHands(panel.id, 1));
    expect(getState().panels[0].locks.length).toBeGreaterThan(0);

    // Move dancer 1
    act(() => getState().updateDancerState(panel.id, d1.id, { x: 20, y: 0 }));
    act(() => getState().enforceLocksForDancer(panel.id, d1.id));

    const p = getState().panels[0];
    const a = p.dancers.find((d) => d.id === d0.id);
    const b = p.dancers.find((d) => d.id === d1.id);
    expectAbsEqual(absOf(a, 'left'), absOf(b, 'right'));
  });

  test('centroid enforcement keeps locked hands midway after body move', () => {
    const { getState } = useAppStore;
    const panel = getState().panels[0];
    const d0 = panel.dancers[0];
    const d1 = panel.dancers[1];

    // Place dancers apart and set hand locals at simple offsets
    act(() =>
      getState().updateDancerState(panel.id, d0.id, {
        x: 0,
        y: 0,
        rotation: 0,
      }),
    );
    act(() =>
      getState().updateDancerState(panel.id, d1.id, {
        x: 100,
        y: 0,
        rotation: 0,
      }),
    );
    act(() =>
      getState().updateHandPosition(panel.id, d0.id, 'left', { x: 0, y: 0 }),
    );
    act(() =>
      getState().updateHandPosition(panel.id, d1.id, 'right', { x: 0, y: 0 }),
    );

    // Lock these two hands
    act(() => getState().setSelectedPanel(panel.id));
    act(() => getState().setLockModeActive(true));
    act(() => getState().handleHandClick(panel.id, d0.id, 'left'));
    act(() => getState().handleHandClick(panel.id, d1.id, 'right'));
    act(() => getState().applySelectedLock(panel.id));

    // Move d0 body to the right by 20
    act(() => getState().updateDancerState(panel.id, d0.id, { x: 20 }));
    // Before enforcement, abs positions are A=(20,0), B=(100,0). Centroid should be (60,0)
    act(() => getState().enforceLocksForDancer(panel.id, d0.id));

    const p = getState().panels[0];
    const a = p.dancers.find((dd) => dd.id === d0.id);
    const b = p.dancers.find((dd) => dd.id === d1.id);
    const absA = absOf(a, 'left');
    const absB = absOf(b, 'right');
    expectAbsEqual(absA, absB);
    // And both should be at mid-point of bodies
    const mid = (a.x + b.x) / 2;
    expect(Math.abs(absA.x - mid)).toBeLessThanOrEqual(1e-6);
    expect(absA.y).toBeCloseTo(0, 6);
  });

  test('clonePanel preserves locks and remaps dancer IDs', () => {
    const { getState } = useAppStore;
    const panel = getState().panels[0];
    const a = { dancerId: panel.dancers[0].id, side: 'left' };
    const b = { dancerId: panel.dancers[1].id, side: 'right' };
    act(() => getState().setSelectedPanel(panel.id));
    act(() => getState().setLockModeActive(true));
    act(() => getState().handleHandClick(panel.id, a.dancerId, a.side));
    act(() => getState().handleHandClick(panel.id, b.dancerId, b.side));
    act(() => getState().applySelectedLock(panel.id));
    const prevPanelCount = getState().panels.length;
    act(() => getState().clonePanel(panel.id));
    const panels = getState().panels;
    expect(panels.length).toBe(prevPanelCount + 1);
    const cloned = panels[1];
    expect(cloned.locks.length).toBeGreaterThanOrEqual(1);
    // Ensure cloned lock refers to cloned dancer IDs, not originals
    const clonedLock = cloned.locks[0];
    const idSet = new Set(cloned.dancers.map((d) => d.id));
    clonedLock.members.forEach((m) => expect(idSet.has(m.dancerId)).toBe(true));
  });

  test('handleCanvasClick clears all selections', () => {
    const { getState } = useAppStore;
    const panel = getState().panels[0];
    const dancerId = panel.dancers[0].id;
    act(() => getState().handleDancerSelection(panel.id, dancerId));
    act(() => getState().handleShapeSelection(panel.id, 'shape-xyz'));
    act(() => getState().handleCanvasClick());
    expect(getState().selectedPanel).toBeNull();
    expect(getState().selectedDancer).toBeNull();
    expect(getState().selectedHand).toBeNull();
    expect(getState().selectedShapeId).toBeNull();
  });
});
