import { useAppStore } from '../../stores';
import { act } from '@testing-library/react';
import { UI_DIMENSIONS } from '../../utils/dimensions';

// Conceptual model:
// - There is a fixed "canvas" that is 2x the default panel size (600x600)
// - The panel is a viewport/window into this canvas
// - At 100% canvas size (300x300), we see the center portion of the canvas
// - At 200% canvas size (600x600), we see the entire canvas
// - Content positions are fixed on the canvas, canvas size just changes viewport size
// - The viewport is always centered on the canvas

const CANVAS_SIZE = UI_DIMENSIONS.CANVAS_SIZE;

describe('Canvas Size Centering and Positioning', () => {
  beforeEach(() => {
    const { getState } = useAppStore;
    act(() => {
      useAppStore.setState({
        panels: [],
        selectedPanel: null,
        selectedDancer: null,
        selectedHand: null,
        selectedShapeId: null,
        globalCanvasSize: 1.0,
        panelSize: UI_DIMENSIONS.DEFAULT_PANEL_SIZE,
      });
    });
  });

  describe('Initial positioning at 100% canvas size', () => {
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

      // Both should be at panel visual center (absolute positions)
      expect(stageX.x).toBe(300); // Canvas center X
      expect(stageX.y).toBe(275); // Visual center Y
      expect(stageNext.x).toBe(300); // Canvas center X
      expect(stageNext.y).toBe(275); // Visual center Y
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

      // Dancers should be at positions relative to visual center
      expect(panel.dancers[0].y).toBe(185); // Visual center - dancer offset
      expect(panel.dancers[1].y).toBe(365); // Visual center + dancer offset
    });
  });

  describe('Positioning after canvas size change - content stays fixed', () => {
    test('markers maintain absolute positions when increasing canvas size', () => {
      const { getState } = useAppStore;

      // Add panel at default canvas size
      act(() => {
        getState().addPanel();
      });

      const initialPanel = getState().panels[0];
      const initialStageX = initialPanel.shapes.find(
        (s) => s.type === 'stageX',
      );
      const initialX = initialStageX.x;
      const initialY = initialStageX.y;

      // Increase canvas size
      act(() => {
        getState().increaseCanvasSize();
        getState().increaseCanvasSize();
      });

      const enlargedPanel = getState().panels[0];
      const enlargedStageX = enlargedPanel.shapes.find(
        (s) => s.type === 'stageX',
      );

      // Positions should NOT change - they're fixed on the canvas
      expect(enlargedStageX.x).toBe(initialX);
      expect(enlargedStageX.y).toBe(initialY);
    });

    test('dancers maintain absolute positions when increasing canvas size', () => {
      const { getState } = useAppStore;

      // Add panel at default canvas size
      act(() => {
        getState().addPanel();
      });

      const initialPanel = getState().panels[0];
      const initialDancer1X = initialPanel.dancers[0].x;
      const initialDancer1Y = initialPanel.dancers[0].y;
      const initialDancer2X = initialPanel.dancers[1].x;
      const initialDancer2Y = initialPanel.dancers[1].y;

      // Increase canvas size
      act(() => {
        getState().increaseCanvasSize();
        getState().increaseCanvasSize();
      });

      const enlargedPanel = getState().panels[0];

      // Positions should NOT change
      expect(enlargedPanel.dancers[0].x).toBe(initialDancer1X);
      expect(enlargedPanel.dancers[0].y).toBe(initialDancer1Y);
      expect(enlargedPanel.dancers[1].x).toBe(initialDancer2X);
      expect(enlargedPanel.dancers[1].y).toBe(initialDancer2Y);
    });

    test('markers maintain absolute positions when decreasing canvas size', () => {
      const { getState } = useAppStore;

      // Add panel at default canvas size
      act(() => {
        getState().addPanel();
      });

      const initialPanel = getState().panels[0];
      const initialStageX = initialPanel.shapes.find(
        (s) => s.type === 'stageX',
      );
      const initialX = initialStageX.x;
      const initialY = initialStageX.y;

      // Decrease canvas size
      act(() => {
        getState().decreaseCanvasSize();
        getState().decreaseCanvasSize();
      });

      const reducedPanel = getState().panels[0];
      const reducedStageX = reducedPanel.shapes.find(
        (s) => s.type === 'stageX',
      );

      // Positions should NOT change
      expect(reducedStageX.x).toBe(initialX);
      expect(reducedStageX.y).toBe(initialY);
    });

    test('dancers maintain absolute positions when decreasing canvas size', () => {
      const { getState } = useAppStore;

      // Add panel at default canvas size
      act(() => {
        getState().addPanel();
      });

      const initialPanel = getState().panels[0];
      const initialDancer1X = initialPanel.dancers[0].x;
      const initialDancer1Y = initialPanel.dancers[0].y;

      // Decrease canvas size
      act(() => {
        getState().decreaseCanvasSize();
        getState().decreaseCanvasSize();
      });

      const reducedPanel = getState().panels[0];

      // Positions should NOT change
      expect(reducedPanel.dancers[0].x).toBe(initialDancer1X);
      expect(reducedPanel.dancers[0].y).toBe(initialDancer1Y);
    });
  });

  describe('New panels created at different canvas sizes', () => {
    test('new panel at different canvas size should have same absolute positions as at 100%', () => {
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

      // Increase canvas size
      act(() => {
        getState().increaseCanvasSize();
        getState().increaseCanvasSize();
      });

      // Create new panel at increased canvas size
      act(() => {
        getState().addPanel();
      });

      const panelEnlarged = getState().panels[1];

      // New panel should have same absolute positions
      expect(panelEnlarged.dancers[0].x).toBe(dancer100X);
      expect(panelEnlarged.dancers[0].y).toBe(dancer100Y);
      expect(panelEnlarged.shapes.find((s) => s.type === 'stageX').x).toBe(
        stage100X,
      );
      expect(panelEnlarged.shapes.find((s) => s.type === 'stageX').y).toBe(
        stage100Y,
      );
    });
  });

  describe('Reset functionality', () => {
    test('reset after canvas size change should create panel with canvas-centered content at 100%', () => {
      const { getState } = useAppStore;

      // Increase canvas size
      act(() => {
        getState().increaseCanvasSize();
        getState().increaseCanvasSize();
        getState().increaseCanvasSize();
      });

      // Reset
      act(() => {
        getState().resetDancers();
      });

      const state = getState();
      const panel = state.panels[0];
      const panelSize = state.panelSize;

      // Should be back at 100% canvas size
      expect(state.globalCanvasSize).toBe(1.0);
      expect(panelSize).toEqual(UI_DIMENSIONS.DEFAULT_PANEL_SIZE);

      // Content should be at canvas center positions
      const canvasCenterX = CANVAS_SIZE.width / 2;
      expect(panel.dancers[0].x).toBe(canvasCenterX);
      expect(panel.dancers[1].x).toBe(canvasCenterX);

      const stageX = panel.shapes.find((s) => s.type === 'stageX');
      expect(stageX.x).toBe(canvasCenterX); // Visual center X
      expect(stageX.y).toBe(275); // Visual center Y
    });
  });
});
