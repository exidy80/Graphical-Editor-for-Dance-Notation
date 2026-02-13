import { act } from '@testing-library/react';
import { useAppStore } from '../../stores';
import { UI_DIMENSIONS } from '../../utils/dimensions';

describe('Global Canvas Size functionality', () => {
  beforeEach(() => {
    const { getState, setState } = useAppStore;
    // Reset the store to a clean state
    setState({
      panels: [],
      selectedPanel: null,
      panelSize: UI_DIMENSIONS.DEFAULT_PANEL_SIZE,
      globalCanvasSize: 1.0,
    });
  });

  describe('Canvas size level state', () => {
    test('should initialize with default canvas size level of 1.0', () => {
      const { getState } = useAppStore;

      const canvasSizeLevel = getState().globalCanvasSize;
      expect(canvasSizeLevel).toBe(1.0);
    });

    test('should have panelSize that matches default', () => {
      const { getState } = useAppStore;

      const panelSize = getState().panelSize;
      expect(panelSize.width).toBe(UI_DIMENSIONS.DEFAULT_PANEL_SIZE.width);
      expect(panelSize.height).toBe(UI_DIMENSIONS.DEFAULT_PANEL_SIZE.height);
    });
  });

  describe('Increase canvas size functionality', () => {
    test('should increase canvas size level when increasing canvas size', () => {
      const { getState } = useAppStore;

      act(() => {
        useAppStore.getState().increaseCanvasSize();
      });

      const canvasSizeLevel = getState().globalCanvasSize;
      expect(canvasSizeLevel).toBeGreaterThan(1.0);
    });

    test('should increase panelSize when increasing canvas size', () => {
      const { getState } = useAppStore;
      const initialPanelSize = { ...getState().panelSize };

      act(() => {
        useAppStore.getState().increaseCanvasSize();
      });

      const newPanelSize = getState().panelSize;
      expect(newPanelSize.width).toBeGreaterThan(initialPanelSize.width);
      expect(newPanelSize.height).toBeGreaterThan(initialPanelSize.height);
    });

    test('should not exceed maximum canvas size level of 4.0', () => {
      const { getState } = useAppStore;

      act(() => {
        // Try to increase canvas size many times
        for (let i = 0; i < 20; i++) {
          useAppStore.getState().increaseCanvasSize();
        }
      });

      const canvasSizeLevel = getState().globalCanvasSize;
      expect(canvasSizeLevel).toBeLessThanOrEqual(4.0);
    });

    test('should not exceed maximum panelSize of quadruple default', () => {
      const { getState } = useAppStore;
      const maxWidth = UI_DIMENSIONS.DEFAULT_PANEL_SIZE.width * 4;
      const maxHeight = UI_DIMENSIONS.DEFAULT_PANEL_SIZE.height * 4;

      act(() => {
        // Try to increase canvas size many times
        for (let i = 0; i < 20; i++) {
          useAppStore.getState().increaseCanvasSize();
        }
      });

      const panelSize = getState().panelSize;
      expect(panelSize.width).toBeLessThanOrEqual(maxWidth);
      expect(panelSize.height).toBeLessThanOrEqual(maxHeight);
    });

    test('canIncreaseCanvasSize should return false when at maximum canvas size', () => {
      const { getState } = useAppStore;

      act(() => {
        // Increase to maximum
        for (let i = 0; i < 20; i++) {
          useAppStore.getState().increaseCanvasSize();
        }
      });

      expect(getState().canIncreaseCanvasSize()).toBe(false);
    });

    test('canIncreaseCanvasSize should return true when below maximum canvas size', () => {
      const { getState } = useAppStore;

      expect(getState().canIncreaseCanvasSize()).toBe(true);
    });
  });

  describe('Decrease canvas size functionality', () => {
    test('should decrease canvas size level when decreasing canvas size from above 1.0', () => {
      const { getState } = useAppStore;

      act(() => {
        // First increase canvas size
        useAppStore.getState().increaseCanvasSize();
        useAppStore.getState().increaseCanvasSize();
      });

      const canvasSizeAfterIncrease = getState().globalCanvasSize;

      act(() => {
        useAppStore.getState().decreaseCanvasSize();
      });

      const canvasSizeAfterDecrease = getState().globalCanvasSize;
      expect(canvasSizeAfterDecrease).toBeLessThan(canvasSizeAfterIncrease);
    });

    test('should decrease panelSize when decreasing canvas size from above 1.0', () => {
      const { getState } = useAppStore;

      act(() => {
        // First increase canvas size
        useAppStore.getState().increaseCanvasSize();
        useAppStore.getState().increaseCanvasSize();
      });

      const panelSizeAfterIncrease = { ...getState().panelSize };

      act(() => {
        useAppStore.getState().decreaseCanvasSize();
      });

      const panelSizeAfterDecrease = getState().panelSize;
      expect(panelSizeAfterDecrease.width).toBeLessThan(
        panelSizeAfterIncrease.width,
      );
      expect(panelSizeAfterDecrease.height).toBeLessThan(
        panelSizeAfterIncrease.height,
      );
    });

    test('should not go below minimum canvas size level of 1.0', () => {
      const { getState } = useAppStore;

      act(() => {
        // Try to decrease canvas size many times from default
        for (let i = 0; i < 10; i++) {
          useAppStore.getState().decreaseCanvasSize();
        }
      });

      const canvasSizeLevel = getState().globalCanvasSize;
      expect(canvasSizeLevel).toBeGreaterThanOrEqual(1.0);
    });

    test('should not go below minimum panelSize of default', () => {
      const { getState } = useAppStore;
      const minWidth = UI_DIMENSIONS.DEFAULT_PANEL_SIZE.width;
      const minHeight = UI_DIMENSIONS.DEFAULT_PANEL_SIZE.height;

      act(() => {
        // Try to decrease canvas size many times from default
        for (let i = 0; i < 10; i++) {
          useAppStore.getState().decreaseCanvasSize();
        }
      });

      const panelSize = getState().panelSize;
      expect(panelSize.width).toBeGreaterThanOrEqual(minWidth);
      expect(panelSize.height).toBeGreaterThanOrEqual(minHeight);
    });

    test('canDecreaseCanvasSize should return false when at minimum canvas size', () => {
      const { getState } = useAppStore;

      expect(getState().canDecreaseCanvasSize()).toBe(false);
    });

    test('canDecreaseCanvasSize should return true when above minimum canvas size', () => {
      const { getState } = useAppStore;

      act(() => {
        useAppStore.getState().increaseCanvasSize();
      });

      expect(getState().canDecreaseCanvasSize()).toBe(true);
    });
  });

  describe('Canvas size increment', () => {
    test('should use consistent canvas size increment', () => {
      const { getState } = useAppStore;
      const initialCanvasSize = getState().globalCanvasSize;

      act(() => {
        useAppStore.getState().increaseCanvasSize();
      });

      const canvasSizeAfterOne = getState().globalCanvasSize;
      const increment1 = canvasSizeAfterOne - initialCanvasSize;

      act(() => {
        useAppStore.getState().increaseCanvasSize();
      });

      const canvasSizeAfterTwo = getState().globalCanvasSize;
      const increment2 = canvasSizeAfterTwo - canvasSizeAfterOne;

      // Increments should be the same (within floating point precision)
      expect(Math.abs(increment1 - increment2)).toBeLessThan(0.001);
    });
  });

  describe('Canvas size reset', () => {
    test('should reset canvas size level to 1.0', () => {
      const { getState } = useAppStore;

      act(() => {
        // Increase canvas size a few times
        useAppStore.getState().increaseCanvasSize();
        useAppStore.getState().increaseCanvasSize();
        useAppStore.getState().increaseCanvasSize();
      });

      expect(getState().globalCanvasSize).toBeGreaterThan(1.0);

      act(() => {
        useAppStore.getState().resetCanvasSize();
      });

      expect(getState().globalCanvasSize).toBe(1.0);
    });

    test('should reset panelSize to default', () => {
      const { getState } = useAppStore;

      act(() => {
        // Increase canvas size a few times
        useAppStore.getState().increaseCanvasSize();
        useAppStore.getState().increaseCanvasSize();
      });

      act(() => {
        useAppStore.getState().resetCanvasSize();
      });

      const panelSize = getState().panelSize;
      expect(panelSize.width).toBe(UI_DIMENSIONS.DEFAULT_PANEL_SIZE.width);
      expect(panelSize.height).toBe(UI_DIMENSIONS.DEFAULT_PANEL_SIZE.height);
    });
  });

  describe('Canvas size persistence', () => {
    test('should maintain canvas size level across panel operations', () => {
      const { getState } = useAppStore;

      act(() => {
        useAppStore.getState().increaseCanvasSize();
        useAppStore.getState().increaseCanvasSize();
      });

      const canvasSizeLevel = getState().globalCanvasSize;

      act(() => {
        useAppStore.getState().addPanel();
      });

      expect(getState().globalCanvasSize).toBe(canvasSizeLevel);
    });
  });
});
