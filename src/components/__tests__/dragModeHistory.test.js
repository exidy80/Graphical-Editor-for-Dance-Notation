import { act } from '@testing-library/react';
import { useAppStore } from '../../stores';

describe('Drag Mode History Test', () => {
  beforeEach(() => {
    const { getState } = useAppStore;

    // Clear history first
    const temporal = getState().temporal;
    if (temporal) {
      temporal.clear();
    }

    // Reset to initial state for each test
    act(() => {
      getState().resetDancers();
    });
  });

  test('drag mode flags work correctly', () => {
    const { getState } = useAppStore;

    expect(getState()._isDragMode).toBe(false);

    act(() => {
      getState().startDragMode();
    });

    expect(getState()._isDragMode).toBe(true);

    act(() => {
      getState().endDragMode();
    });

    expect(getState()._isDragMode).toBe(false);
  });

  test('dancer updates work during and after drag mode', () => {
    const { getState } = useAppStore;
    const panelId = getState().panels[0].id;
    const dancerId = getState().panels[0].dancers[0].id;

    // Get initial position
    const initialDancer = getState().panels[0].dancers.find(
      (d) => d.id === dancerId,
    );
    const initialX = initialDancer.x;
    const initialY = initialDancer.y;

    // Start drag mode
    act(() => {
      getState().startDragMode();
    });

    // Update dancer position during drag (simulating continuous updates)
    act(() => {
      getState().updateDancerState(panelId, dancerId, {
        x: initialX + 50,
        y: initialY + 25,
      });
    });

    // Verify position updated
    const duringDragDancer = getState().panels[0].dancers.find(
      (d) => d.id === dancerId,
    );
    expect(duringDragDancer.x).toBe(initialX + 50);
    expect(duringDragDancer.y).toBe(initialY + 25);

    // End drag mode
    act(() => {
      getState().endDragMode();
    });

    // Final update (simulating drag end)
    act(() => {
      getState().updateDancerState(panelId, dancerId, {
        x: initialX + 100,
        y: initialY + 50,
      });
    });

    // Verify final position
    const finalDancer = getState().panels[0].dancers.find(
      (d) => d.id === dancerId,
    );
    expect(finalDancer.x).toBe(initialX + 100);
    expect(finalDancer.y).toBe(initialY + 50);
  });

  test('reset dancers clears history as expected', () => {
    const { getState } = useAppStore;
    const panelId = getState().panels[0].id;
    const dancerId = getState().panels[0].dancers[0].id;

    // First, create some history by updating a dancer
    act(() => {
      getState().updateDancerState(panelId, dancerId, { x: 200, y: 200 });
    });

    // Check if history was created
    const historyAfterUpdate = getState().temporal?.pastStates?.length || 0;
    console.log('History after dancer update:', historyAfterUpdate);

    // Now reset dancers
    act(() => {
      getState().resetDancers();
    });

    // Wait a bit for any async operations
    setTimeout(() => {
      const historyAfterReset = getState().temporal?.pastStates?.length || 0;
      console.log('History after reset:', historyAfterReset);

      // History should be cleared
      expect(historyAfterReset).toBe(0);
    }, 100);
  });
});
