import { act } from '@testing-library/react';
import { useAppStore } from '../../stores';

describe('Reset Dancers Functionality', () => {
  beforeEach(() => {
    // Start with a clean state
    const { getState, setState } = useAppStore;
    setState(
      {
        panelSize: { width: 300, height: 300 },
        selectedPanel: null,
        selectedHand: null,
        selectedDancer: null,
        selectedShapeId: null,
        panels: [],
        hasUnsavedChanges: false,
        lastSaveTime: Date.now(),
        handFlash: [],
        lockUi: { active: false, selected: [] },
        opacity: {
          dancers: { value: 1, disabled: false },
          symbols: { value: 1, disabled: false },
        },
        _autoSaveTimer: null,
      },
      false,
    );
  });

  test('resetDancers creates initial state with one panel and two dancers', () => {
    const { getState } = useAppStore;

    // Start with empty state
    expect(getState().panels).toHaveLength(0);

    // Call resetDancers
    act(() => getState().resetDancers());

    const state = getState();

    // Should have exactly one panel
    expect(state.panels).toHaveLength(1);

    const panel = state.panels[0];

    // Panel should have exactly two dancers
    expect(panel.dancers).toHaveLength(2);

    // Check first dancer (red, top position)
    const dancer1 = panel.dancers[0];
    expect(dancer1.colour).toBe('red');
    expect(dancer1.x).toBe(150);
    expect(dancer1.y).toBe(40);
    expect(dancer1.rotation).toBe(180);
    expect(dancer1.leftHandPos).toEqual({ x: -30, y: -40 });
    expect(dancer1.rightHandPos).toEqual({ x: 30, y: -40 });
    expect(dancer1.leftElbowPos).toEqual({ x: -45, y: -12 });
    expect(dancer1.rightElbowPos).toEqual({ x: 45, y: -12 });

    // Check second dancer (blue, bottom position)
    const dancer2 = panel.dancers[1];
    expect(dancer2.colour).toBe('blue');
    expect(dancer2.x).toBe(150);
    expect(dancer2.y).toBe(220);
    expect(dancer2.rotation).toBe(0);
    expect(dancer2.leftHandPos).toEqual({ x: -30, y: -40 });
    expect(dancer2.rightHandPos).toEqual({ x: 30, y: -40 });
    expect(dancer2.leftElbowPos).toEqual({ x: -45, y: -12 });
    expect(dancer2.rightElbowPos).toEqual({ x: 45, y: -12 });

    // Check panel has default shapes
    expect(panel.shapes).toBeDefined();
    expect(panel.shapes.length).toBeGreaterThan(0);

    // Check head and hand shapes arrays
    expect(panel.headShapes).toEqual(['Upright', 'Upright']);
    expect(panel.handShapes).toEqual([
      { left: 'Waist', right: 'Waist' },
      { left: 'Waist', right: 'Waist' },
    ]);

    // Check no locks initially
    expect(panel.locks).toEqual([]);
  });

  test('resetDancers clears selections and UI state', () => {
    const { getState } = useAppStore;

    // Set up some state first
    act(() => getState().resetDancers()); // Get initial panel
    const initialPanel = getState().panels[0];

    // Set various selections
    act(() => getState().handlePanelSelection(initialPanel.id));
    act(() =>
      getState().setSelectedDancer({
        panelId: initialPanel.id,
        dancerId: initialPanel.dancers[0].id,
      }),
    );
    act(() =>
      getState().setSelectedHand({
        panelId: initialPanel.id,
        dancerId: initialPanel.dancers[0].id,
        handSide: 'left',
      }),
    );
    act(() => getState().setLockModeActive(true));

    // Add more panels
    act(() => getState().addPanel());
    act(() => getState().addPanel());

    expect(getState().panels).toHaveLength(3);
    expect(getState().selectedPanel).toBe(initialPanel.id);
    expect(getState().selectedDancer).toBeDefined();
    expect(getState().selectedHand).toBeDefined();
    expect(getState().lockUi.active).toBe(true);

    // Now reset
    act(() => getState().resetDancers());

    const state = getState();

    // Should have only one panel again
    expect(state.panels).toHaveLength(1);

    // All selections should be cleared
    expect(state.selectedPanel).toBeNull();
    expect(state.selectedDancer).toBeNull();
    expect(state.selectedHand).toBeNull();
    expect(state.selectedShapeId).toBeNull();

    // Lock UI should be reset
    expect(state.lockUi.active).toBe(false);
    expect(state.lockUi.selected).toEqual([]);
  });

  test('resetDancers works when starting from modified state', () => {
    const { getState } = useAppStore;

    // Start with a panel and modify it significantly
    act(() => getState().addPanel());
    const panel = getState().panels[0];

    // Modify dancer positions and properties
    act(() =>
      getState().updateDancerState(panel.id, panel.dancers[0].id, {
        x: 100,
        y: 100,
        colour: 'green',
        rotation: 45,
        leftHandPos: { x: -100, y: -100 },
        rightHandPos: { x: 100, y: -100 },
        leftElbowPos: { x: -75, y: -50 },
        rightElbowPos: { x: 75, y: -50 },
      }),
    );

    // Add locks
    act(() => getState().setLockModeActive(true));
    act(() =>
      getState().handleHandClick(panel.id, panel.dancers[0].id, 'left'),
    );
    act(() =>
      getState().handleHandClick(panel.id, panel.dancers[1].id, 'right'),
    );
    act(() => getState().applySelectedLock(panel.id));

    // Add more panels
    act(() => getState().addPanel());
    act(() => getState().addPanel());

    // Verify the modified state
    expect(getState().panels).toHaveLength(3);
    expect(getState().panels[0].dancers[0].x).toBe(100);
    expect(getState().panels[0].dancers[0].colour).toBe('green');
    expect(getState().panels[0].locks).toHaveLength(1);

    // Reset dancers
    act(() => getState().resetDancers());

    const state = getState();

    // Should be back to default state
    expect(state.panels).toHaveLength(1);
    const resetPanel = state.panels[0];

    expect(resetPanel.dancers[0].x).toBe(150);
    expect(resetPanel.dancers[0].y).toBe(40);
    expect(resetPanel.dancers[0].colour).toBe('red');
    expect(resetPanel.dancers[0].rotation).toBe(180);
    expect(resetPanel.locks).toEqual([]);
  });
});
