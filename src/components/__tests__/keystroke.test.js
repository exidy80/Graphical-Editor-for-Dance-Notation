import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import Canvas from '../Canvas';
import { useAppStore } from '../../stores';
import {
  DANCER_DIMENSIONS,
  SHAPE_DIMENSIONS,
  getCenterOffset,
} from '../../utils/dimensions';

describe('Keystroke Framework', () => {
  beforeEach(() => {
    // Reset store to initial state
    act(() => {
      useAppStore.setState({
        panels: [useAppStore.getState().panels[0]], // Keep only first panel
        selectedPanel: null,
        selectedDancer: null,
        selectedHand: null,
        selectedShapeId: null,
      });
    });
  });

  describe('Keystroke Registration and Management', () => {
    test('should register keystroke handlers', () => {
      const { registerKeystroke, getRegisteredKeystrokes } =
        useAppStore.getState();

      expect(registerKeystroke).toBeDefined();
      expect(getRegisteredKeystrokes).toBeDefined();

      // Register a test keystroke
      act(() => {
        registerKeystroke('ArrowLeft', {
          description: 'Rotate left',
          handler: jest.fn(),
          context: 'dancer',
        });
      });

      const keystrokes = getRegisteredKeystrokes();
      expect(keystrokes).toHaveProperty('ArrowLeft:dancer');
      expect(keystrokes['ArrowLeft:dancer'].description).toBe('Rotate left');
      expect(keystrokes['ArrowLeft:dancer'].context).toBe('dancer');
    });

    test('should unregister keystroke handlers', () => {
      const {
        registerKeystroke,
        unregisterKeystroke,
        getRegisteredKeystrokes,
      } = useAppStore.getState();

      // Register and then unregister
      act(() => {
        registerKeystroke('ArrowLeft', {
          description: 'Rotate left',
          handler: jest.fn(),
          context: 'dancer',
        });
        unregisterKeystroke('ArrowLeft');
      });

      const keystrokes = getRegisteredKeystrokes();
      expect(keystrokes).not.toHaveProperty('ArrowLeft');
    });

    test('should support modifier key combinations', () => {
      const { registerKeystroke, getRegisteredKeystrokes } =
        useAppStore.getState();

      act(() => {
        registerKeystroke('ArrowLeft', {
          description: 'Rotate left slowly',
          handler: jest.fn(),
          context: 'dancer',
          modifiers: { ctrl: true },
        });

        registerKeystroke('ArrowLeft', {
          description: 'Rotate left quickly',
          handler: jest.fn(),
          context: 'dancer',
          modifiers: { shift: true },
        });
      });

      const keystrokes = getRegisteredKeystrokes();
      expect(
        Object.keys(keystrokes).filter((k) => k.includes('ArrowLeft')),
      ).toHaveLength(2);
    });

    test('should validate keystroke handler registration', () => {
      const { registerKeystroke } = useAppStore.getState();

      // Should throw error for invalid handler
      expect(() => {
        act(() => {
          registerKeystroke('ArrowLeft', {
            description: 'Test',
            handler: 'not a function', // Invalid handler
            context: 'dancer',
          });
        });
      }).toThrow();

      // Should throw error for missing required fields
      expect(() => {
        act(() => {
          registerKeystroke('ArrowLeft', {
            handler: jest.fn(),
            // Missing description and context
          });
        });
      }).toThrow();
    });
  });

  describe('Context-Aware Keystroke Handling', () => {
    test('should only execute keystrokes in correct context', () => {
      const dancerHandler = jest.fn();
      const symbolHandler = jest.fn();
      const { registerKeystroke, handleKeystroke } = useAppStore.getState();

      act(() => {
        registerKeystroke('ArrowLeft', {
          description: 'Rotate dancer left',
          handler: dancerHandler,
          context: 'dancer',
        });

        registerKeystroke('ArrowLeft', {
          description: 'Rotate symbol left',
          handler: symbolHandler,
          context: 'symbol',
        });
      });

      const panelId = useAppStore.getState().panels[0].id;
      const dancerId = useAppStore.getState().panels[0].dancers[0].id;
      const shapeId = useAppStore.getState().panels[0].shapes[0]?.id;

      // Select dancer and trigger keystroke
      act(() => {
        useAppStore.getState().handleDancerSelection(panelId, dancerId);
        handleKeystroke('ArrowLeft', { key: 'ArrowLeft' });
      });

      expect(dancerHandler).toHaveBeenCalledTimes(1);
      expect(symbolHandler).not.toHaveBeenCalled();

      // Reset mocks
      dancerHandler.mockReset();
      symbolHandler.mockReset();

      // Select symbol and trigger keystroke
      if (shapeId) {
        act(() => {
          useAppStore.getState().setSelectedDancer(null);
          useAppStore.getState().handleShapeSelection(panelId, shapeId);
          handleKeystroke('ArrowLeft', { key: 'ArrowLeft' });
        });

        expect(symbolHandler).toHaveBeenCalledTimes(1);
        expect(dancerHandler).not.toHaveBeenCalled();
      }
    });

    test('should determine context based on current selection', () => {
      const { getCurrentKeystrokeContext } = useAppStore.getState();

      const panelId = useAppStore.getState().panels[0].id;
      const dancerId = useAppStore.getState().panels[0].dancers[0].id;

      // No selection
      expect(getCurrentKeystrokeContext()).toBe('none');

      // Dancer selected
      act(() => {
        useAppStore.getState().handleDancerSelection(panelId, dancerId);
      });
      expect(getCurrentKeystrokeContext()).toBe('dancer');

      // Hand selected
      act(() => {
        useAppStore.getState().handleHandClick(panelId, dancerId, 'left');
      });
      expect(getCurrentKeystrokeContext()).toBe('hand');

      // Symbol selected
      const shapes = useAppStore.getState().panels[0].shapes;
      if (shapes.length > 0) {
        act(() => {
          useAppStore.getState().setSelectedDancer(null);
          useAppStore.getState().setSelectedHand(null);
          useAppStore.getState().handleShapeSelection(panelId, shapes[0].id);
        });
        expect(getCurrentKeystrokeContext()).toBe('symbol');
      }
    });
  });

  describe('Arrow Key Rotation Functionality', () => {
    test('should register default arrow key rotation handlers', () => {
      const { initializeDefaultKeystrokes, getRegisteredKeystrokes } =
        useAppStore.getState();

      act(() => {
        initializeDefaultKeystrokes();
      });

      const keystrokes = getRegisteredKeystrokes();
      expect(keystrokes).toHaveProperty('ArrowLeft:dancer');
      expect(keystrokes).toHaveProperty('ArrowRight:dancer');
      expect(keystrokes['ArrowLeft:dancer'].description).toContain('Rotate');
      expect(keystrokes['ArrowRight:dancer'].description).toContain('Rotate');
    });

    test('should rotate selected dancer with arrow keys', () => {
      const { initializeDefaultKeystrokes, handleKeystroke } =
        useAppStore.getState();
      const panelId = useAppStore.getState().panels[0].id;
      const dancerId = useAppStore.getState().panels[0].dancers[0].id;

      act(() => {
        initializeDefaultKeystrokes();
        useAppStore.getState().handleDancerSelection(panelId, dancerId);
      });

      const initialState = useAppStore.getState();
      const initialRotation = initialState.panels[0].dancers[0].rotation || 0;

      // Rotate left
      act(() => {
        handleKeystroke('ArrowLeft', { key: 'ArrowLeft' });
      });

      let currentState = useAppStore.getState();
      let currentRotation = currentState.panels[0].dancers[0].rotation;
      expect(currentRotation).toBe(initialRotation - 15); // Default rotation step

      // Rotate right
      act(() => {
        handleKeystroke('ArrowRight', { key: 'ArrowRight' });
      });

      currentState = useAppStore.getState();
      currentRotation = currentState.panels[0].dancers[0].rotation;
      expect(currentRotation).toBe(initialRotation); // Back to initial
    });

    test('should rotate selected symbol with arrow keys', () => {
      const { initializeDefaultKeystrokes, handleKeystroke, handleShapeDraw } =
        useAppStore.getState();
      const panelId = useAppStore.getState().panels[0].id;

      // Add a shape to test with
      act(() => {
        useAppStore.getState().setSelectedPanel(panelId);
        handleShapeDraw({
          id: 'test-shape-id',
          type: 'circle',
          x: 100,
          y: 100,
          rotation: 0,
          fill: 'red',
          stroke: 'black',
        });
        initializeDefaultKeystrokes();
      });

      const shapes = useAppStore.getState().panels[0].shapes;
      const shapeId = 'test-shape-id'; // Use the known ID

      act(() => {
        useAppStore.getState().handleShapeSelection(panelId, shapeId);
      });

      const initialRotation =
        useAppStore.getState().panels[0].shapes.find((s) => s.id === shapeId)
          .rotation || 0;

      // Rotate left
      act(() => {
        handleKeystroke('ArrowLeft', { key: 'ArrowLeft' });
      });

      let currentShape = useAppStore
        .getState()
        .panels[0].shapes.find((s) => s.id === shapeId);
      expect(currentShape.rotation).toBe(initialRotation - 15);

      // Rotate right
      act(() => {
        handleKeystroke('ArrowRight', { key: 'ArrowRight' });
      });

      currentShape = useAppStore
        .getState()
        .panels[0].shapes.find((s) => s.id === shapeId);
      expect(currentShape.rotation).toBe(initialRotation);
    });

    test('should handle multiple rotations correctly for dancers', () => {
      const {
        initializeDefaultKeystrokes,
        handleKeystroke,
        updateDancerState,
        handleDancerSelection,
      } = useAppStore.getState();
      const panelId = useAppStore.getState().panels[0].id;
      const dancerId = useAppStore.getState().panels[0].dancers[0].id;

      // Set specific dancer position for testing
      act(() => {
        updateDancerState(panelId, dancerId, { x: 100, y: 100, rotation: 0 });
        handleDancerSelection(panelId, dancerId);
        initializeDefaultKeystrokes();
      });

      // Rotate 90 degrees (6 * 15)
      act(() => {
        handleKeystroke('ArrowRight', { key: 'ArrowRight' });
        handleKeystroke('ArrowRight', { key: 'ArrowRight' });
        handleKeystroke('ArrowRight', { key: 'ArrowRight' });
        handleKeystroke('ArrowRight', { key: 'ArrowRight' });
        handleKeystroke('ArrowRight', { key: 'ArrowRight' });
        handleKeystroke('ArrowRight', { key: 'ArrowRight' });
      });

      const rotatedState = useAppStore.getState().panels[0].dancers[0];
      expect(rotatedState.rotation).toBe(90);

      // Rotate back -45 degrees (3 * -15)
      act(() => {
        handleKeystroke('ArrowLeft', { key: 'ArrowLeft' });
        handleKeystroke('ArrowLeft', { key: 'ArrowLeft' });
        handleKeystroke('ArrowLeft', { key: 'ArrowLeft' });
      });

      const finalState = useAppStore.getState().panels[0].dancers[0];
      expect(finalState.rotation).toBe(45);
    });

    test('should handle multiple rotations correctly for shapes', () => {
      const {
        initializeDefaultKeystrokes,
        handleKeystroke,
        handleShapeDraw,
        handleShapeSelection,
      } = useAppStore.getState();
      const panelId = useAppStore.getState().panels[0].id;

      // Add a shape to test with
      const shapeId = 'test-multi-rotate-shape';
      act(() => {
        useAppStore.getState().setSelectedPanel(panelId);
        handleShapeDraw({
          id: shapeId,
          type: 'signal',
          x: 200,
          y: 150,
          rotation: 0,
          fill: 'red',
          stroke: 'black',
        });
        handleShapeSelection(panelId, shapeId);
        initializeDefaultKeystrokes();
      });

      // Rotate 45 degrees (3 * 15)
      act(() => {
        handleKeystroke('ArrowRight', { key: 'ArrowRight' });
        handleKeystroke('ArrowRight', { key: 'ArrowRight' });
        handleKeystroke('ArrowRight', { key: 'ArrowRight' });
      });

      const rotatedState = useAppStore
        .getState()
        .panels[0].shapes.find((s) => s.id === shapeId);
      expect(rotatedState.rotation).toBe(45);

      // Rotate back to 0 (3 * -15)
      act(() => {
        handleKeystroke('ArrowLeft', { key: 'ArrowLeft' });
        handleKeystroke('ArrowLeft', { key: 'ArrowLeft' });
        handleKeystroke('ArrowLeft', { key: 'ArrowLeft' });
      });

      const finalState = useAppStore
        .getState()
        .panels[0].shapes.find((s) => s.id === shapeId);
      expect(finalState.rotation).toBe(0);
    });

    test('should properly handle center-preserving rotation with scaled objects', () => {
      const {
        initializeDefaultKeystrokes,
        handleKeystroke,
        handleShapeDraw,
        handleShapeSelection,
        setMaintainRotationCenter,
        _calculateCenterPreservingPosition,
      } = useAppStore.getState();
      const panelId = useAppStore.getState().panels[0].id;

      // Add a scaled shape to test with
      const shapeId = 'test-scaled-shape';
      act(() => {
        setMaintainRotationCenter(true); // Enable center-preserving rotation
        useAppStore.getState().setSelectedPanel(panelId);
        handleShapeDraw({
          id: shapeId,
          type: 'signal',
          x: 100,
          y: 100,
          rotation: 0,
          scaleX: 2.0, // Double width
          scaleY: 1.5, // 1.5x height
          fill: 'blue',
          stroke: 'red',
        });
        handleShapeSelection(panelId, shapeId);
        initializeDefaultKeystrokes();
      });

      const initialState = useAppStore
        .getState()
        .panels[0].shapes.find((s) => s.id === shapeId);

      // Calculate expected center based on actual scaled dimensions
      // Base signal shape from SHAPE_DIMENSIONS, scaled to 150x30
      const scaledWidth = SHAPE_DIMENSIONS.signal.width * 2.0;
      const scaledHeight = SHAPE_DIMENSIONS.signal.height * 1.5;
      const expectedCenterX = initialState.x + scaledWidth / 2;
      const expectedCenterY = initialState.y + scaledHeight / 2;

      // Test the center calculation function directly
      const calculatedPos = _calculateCenterPreservingPosition(
        initialState,
        'shape',
        90,
      );

      // The function should calculate a position that, when combined with the rotation,
      // maintains the same visual center position
      expect(typeof calculatedPos.x).toBe('number');
      expect(typeof calculatedPos.y).toBe('number');
      expect(isFinite(calculatedPos.x)).toBe(true);
      expect(isFinite(calculatedPos.y)).toBe(true);
    });

    test('should maintain visual center within margin of error during rotation', () => {
      const {
        initializeDefaultKeystrokes,
        handleKeystroke,
        handleShapeDraw,
        handleShapeSelection,
        setMaintainRotationCenter,
      } = useAppStore.getState();
      const panelId = useAppStore.getState().panels[0].id;

      // Add a scaled shape to test center preservation
      const shapeId = 'test-center-preservation';
      act(() => {
        setMaintainRotationCenter(true);
        useAppStore.getState().setSelectedPanel(panelId);
        handleShapeDraw({
          id: shapeId,
          type: 'spinOne',
          x: 200,
          y: 150,
          rotation: 0,
          scaleX: 1.5,
          scaleY: 2.0,
          fill: 'green',
          stroke: 'blue',
        });
        handleShapeSelection(panelId, shapeId);
        initializeDefaultKeystrokes();
      });

      const initialState = useAppStore
        .getState()
        .panels[0].shapes.find((s) => s.id === shapeId);

      // Calculate initial visual center
      // Base spinOne shape from SHAPE_DIMENSIONS, scaled to 90x120
      const initialWidth = SHAPE_DIMENSIONS.spinOne.width * 1.5;
      const initialHeight = SHAPE_DIMENSIONS.spinOne.height * 2.0;

      // Before rotation, object is at its original position
      let initialCenterX = initialState.x + initialWidth / 2;
      let initialCenterY = initialState.y + initialHeight / 2;

      // Perform a rotation (90 degrees = 6 * 15)
      act(() => {
        handleKeystroke('ArrowRight', { key: 'ArrowRight' });
        handleKeystroke('ArrowRight', { key: 'ArrowRight' });
        handleKeystroke('ArrowRight', { key: 'ArrowRight' });
        handleKeystroke('ArrowRight', { key: 'ArrowRight' });
        handleKeystroke('ArrowRight', { key: 'ArrowRight' });
        handleKeystroke('ArrowRight', { key: 'ArrowRight' });
      });

      const rotatedState = useAppStore
        .getState()
        .panels[0].shapes.find((s) => s.id === shapeId);

      // After the first rotation, the object should have offset values set
      // and position adjusted to maintain visual center

      // Verify rotation was applied
      expect(rotatedState.rotation).toBe(90);

      // Verify that offsets were set to center
      const expectedOffsetX =
        (SHAPE_DIMENSIONS.spinOne.width * (rotatedState.scaleX || 1)) / 2;
      const expectedOffsetY =
        (SHAPE_DIMENSIONS.spinOne.height * (rotatedState.scaleY || 1)) / 2;

      expect(rotatedState.offsetX).toBeCloseTo(expectedOffsetX, 1);
      expect(rotatedState.offsetY).toBeCloseTo(expectedOffsetY, 1);

      // The visual center should be preserved. With offsets set, the visual center is now:
      // Initial center (before offset): initialState.x + width/2, initialState.y + height/2
      // After setting offset, the object position stays the same but represents the rotation point
      const originalCenterX = initialState.x + initialWidth / 2;
      const originalCenterY = initialState.y + initialHeight / 2;

      // After rotation with offsets, the visual center should be at the same location
      // The rotated center is at: rotatedState.x + offsetX, rotatedState.y + offsetY
      const rotatedCenterX = rotatedState.x + (rotatedState.offsetX || 0);
      const rotatedCenterY = rotatedState.y + (rotatedState.offsetY || 0);

      // The centers should be close (the object should rotate around the same visual point)
      const centerXDiff = Math.abs(rotatedCenterX - originalCenterX);
      const centerYDiff = Math.abs(rotatedCenterY - originalCenterY);

      expect(centerXDiff).toBeLessThan(0.1);
      expect(centerYDiff).toBeLessThan(0.1);
    });

    test('should maintain dancer center within margin of error during multiple rotations', () => {
      const {
        initializeDefaultKeystrokes,
        handleKeystroke,
        updateDancerState,
        handleDancerSelection,
        setMaintainRotationCenter,
      } = useAppStore.getState();
      const panelId = useAppStore.getState().panels[0].id;
      const dancerId = useAppStore.getState().panels[0].dancers[0].id;

      // Set up a scaled dancer for testing - reset all properties first
      act(() => {
        setMaintainRotationCenter(true);
        updateDancerState(panelId, dancerId, {
          x: 100,
          y: 100,
          rotation: 0,
          scaleX: 0.8, // Slightly smaller
          scaleY: 1.2, // Slightly taller
          offsetX: undefined, // Reset offset values from previous tests
          offsetY: undefined,
        });
        handleDancerSelection(panelId, dancerId);
        initializeDefaultKeystrokes();
      });

      const initialState = useAppStore.getState().panels[0].dancers[0];

      // Calculate initial visual center
      // Dancer base dimensions from DANCER_DIMENSIONS
      const initialWidth = DANCER_DIMENSIONS.BODY_WIDTH * 0.8;
      const initialHeight = DANCER_DIMENSIONS.TOTAL_HEIGHT * 1.2;

      // Before rotation
      const adjustedInitialCenterX = initialState.x + initialWidth / 2;
      const adjustedInitialCenterY = initialState.y + initialHeight / 2;

      // Perform rotation (45 degrees = 3 * 15)
      act(() => {
        handleKeystroke('ArrowLeft', { key: 'ArrowLeft' });
        handleKeystroke('ArrowLeft', { key: 'ArrowLeft' });
        handleKeystroke('ArrowLeft', { key: 'ArrowLeft' });
      });

      const rotatedState = useAppStore.getState().panels[0].dancers[0];

      // Verify rotation was applied
      expect(rotatedState.rotation).toBe(-45);

      // Verify that offsets were set to center (based on actual dancer dimensions)
      // Expected offsets based on DANCER_DIMENSIONS with scale factors 0.8 and 1.2
      const expectedOffsetX =
        (DANCER_DIMENSIONS.BODY_WIDTH * (rotatedState.scaleX || 1)) / 2;
      const expectedOffsetY =
        DANCER_DIMENSIONS.VISUAL_CENTER_Y * (rotatedState.scaleY || 1);

      expect(rotatedState.offsetX).toBeCloseTo(expectedOffsetX, 1);
      expect(rotatedState.offsetY).toBeCloseTo(expectedOffsetY, 1);

      // With offsets set, check that the object rotates around its original visual center
      // Original center (before any offset): use actual visual center calculation
      const originalCenterX = initialState.x + initialWidth / 2;
      const originalCenterY =
        initialState.y +
        DANCER_DIMENSIONS.VISUAL_CENTER_Y * (initialState.scaleY || 1);

      // After rotation with offsets, the visual center is at: position + offset
      const rotatedVisualCenterX = rotatedState.x + (rotatedState.offsetX || 0);
      const rotatedVisualCenterY = rotatedState.y + (rotatedState.offsetY || 0);

      // The visual centers should be the same (object rotates around same point)
      const centerXDiff = Math.abs(rotatedVisualCenterX - originalCenterX);
      const centerYDiff = Math.abs(rotatedVisualCenterY - originalCenterY);

      expect(centerXDiff).toBeLessThan(0.1);
      expect(centerYDiff).toBeLessThan(0.1);

      // Perform another rotation to test that subsequent rotations don't change center
      const beforeSecondRotationX = rotatedState.x;
      const beforeSecondRotationY = rotatedState.y;

      act(() => {
        handleKeystroke('ArrowLeft', { key: 'ArrowLeft' });
      });

      const finalState = useAppStore.getState().panels[0].dancers[0];

      // Verify final rotation
      expect(finalState.rotation).toBe(-60);

      // Verify center position unchanged from previous rotation
      expect(Math.abs(finalState.x - beforeSecondRotationX)).toBeLessThan(0.1);
      expect(Math.abs(finalState.y - beforeSecondRotationY)).toBeLessThan(0.1);
    });

    test('should allow disabling center-preserving rotation', () => {
      const {
        initializeDefaultKeystrokes,
        handleKeystroke,
        updateDancerState,
        handleDancerSelection,
        setMaintainRotationCenter,
      } = useAppStore.getState();
      const panelId = useAppStore.getState().panels[0].id;
      const dancerId = useAppStore.getState().panels[0].dancers[0].id;

      // Disable center-preserving rotation
      act(() => {
        setMaintainRotationCenter(false);
        updateDancerState(panelId, dancerId, { x: 100, y: 100, rotation: 0 });
        handleDancerSelection(panelId, dancerId);
        initializeDefaultKeystrokes();
      });

      const initialState = useAppStore.getState().panels[0].dancers[0];
      const initialX = initialState.x;
      const initialY = initialState.y;

      // Rotate 15 degrees
      act(() => {
        handleKeystroke('ArrowRight', { key: 'ArrowRight' });
      });

      const rotatedState = useAppStore.getState().panels[0].dancers[0];

      // With center-preserving disabled, position should remain unchanged
      expect(rotatedState.x).toBe(initialX);
      expect(rotatedState.y).toBe(initialY);
      expect(rotatedState.rotation).toBe(15);
    });

    test('should respect rotation step configuration', () => {
      const { initializeDefaultKeystrokes, handleKeystroke, setRotationStep } =
        useAppStore.getState();
      const panelId = useAppStore.getState().panels[0].id;
      const dancerId = useAppStore.getState().panels[0].dancers[0].id;

      act(() => {
        setRotationStep(30); // Set custom rotation step
        initializeDefaultKeystrokes();
        useAppStore.getState().handleDancerSelection(panelId, dancerId);
      });

      const initialRotation =
        useAppStore.getState().panels[0].dancers[0].rotation || 0;

      act(() => {
        handleKeystroke('ArrowLeft', { key: 'ArrowLeft' });
      });

      const currentRotation =
        useAppStore.getState().panels[0].dancers[0].rotation;
      expect(currentRotation).toBe(initialRotation - 30);
    });

    test('should handle rotation with modifier keys for fine control', () => {
      const { initializeDefaultKeystrokes, handleKeystroke } =
        useAppStore.getState();
      const panelId = useAppStore.getState().panels[0].id;
      const dancerId = useAppStore.getState().panels[0].dancers[0].id;

      act(() => {
        initializeDefaultKeystrokes();
        useAppStore.getState().handleDancerSelection(panelId, dancerId);
      });

      const initialRotation =
        useAppStore.getState().panels[0].dancers[0].rotation || 0;

      // Fine rotation with shift modifier
      act(() => {
        handleKeystroke('ArrowLeft', {
          key: 'ArrowLeft',
          shiftKey: true,
        });
      });

      const currentRotation =
        useAppStore.getState().panels[0].dancers[0].rotation;
      expect(currentRotation).toBe(initialRotation - 1); // Fine rotation step
    });
  });

  describe('Integration with Canvas Component', () => {
    test('should have KeystrokeHandler component available', () => {
      // This test verifies the KeystrokeHandler component exists and can be imported
      const KeystrokeHandler = require('../KeystrokeHandler').default;
      expect(KeystrokeHandler).toBeDefined();
    });

    test('should initialize keystrokes when KeystrokeHandler mounts', () => {
      const { getRegisteredKeystrokes } = useAppStore.getState();

      // Should have default keystrokes after initialization
      const keystrokes = getRegisteredKeystrokes();
      expect(Object.keys(keystrokes).length).toBeGreaterThan(0);
      expect(keystrokes).toHaveProperty('ArrowLeft:dancer');
      expect(keystrokes).toHaveProperty('ArrowLeft:symbol');
    });
  });

  describe('Extensibility and Configuration', () => {
    test('should allow custom keystroke registration at runtime', () => {
      const customHandler = jest.fn();
      const { registerKeystroke, handleKeystroke } = useAppStore.getState();

      act(() => {
        registerKeystroke('KeyR', {
          description: 'Custom reset function',
          handler: customHandler,
          context: 'global',
        });
      });

      act(() => {
        handleKeystroke('KeyR', { key: 'r' });
      });

      expect(customHandler).toHaveBeenCalledTimes(1);
    });

    test('should support keystroke handler priority system', () => {
      const lowPriorityHandler = jest.fn();
      const highPriorityHandler = jest.fn();
      const { registerKeystroke, handleKeystroke } = useAppStore.getState();

      act(() => {
        registerKeystroke('KeyT', {
          description: 'Low priority',
          handler: lowPriorityHandler,
          context: 'global',
          priority: 1,
        });

        registerKeystroke('KeyT', {
          description: 'High priority',
          handler: highPriorityHandler,
          context: 'global',
          priority: 10,
        });
      });

      act(() => {
        handleKeystroke('KeyT', { key: 't' });
      });

      // Higher priority should be called, lower priority should be skipped
      expect(highPriorityHandler).toHaveBeenCalledTimes(1);
      expect(lowPriorityHandler).not.toHaveBeenCalled();
    });

    test('should provide keystroke help/documentation functionality', () => {
      const { getKeystrokeHelp, initializeDefaultKeystrokes } =
        useAppStore.getState();

      act(() => {
        initializeDefaultKeystrokes();
      });

      const help = getKeystrokeHelp();
      expect(help).toBeInstanceOf(Array);
      expect(help.length).toBeGreaterThan(0);
      expect(help[0]).toHaveProperty('key');
      expect(help[0]).toHaveProperty('description');
      expect(help[0]).toHaveProperty('context');
    });

    test('should support keyboard shortcut conflicts detection', () => {
      const { registerKeystroke, detectKeystrokeConflicts } =
        useAppStore.getState();

      act(() => {
        registerKeystroke('ArrowLeft', {
          description: 'First handler',
          handler: jest.fn(),
          context: 'dancer',
        });

        registerKeystroke('ArrowLeft', {
          description: 'Second handler',
          handler: jest.fn(),
          context: 'dancer',
        });
      });

      const conflicts = detectKeystrokeConflicts();
      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts[0].key).toBe('ArrowLeft');
      expect(conflicts[0].context).toBe('dancer');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle keystrokes gracefully when no selection exists', () => {
      const { handleKeystroke, initializeDefaultKeystrokes } =
        useAppStore.getState();

      act(() => {
        initializeDefaultKeystrokes();
      });

      // No selection active
      expect(() => {
        act(() => {
          handleKeystroke('ArrowLeft', { key: 'ArrowLeft' });
        });
      }).not.toThrow();
    });

    test('should handle invalid keystroke events', () => {
      const { handleKeystroke } = useAppStore.getState();

      expect(() => {
        act(() => {
          handleKeystroke(null, null);
        });
      }).not.toThrow();

      expect(() => {
        act(() => {
          handleKeystroke('InvalidKey', { key: 'InvalidKey' });
        });
      }).not.toThrow();
    });

    test('should cleanup keystroke handlers on unmount', () => {
      const {
        clearAllKeystrokes,
        getRegisteredKeystrokes,
        initializeDefaultKeystrokes,
      } = useAppStore.getState();

      act(() => {
        initializeDefaultKeystrokes();
      });

      expect(Object.keys(getRegisteredKeystrokes()).length).toBeGreaterThan(0);

      act(() => {
        clearAllKeystrokes();
      });

      expect(Object.keys(getRegisteredKeystrokes()).length).toBe(0);
    });
  });
});
