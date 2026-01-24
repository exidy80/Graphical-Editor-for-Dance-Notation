import { act } from '@testing-library/react';
import { useAppStore } from '../../stores';
import { UI_DIMENSIONS } from '../../utils/dimensions';

describe('Global Zoom functionality', () => {
  beforeEach(() => {
    const { getState, setState } = useAppStore;
    // Reset the store to a clean state
    setState({
      panels: [],
      selectedPanel: null,
      panelSize: UI_DIMENSIONS.DEFAULT_PANEL_SIZE,
      globalZoomLevel: 1.0,
    });
  });

  describe('Zoom level state', () => {
    test('should initialize with default zoom level of 1.0', () => {
      const { getState } = useAppStore;

      const zoomLevel = getState().globalZoomLevel;
      expect(zoomLevel).toBe(1.0);
    });

    test('should have panelSize that matches default', () => {
      const { getState } = useAppStore;

      const panelSize = getState().panelSize;
      expect(panelSize.width).toBe(UI_DIMENSIONS.DEFAULT_PANEL_SIZE.width);
      expect(panelSize.height).toBe(UI_DIMENSIONS.DEFAULT_PANEL_SIZE.height);
    });
  });

  describe('Zoom in functionality', () => {
    test('should increase zoom level when zooming in', () => {
      const { getState } = useAppStore;

      act(() => {
        useAppStore.getState().zoomIn();
      });

      const zoomLevel = getState().globalZoomLevel;
      expect(zoomLevel).toBeGreaterThan(1.0);
    });

    test('should increase panelSize when zooming in', () => {
      const { getState } = useAppStore;
      const initialPanelSize = { ...getState().panelSize };

      act(() => {
        useAppStore.getState().zoomIn();
      });

      const newPanelSize = getState().panelSize;
      expect(newPanelSize.width).toBeGreaterThan(initialPanelSize.width);
      expect(newPanelSize.height).toBeGreaterThan(initialPanelSize.height);
    });

    test('should not exceed maximum zoom level of 2.0', () => {
      const { getState } = useAppStore;

      act(() => {
        // Try to zoom in many times
        for (let i = 0; i < 20; i++) {
          useAppStore.getState().zoomIn();
        }
      });

      const zoomLevel = getState().globalZoomLevel;
      expect(zoomLevel).toBeLessThanOrEqual(2.0);
    });

    test('should not exceed maximum panelSize of double default', () => {
      const { getState } = useAppStore;
      const maxWidth = UI_DIMENSIONS.DEFAULT_PANEL_SIZE.width * 2;
      const maxHeight = UI_DIMENSIONS.DEFAULT_PANEL_SIZE.height * 2;

      act(() => {
        // Try to zoom in many times
        for (let i = 0; i < 20; i++) {
          useAppStore.getState().zoomIn();
        }
      });

      const panelSize = getState().panelSize;
      expect(panelSize.width).toBeLessThanOrEqual(maxWidth);
      expect(panelSize.height).toBeLessThanOrEqual(maxHeight);
    });

    test('canZoomIn should return false when at maximum zoom', () => {
      const { getState } = useAppStore;

      act(() => {
        // Zoom to maximum
        for (let i = 0; i < 20; i++) {
          useAppStore.getState().zoomIn();
        }
      });

      expect(getState().canZoomIn()).toBe(false);
    });

    test('canZoomIn should return true when below maximum zoom', () => {
      const { getState } = useAppStore;

      expect(getState().canZoomIn()).toBe(true);
    });
  });

  describe('Zoom out functionality', () => {
    test('should decrease zoom level when zooming out from above 1.0', () => {
      const { getState } = useAppStore;

      act(() => {
        // First zoom in
        useAppStore.getState().zoomIn();
        useAppStore.getState().zoomIn();
      });

      const zoomAfterIn = getState().globalZoomLevel;

      act(() => {
        useAppStore.getState().zoomOut();
      });

      const zoomAfterOut = getState().globalZoomLevel;
      expect(zoomAfterOut).toBeLessThan(zoomAfterIn);
    });

    test('should decrease panelSize when zooming out from above 1.0', () => {
      const { getState } = useAppStore;

      act(() => {
        // First zoom in
        useAppStore.getState().zoomIn();
        useAppStore.getState().zoomIn();
      });

      const panelSizeAfterIn = { ...getState().panelSize };

      act(() => {
        useAppStore.getState().zoomOut();
      });

      const panelSizeAfterOut = getState().panelSize;
      expect(panelSizeAfterOut.width).toBeLessThan(panelSizeAfterIn.width);
      expect(panelSizeAfterOut.height).toBeLessThan(panelSizeAfterIn.height);
    });

    test('should not go below minimum zoom level of 1.0', () => {
      const { getState } = useAppStore;

      act(() => {
        // Try to zoom out many times from default
        for (let i = 0; i < 10; i++) {
          useAppStore.getState().zoomOut();
        }
      });

      const zoomLevel = getState().globalZoomLevel;
      expect(zoomLevel).toBeGreaterThanOrEqual(1.0);
    });

    test('should not go below minimum panelSize of default', () => {
      const { getState } = useAppStore;
      const minWidth = UI_DIMENSIONS.DEFAULT_PANEL_SIZE.width;
      const minHeight = UI_DIMENSIONS.DEFAULT_PANEL_SIZE.height;

      act(() => {
        // Try to zoom out many times from default
        for (let i = 0; i < 10; i++) {
          useAppStore.getState().zoomOut();
        }
      });

      const panelSize = getState().panelSize;
      expect(panelSize.width).toBeGreaterThanOrEqual(minWidth);
      expect(panelSize.height).toBeGreaterThanOrEqual(minHeight);
    });

    test('canZoomOut should return false when at minimum zoom', () => {
      const { getState } = useAppStore;

      expect(getState().canZoomOut()).toBe(false);
    });

    test('canZoomOut should return true when above minimum zoom', () => {
      const { getState } = useAppStore;

      act(() => {
        useAppStore.getState().zoomIn();
      });

      expect(getState().canZoomOut()).toBe(true);
    });
  });

  describe('Zoom increment', () => {
    test('should use consistent zoom increment', () => {
      const { getState } = useAppStore;
      const initialZoom = getState().globalZoomLevel;

      act(() => {
        useAppStore.getState().zoomIn();
      });

      const zoomAfterOne = getState().globalZoomLevel;
      const increment1 = zoomAfterOne - initialZoom;

      act(() => {
        useAppStore.getState().zoomIn();
      });

      const zoomAfterTwo = getState().globalZoomLevel;
      const increment2 = zoomAfterTwo - zoomAfterOne;

      // Increments should be the same (within floating point precision)
      expect(Math.abs(increment1 - increment2)).toBeLessThan(0.001);
    });
  });

  describe('Zoom reset', () => {
    test('should reset zoom level to 1.0', () => {
      const { getState } = useAppStore;

      act(() => {
        // Zoom in a few times
        useAppStore.getState().zoomIn();
        useAppStore.getState().zoomIn();
        useAppStore.getState().zoomIn();
      });

      expect(getState().globalZoomLevel).toBeGreaterThan(1.0);

      act(() => {
        useAppStore.getState().resetZoom();
      });

      expect(getState().globalZoomLevel).toBe(1.0);
    });

    test('should reset panelSize to default', () => {
      const { getState } = useAppStore;

      act(() => {
        // Zoom in a few times
        useAppStore.getState().zoomIn();
        useAppStore.getState().zoomIn();
      });

      act(() => {
        useAppStore.getState().resetZoom();
      });

      const panelSize = getState().panelSize;
      expect(panelSize.width).toBe(UI_DIMENSIONS.DEFAULT_PANEL_SIZE.width);
      expect(panelSize.height).toBe(UI_DIMENSIONS.DEFAULT_PANEL_SIZE.height);
    });
  });

  describe('Zoom persistence', () => {
    test('should maintain zoom level across panel operations', () => {
      const { getState } = useAppStore;

      act(() => {
        useAppStore.getState().zoomIn();
        useAppStore.getState().zoomIn();
      });

      const zoomLevel = getState().globalZoomLevel;

      act(() => {
        useAppStore.getState().addPanel();
      });

      expect(getState().globalZoomLevel).toBe(zoomLevel);
    });
  });
});
