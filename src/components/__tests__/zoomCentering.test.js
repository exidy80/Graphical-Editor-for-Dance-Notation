import { useAppStore } from '../../stores';
import { act } from '@testing-library/react';
import { UI_DIMENSIONS } from '../../utils/dimensions';

// Conceptual model:
// - There is a fixed "canvas" that is 2x the default panel size (600x600)
// - The panel is a viewport/window into this canvas
// - At 100% zoom (300x300), we see the center portion of the canvas
// - At 200% zoom (600x600), we see the entire canvas
// - Content positions are fixed on the canvas, zoom just changes viewport size
// - The viewport is always centered on the canvas

const CANVAS_SIZE = UI_DIMENSIONS.CANVAS_SIZE;

describe('Zoom Centering and Positioning', () => {
  beforeEach(() => {
    const { getState } = useAppStore;
    act(() => {
      useAppStore.setState({
        panels: [],
        selectedPanel: null,
        selectedDancer: null,
        selectedHand: null,
        selectedShapeId: null,
        globalZoomLevel: 1.0,
        panelSize: UI_DIMENSIONS.DEFAULT_PANEL_SIZE,
      });
    });
  });

  describe('Initial positioning at 100% zoom', () => {
    test('X and O markers should be positioned at center of the canvas (not panel)', () => {
      const { getState } = useAppStore;

      act(() => {
        getState().addPanel();
      });

      const panel = getState().panels[0];
      const canvasCenterX = CANVAS_SIZE.width / 2;
      const canvasCenterY = CANVAS_SIZE.height * 0.42;

      // Find stageX and stageNext markers
      const stageX = panel.shapes.find((s) => s.type === 'stageX');
      const stageNext = panel.shapes.find((s) => s.type === 'stageNext');

      expect(stageX).toBeDefined();
      expect(stageNext).toBeDefined();

      // Both should be at canvas center (absolute positions)
      expect(stageX.x).toBeCloseTo(canvasCenterX - 3, 0);
      expect(stageX.y).toBe(276); // (0.42 * 300) + 150
      expect(stageNext.x).toBeCloseTo(canvasCenterX - 3, 0);
      expect(stageNext.y).toBe(276); // (0.42 * 300) + 150
    });

    test('dancers should be positioned relative to canvas center', () => {
      const { getState } = useAppStore;

      act(() => {
        getState().addPanel();
      });

      const panel = getState().panels[0];
      const canvasCenterX = CANVAS_SIZE.width / 2;

      // Both dancers should be horizontally centered on canvas
      expect(panel.dancers[0].x).toBe(canvasCenterX);
      expect(panel.dancers[1].x).toBe(canvasCenterX);

      // Dancers should be at specific positions on canvas (panel pos + viewport offset of 150)
      expect(panel.dancers[0].y).toBe(189); // (0.13 * 300) + 150
      expect(panel.dancers[1].y).toBe(369); // (0.73 * 300) + 150
    });
  });

  describe('Positioning after zoom - content stays fixed', () => {
    test('markers maintain absolute positions when zooming in', () => {
      const { getState } = useAppStore;

      // Add panel at default zoom
      act(() => {
        getState().addPanel();
      });

      const initialPanel = getState().panels[0];
      const initialStageX = initialPanel.shapes.find(
        (s) => s.type === 'stageX',
      );
      const initialX = initialStageX.x;
      const initialY = initialStageX.y;

      // Zoom in
      act(() => {
        getState().zoomIn();
        getState().zoomIn();
      });

      const zoomedPanel = getState().panels[0];
      const zoomedStageX = zoomedPanel.shapes.find((s) => s.type === 'stageX');

      // Positions should NOT change - they're fixed on the canvas
      expect(zoomedStageX.x).toBe(initialX);
      expect(zoomedStageX.y).toBe(initialY);
    });

    test('dancers maintain absolute positions when zooming in', () => {
      const { getState } = useAppStore;

      // Add panel at default zoom
      act(() => {
        getState().addPanel();
      });

      const initialPanel = getState().panels[0];
      const initialDancer1X = initialPanel.dancers[0].x;
      const initialDancer1Y = initialPanel.dancers[0].y;
      const initialDancer2X = initialPanel.dancers[1].x;
      const initialDancer2Y = initialPanel.dancers[1].y;

      // Zoom in
      act(() => {
        getState().zoomIn();
        getState().zoomIn();
      });

      const zoomedPanel = getState().panels[0];

      // Positions should NOT change
      expect(zoomedPanel.dancers[0].x).toBe(initialDancer1X);
      expect(zoomedPanel.dancers[0].y).toBe(initialDancer1Y);
      expect(zoomedPanel.dancers[1].x).toBe(initialDancer2X);
      expect(zoomedPanel.dancers[1].y).toBe(initialDancer2Y);
    });

    test('markers maintain absolute positions when zooming out', () => {
      const { getState } = useAppStore;

      // Add panel at default zoom
      act(() => {
        getState().addPanel();
      });

      const initialPanel = getState().panels[0];
      const initialStageX = initialPanel.shapes.find(
        (s) => s.type === 'stageX',
      );
      const initialX = initialStageX.x;
      const initialY = initialStageX.y;

      // Zoom out
      act(() => {
        getState().zoomOut();
        getState().zoomOut();
      });

      const zoomedPanel = getState().panels[0];
      const zoomedStageX = zoomedPanel.shapes.find((s) => s.type === 'stageX');

      // Positions should NOT change
      expect(zoomedStageX.x).toBe(initialX);
      expect(zoomedStageX.y).toBe(initialY);
    });

    test('dancers maintain absolute positions when zooming out', () => {
      const { getState } = useAppStore;

      // Add panel at default zoom
      act(() => {
        getState().addPanel();
      });

      const initialPanel = getState().panels[0];
      const initialDancer1X = initialPanel.dancers[0].x;
      const initialDancer1Y = initialPanel.dancers[0].y;

      // Zoom out
      act(() => {
        getState().zoomOut();
        getState().zoomOut();
      });

      const zoomedPanel = getState().panels[0];

      // Positions should NOT change
      expect(zoomedPanel.dancers[0].x).toBe(initialDancer1X);
      expect(zoomedPanel.dancers[0].y).toBe(initialDancer1Y);
    });
  });

  describe('New panels created at different zoom levels', () => {
    test('new panel at zoomed level should have same absolute positions as at 100%', () => {
      const { getState } = useAppStore;

      // Create panel at 100%
      act(() => {
        getState().addPanel();
      });

      const panel100 = getState().panels[0];
      const dancer100X = panel100.dancers[0].x;
      const dancer100Y = panel100.dancers[0].y;
      const stage100X = panel100.shapes.find((s) => s.type === 'stageX').x;
      const stage100Y = panel100.shapes.find((s) => s.type === 'stageX').y;

      // Zoom in
      act(() => {
        getState().zoomIn();
        getState().zoomIn();
      });

      // Create new panel at zoomed level
      act(() => {
        getState().addPanel();
      });

      const panelZoomed = getState().panels[1];

      // New panel should have same absolute positions
      expect(panelZoomed.dancers[0].x).toBe(dancer100X);
      expect(panelZoomed.dancers[0].y).toBe(dancer100Y);
      expect(panelZoomed.shapes.find((s) => s.type === 'stageX').x).toBe(
        stage100X,
      );
      expect(panelZoomed.shapes.find((s) => s.type === 'stageX').y).toBe(
        stage100Y,
      );
    });
  });

  describe('Reset functionality', () => {
    test('reset after zoom should create panel with canvas-centered content at 100%', () => {
      const { getState } = useAppStore;

      // Zoom in
      act(() => {
        getState().zoomIn();
        getState().zoomIn();
        getState().zoomIn();
      });

      // Reset
      act(() => {
        getState().resetDancers();
      });

      const state = getState();
      const panel = state.panels[0];
      const panelSize = state.panelSize;

      // Should be back at 100% zoom
      expect(state.globalZoomLevel).toBe(1.0);
      expect(panelSize).toEqual(UI_DIMENSIONS.DEFAULT_PANEL_SIZE);

      // Content should be at canvas center positions
      const canvasCenterX = CANVAS_SIZE.width / 2;
      expect(panel.dancers[0].x).toBe(canvasCenterX);
      expect(panel.dancers[1].x).toBe(canvasCenterX);

      const stageX = panel.shapes.find((s) => s.type === 'stageX');
      expect(stageX.x).toBeCloseTo(canvasCenterX - 3, 0);
      expect(stageX.y).toBe(276); // (0.42 * 300) + 150
    });
  });
});
