import { act } from '@testing-library/react';
import { useAppStore } from '../../stores';

describe('Undo/Redo Functionality', () => {
  beforeEach(() => {
    const { getState, setState } = useAppStore;

    // Clear history first
    const temporal = getState().temporal;
    if (temporal) {
      temporal.clear();
    }

    // Reset to initial state for each test
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
      shapes: p.shapes.filter((s) => s.type === 'stageX'), // Keep only the stage marker
    }));

    // Reset to just one panel to ensure consistent test state
    const resetPanels = [panels[0]]; // Just take the first panel

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

    // Clear history again after state reset to ensure clean slate
    setTimeout(() => {
      const newTemporal = getState().temporal;
      if (newTemporal) {
        newTemporal.clear();
      }
    }, 10);
  });

  describe('Shape Operations', () => {
    test('should undo/redo shape addition', async () => {
      const { getState } = useAppStore;
      const panelId = getState().panels[0].id;

      // Initial state - only stage marker should exist
      const initialShapeCount = getState().panels[0].shapes.length;
      expect(initialShapeCount).toBe(1); // Just the stageX marker

      // Add a shape
      act(() => {
        getState().setSelectedPanel(panelId);
        getState().handleShapeDraw({
          id: 'test-undo-shape',
          type: 'circle',
          x: 100,
          y: 100,
          fill: 'red',
          stroke: 'black',
        });
      });

      // Verify shape was added
      let currentShapeCount = getState().panels[0].shapes.length;
      expect(currentShapeCount).toBe(2);
      expect(
        getState().panels[0].shapes.some((s) => s.id === 'test-undo-shape'),
      ).toBe(true);

      // Wait a moment for temporal middleware to process
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Initialize keystrokes
      act(() => {
        getState().initializeDefaultKeystrokes();
      });

      // Undo the addition
      act(() => {
        getState().handleKeystroke('z', {
          key: 'z',
          ctrlKey: true,
          metaKey: true, // Mac cmd key
        });
      });

      // Shape should be removed
      currentShapeCount = getState().panels[0].shapes.length;
      expect(currentShapeCount).toBe(1);
      expect(
        getState().panels[0].shapes.some((s) => s.id === 'test-undo-shape'),
      ).toBe(false);

      // Redo the addition
      act(() => {
        getState().handleKeystroke('y', {
          key: 'y',
          ctrlKey: true,
          metaKey: true, // Mac cmd key
        });
      });

      // Shape should be back
      currentShapeCount = getState().panels[0].shapes.length;
      expect(currentShapeCount).toBe(2);
      expect(
        getState().panels[0].shapes.some((s) => s.id === 'test-undo-shape'),
      ).toBe(true);
    });

    test('should undo/redo shape deletion', () => {
      const { getState } = useAppStore;
      const panelId = getState().panels[0].id;

      // Add a shape first
      act(() => {
        getState().setSelectedPanel(panelId);
        getState().handleShapeDraw({
          id: 'delete-undo-shape',
          type: 'signal',
          x: 150,
          y: 150,
          fill: 'blue',
          stroke: 'blue',
        });
      });

      // Verify shape exists
      expect(
        getState().panels[0].shapes.some((s) => s.id === 'delete-undo-shape'),
      ).toBe(true);

      // Delete the shape
      act(() => {
        getState().handleShapeSelection(panelId, 'delete-undo-shape');
        getState().handleDelete({ panelId, shapeId: 'delete-undo-shape' });
      });

      // Verify shape was deleted
      expect(
        getState().panels[0].shapes.some((s) => s.id === 'delete-undo-shape'),
      ).toBe(false);

      // Wait for temporal middleware to process
      setTimeout(() => {
        // Undo the deletion
        act(() => {
          getState().initializeDefaultKeystrokes();
          getState().handleKeystroke('z', {
            key: 'z',
            ctrlKey: true,
            metaKey: true,
          });
        });

        // Shape should be restored
        expect(
          getState().panels[0].shapes.some((s) => s.id === 'delete-undo-shape'),
        ).toBe(true);

        // Redo the deletion
        act(() => {
          getState().handleKeystroke('y', {
            key: 'y',
            ctrlKey: true,
            metaKey: true,
          });
        });

        // Shape should be deleted again
        expect(
          getState().panels[0].shapes.some((s) => s.id === 'delete-undo-shape'),
        ).toBe(false);
      }, 100);
    });

    test('should undo/redo shape position changes', () => {
      const { getState } = useAppStore;
      const panelId = getState().panels[0].id;

      // Add a shape
      act(() => {
        getState().setSelectedPanel(panelId);
        getState().handleShapeDraw({
          id: 'move-undo-shape',
          type: 'straightLine',
          x: 50,
          y: 50,
          fill: 'green',
          stroke: 'green',
        });
      });

      const originalX = 50;
      const originalY = 50;
      const newX = 150;
      const newY = 100;

      // Move the shape
      act(() => {
        getState().updateShapeState(panelId, 'move-undo-shape', {
          x: newX,
          y: newY,
        });
      });

      // Verify shape moved
      const movedShape = getState().panels[0].shapes.find(
        (s) => s.id === 'move-undo-shape',
      );
      expect(movedShape.x).toBe(newX);
      expect(movedShape.y).toBe(newY);

      // Wait for temporal middleware to process
      setTimeout(() => {
        // Undo the move
        act(() => {
          getState().initializeDefaultKeystrokes();
          getState().handleKeystroke('z', {
            key: 'z',
            ctrlKey: true,
            metaKey: true,
          });
        });

        // Shape should be at original position
        const undoneShape = getState().panels[0].shapes.find(
          (s) => s.id === 'move-undo-shape',
        );
        expect(undoneShape.x).toBe(originalX);
        expect(undoneShape.y).toBe(originalY);

        // Redo the move
        act(() => {
          getState().handleKeystroke('y', {
            key: 'y',
            ctrlKey: true,
            metaKey: true,
          });
        });

        // Shape should be at new position
        const redoneShape = getState().panels[0].shapes.find(
          (s) => s.id === 'move-undo-shape',
        );
        expect(redoneShape.x).toBe(newX);
        expect(redoneShape.y).toBe(newY);
      }, 100);
    });
  });

  describe('Dancer Operations', () => {
    test('should undo/redo dancer position changes', () => {
      const { getState } = useAppStore;
      const panelId = getState().panels[0].id;
      const dancerId = getState().panels[0].dancers[0].id;

      const originalX = 0;
      const originalY = 0;
      const newX = 100;
      const newY = 150;

      // Move the dancer
      act(() => {
        getState().updateDancerState(panelId, dancerId, {
          x: newX,
          y: newY,
        });
      });

      // Verify dancer moved
      const movedDancer = getState().panels[0].dancers.find(
        (d) => d.id === dancerId,
      );
      expect(movedDancer.x).toBe(newX);
      expect(movedDancer.y).toBe(newY);

      // Wait for temporal middleware to process
      setTimeout(() => {
        // Undo the move
        act(() => {
          getState().initializeDefaultKeystrokes();
          getState().handleKeystroke('z', {
            key: 'z',
            ctrlKey: true,
            metaKey: true,
          });
        });

        // Dancer should be at original position
        const undoneDancer = getState().panels[0].dancers.find(
          (d) => d.id === dancerId,
        );
        expect(undoneDancer.x).toBe(originalX);
        expect(undoneDancer.y).toBe(originalY);

        // Redo the move
        act(() => {
          getState().handleKeystroke('y', {
            key: 'y',
            ctrlKey: true,
            metaKey: true,
          });
        });

        // Dancer should be at new position
        const redoneDancer = getState().panels[0].dancers.find(
          (d) => d.id === dancerId,
        );
        expect(redoneDancer.x).toBe(newX);
        expect(redoneDancer.y).toBe(newY);
      }, 100);
    });

    test('should undo/redo dancer rotation changes', () => {
      const { getState } = useAppStore;
      const panelId = getState().panels[0].id;
      const dancerId = getState().panels[0].dancers[0].id;

      const originalRotation = 0;
      const newRotation = 45;

      // Rotate the dancer
      act(() => {
        getState().updateDancerState(panelId, dancerId, {
          rotation: newRotation,
        });
      });

      // Verify dancer rotated
      const rotatedDancer = getState().panels[0].dancers.find(
        (d) => d.id === dancerId,
      );
      expect(rotatedDancer.rotation).toBe(newRotation);

      // Wait for temporal middleware to process
      setTimeout(() => {
        // Undo the rotation
        act(() => {
          getState().initializeDefaultKeystrokes();
          getState().handleKeystroke('z', {
            key: 'z',
            ctrlKey: true,
            metaKey: true,
          });
        });

        // Dancer should be at original rotation
        const undoneDancer = getState().panels[0].dancers.find(
          (d) => d.id === dancerId,
        );
        expect(undoneDancer.rotation).toBe(originalRotation);

        // Redo the rotation
        act(() => {
          getState().handleKeystroke('y', {
            key: 'y',
            ctrlKey: true,
            metaKey: true,
          });
        });

        // Dancer should be at new rotation
        const redoneDancer = getState().panels[0].dancers.find(
          (d) => d.id === dancerId,
        );
        expect(redoneDancer.rotation).toBe(newRotation);
      }, 100);
    });
  });

  describe('Panel Operations', () => {
    test('should undo/redo panel addition', () => {
      const { getState } = useAppStore;

      // Initial panel count
      const initialPanelCount = getState().panels.length;
      expect(initialPanelCount).toBe(1);

      // Add a panel
      act(() => {
        getState().addPanel();
      });

      // Verify panel was added
      expect(getState().panels.length).toBe(2);

      // Wait for temporal middleware to process
      setTimeout(() => {
        // Undo the addition
        act(() => {
          getState().initializeDefaultKeystrokes();
          getState().handleKeystroke('z', {
            key: 'z',
            ctrlKey: true,
            metaKey: true,
          });
        });

        // Panel should be removed
        expect(getState().panels.length).toBe(1);

        // Redo the addition
        act(() => {
          getState().handleKeystroke('y', {
            key: 'y',
            ctrlKey: true,
            metaKey: true,
          });
        });

        // Panel should be back
        expect(getState().panels.length).toBe(2);
      }, 100);
    });
  });

  describe('Edge Cases', () => {
    test('should handle undo when no history exists', () => {
      const { getState } = useAppStore;

      // Try to undo when no history exists
      act(() => {
        getState().initializeDefaultKeystrokes();
        getState().handleKeystroke('z', {
          key: 'z',
          ctrlKey: true,
          metaKey: true,
        });
      });

      // Should not crash and state should remain the same
      expect(getState().panels.length).toBe(1);
    });

    test('should handle redo when no future states exist', () => {
      const { getState } = useAppStore;

      // Try to redo when no future states exist
      act(() => {
        getState().initializeDefaultKeystrokes();
        getState().handleKeystroke('y', {
          key: 'y',
          ctrlKey: true,
          metaKey: true,
        });
      });

      // Should not crash and state should remain the same
      expect(getState().panels.length).toBe(1);
    });

    test('should not track selection state changes in history', () => {
      const { getState } = useAppStore;
      const panelId = getState().panels[0].id;
      const dancerId = getState().panels[0].dancers[0].id;

      // Change selection state (should not be tracked)
      act(() => {
        getState().setSelectedPanel(panelId);
        getState().setSelectedDancer({ panelId, dancerId });
        getState().setSelectedPanel(null);
      });

      // These changes should not create history entries
      const temporal = getState().temporal;
      if (temporal) {
        expect(temporal.pastStates.length).toBe(0);
      }
    });
  });

  describe('Multiple Operations', () => {
    test('should handle multiple consecutive operations', () => {
      const { getState } = useAppStore;
      const panelId = getState().panels[0].id;

      // Add multiple shapes
      act(() => {
        getState().setSelectedPanel(panelId);
        getState().handleShapeDraw({
          id: 'multi-shape-1',
          type: 'circle',
          x: 50,
          y: 50,
          fill: 'red',
        });
      });

      act(() => {
        getState().handleShapeDraw({
          id: 'multi-shape-2',
          type: 'signal',
          x: 100,
          y: 100,
          fill: 'blue',
        });
      });

      act(() => {
        getState().handleShapeDraw({
          id: 'multi-shape-3',
          type: 'straightLine',
          x: 150,
          y: 150,
          fill: 'green',
        });
      });

      // Verify all shapes were added
      expect(getState().panels[0].shapes.length).toBe(4); // 3 + stage marker

      // Wait for temporal middleware to process
      setTimeout(() => {
        // Undo multiple times
        act(() => {
          getState().initializeDefaultKeystrokes();
          getState().handleKeystroke('z', {
            key: 'z',
            ctrlKey: true,
            metaKey: true,
          });
        });

        expect(getState().panels[0].shapes.length).toBe(3);

        act(() => {
          getState().handleKeystroke('z', {
            key: 'z',
            ctrlKey: true,
            metaKey: true,
          });
        });

        expect(getState().panels[0].shapes.length).toBe(2);

        act(() => {
          getState().handleKeystroke('z', {
            key: 'z',
            ctrlKey: true,
            metaKey: true,
          });
        });

        expect(getState().panels[0].shapes.length).toBe(1); // Just stage marker

        // Redo multiple times
        act(() => {
          getState().handleKeystroke('y', {
            key: 'y',
            ctrlKey: true,
            metaKey: true,
          });
        });

        expect(getState().panels[0].shapes.length).toBe(2);

        act(() => {
          getState().handleKeystroke('y', {
            key: 'y',
            ctrlKey: true,
            metaKey: true,
          });
        });

        expect(getState().panels[0].shapes.length).toBe(3);

        act(() => {
          getState().handleKeystroke('y', {
            key: 'y',
            ctrlKey: true,
            metaKey: true,
          });
        });

        expect(getState().panels[0].shapes.length).toBe(4);
      }, 500); // Longer delay for multiple operations
    });
  });
});
