import { act } from '@testing-library/react';
import { useAppStore } from '../../stores';

describe('Drag History Prevention', () => {
  beforeEach(() => {
    const { getState, setState, temporal } = useAppStore;

    // Clear history first and ensure tracking is resumed
    if (temporal) {
      temporal.getState().clear();
      temporal.getState().resume(); // Ensure tracking is active
    }

    // Reset to initial state
    const panels = getState().panels.map((p) => ({
      ...p,
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
      shapes: p.shapes.filter((s) => s.type === 'stageX'),
    }));

    const resetPanels = [panels[0]];

    setState(
      {
        panels: resetPanels,
        selectedPanel: null,
        selectedDancer: null,
        selectedHand: null,
        selectedShapeId: null,
      },
      false,
    );

    // Clear history again after state reset
    setTimeout(() => {
      if (useAppStore.temporal) {
        useAppStore.temporal.getState().clear();
      }
    }, 0);
  });

  describe('Dancer Dragging', () => {
    test('should not create history entries for each pixel during dancer drag', async () => {
      const { getState, temporal } = useAppStore;

      // Wait for beforeEach cleanup
      await new Promise((resolve) => setTimeout(resolve, 20));

      const panelId = getState().panels[0].id;
      const dancerId = getState().panels[0].dancers[0].id;

      // Verify clean state
      temporal.getState().clear();

      // Get initial history length
      let historyLength = temporal.getState().pastStates.length;
      expect(historyLength).toBe(0);

      // Simulate drag start
      act(() => {
        getState().startDragMode();
      });

      // Verify tracking is paused
      const isTracking = temporal.getState().isTracking;
      console.log('After startDragMode - isTracking:', isTracking);
      expect(isTracking).toBe(false);

      // Simulate multiple pixel moves during drag (like a real drag operation)
      for (let i = 1; i <= 10; i++) {
        act(() => {
          getState().updateDancerState(panelId, dancerId, {
            x: i * 5,
            y: i * 5,
          });
        });
        // Check history after each update
        const lenAfterMove = temporal.getState().pastStates.length;
        if (lenAfterMove > 0) {
          console.log(
            `History grew during drag at move ${i}! Length:`,
            lenAfterMove,
          );
        }
      }

      // History should have exactly 1 entry (the before-drag snapshot)
      historyLength = temporal.getState().pastStates.length;
      console.log('During drag - history length:', historyLength);
      console.log('Past states:', temporal.getState().pastStates);
      expect(historyLength).toBe(1);

      // Simulate drag end with final position
      act(() => {
        getState().endDragMode();
      });

      // Verify tracking is resumed
      const isTrackingAfter = temporal.getState().isTracking;
      console.log('After endDragMode - isTracking:', isTrackingAfter);
      expect(isTrackingAfter).toBe(true);

      console.log(
        'Dancer position after drag ends:',
        getState().panels[0].dancers[0].x,
        getState().panels[0].dancers[0].y,
      );

      // The final update after drag end should be tracked
      act(() => {
        getState().updateDancerState(panelId, dancerId, {
          x: 100,
          y: 100,
        });
      });

      console.log(
        'Dancer position after final update:',
        getState().panels[0].dancers[0].x,
        getState().panels[0].dancers[0].y,
      );

      // Now history should have TWO entries:
      // 1. The before-drag snapshot (x:0, y:0)
      // 2. The post-drag state (x:50, y:50) saved when we updated to (x:100, y:100)
      historyLength = temporal.getState().pastStates.length;
      console.log('After drag end - history length:', historyLength);
      console.log(
        'Past states:',
        JSON.stringify(
          temporal.getState().pastStates.map((s) => s.panels[0].dancers[0]),
        ),
      );
      expect(historyLength).toBe(2);

      // Verify we can undo to the previous state (before the final update)
      act(() => {
        temporal.getState().undo();
      });

      const dancer = getState().panels[0].dancers[0];
      // After undo, should be back to (50, 50) which was the dancer position at drag end
      // (the drag moves were not tracked, so the last tracked position is where the drag ended)
      expect(dancer.x).toBe(50);
      expect(dancer.y).toBe(50);
    });
  });

  describe('Hand Dragging', () => {
    test('should not create history entries for each pixel during hand drag', async () => {
      const { getState, temporal } = useAppStore;

      await new Promise((resolve) => setTimeout(resolve, 20));

      const panelId = getState().panels[0].id;
      const dancerId = getState().panels[0].dancers[0].id;

      temporal.getState().clear();

      // Simulate hand drag start
      act(() => {
        getState().startDragMode();
      });

      expect(temporal.getState().isTracking).toBe(false);

      // Simulate multiple pixel moves during hand drag
      for (let i = 1; i <= 10; i++) {
        act(() => {
          getState().updateHandPosition(panelId, dancerId, 'left', {
            x: i * 2,
            y: i * 2,
          });
        });
      }

      // History should have exactly 1 entry (the before-drag snapshot)
      let historyLength = temporal.getState().pastStates.length;
      console.log('During hand drag - history length:', historyLength);
      expect(historyLength).toBe(1);

      // Drag end with final update
      act(() => {
        getState().endDragMode();
        getState().updateHandPosition(panelId, dancerId, 'left', {
          x: 50,
          y: 50,
        });
      });

      expect(temporal.getState().isTracking).toBe(true);

      // Should have TWO history entries:
      // 1. The before-drag snapshot
      // 2. The post-drag state saved when we updated to final position
      historyLength = temporal.getState().pastStates.length;
      console.log('After hand drag end - history length:', historyLength);
      expect(historyLength).toBe(2);
    });
  });

  describe('Hand Rotation', () => {
    test('should not create history entries for each degree during hand rotation', async () => {
      const { getState, temporal } = useAppStore;

      await new Promise((resolve) => setTimeout(resolve, 20));

      const panelId = getState().panels[0].id;
      const dancerId = getState().panels[0].dancers[0].id;

      temporal.getState().clear();

      // Simulate rotation start
      act(() => {
        getState().startDragMode();
      });

      expect(temporal.getState().isTracking).toBe(false);

      // Simulate rotating through multiple angles
      for (let angle = 0; angle <= 90; angle += 10) {
        act(() => {
          getState().updateHandRotation(panelId, dancerId, 'right', angle);
        });
      }

      // History should have exactly 1 entry (the before-rotation snapshot)
      let historyLength = temporal.getState().pastStates.length;
      console.log('During rotation - history length:', historyLength);
      expect(historyLength).toBe(1);

      // Rotation end - just resume, don't do final update (state is already current)
      act(() => {
        getState().endDragMode();
      });

      expect(temporal.getState().isTracking).toBe(true);

      // Should have exactly ONE history entry (the before-rotation snapshot)
      historyLength = temporal.getState().pastStates.length;
      console.log('After rotation end - history length:', historyLength);
      expect(historyLength).toBe(1);
    });
  });

  describe('Drag Mode Flag', () => {
    test('should pause and resume temporal tracking', () => {
      const { getState, temporal } = useAppStore;

      // Initially tracking should be true (before any drag operation)
      expect(temporal.getState().isTracking).toBe(true);

      act(() => {
        getState().startDragMode();
      });

      expect(temporal.getState().isTracking).toBe(false);

      act(() => {
        getState().endDragMode();
      });

      expect(temporal.getState().isTracking).toBe(true);
    });
  });
});
