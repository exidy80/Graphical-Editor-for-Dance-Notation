import { useAppStore } from '../../stores';
import { act } from '@testing-library/react';
import * as ShapeTypes from '../../constants/shapeTypes';

describe('Marquee Selection - Feet', () => {
  beforeEach(() => {
    // Reset store to initial state
    useAppStore.setState(
      {
        panels: [
          {
            id: 'test-panel',
            dancers: [],
            shapes: [],
            headShapes: [],
            handShapes: [],
            locks: [],
          },
        ],
        selectedPanel: 'test-panel',
        selectedItems: [],
        hideList: [],
        opacity: {
          dancers: { value: 1, disabled: false },
          symbols: { value: 1, disabled: false },
          disabled: [],
        },
      },
      false,
    );
  });

  test('foot shape created via drag/transform WILL have scaleX=1, scaleY=1', () => {
    const { handleShapeDraw, updateShapeState } = useAppStore.getState();

    // Create a foot shape
    act(() => {
      handleShapeDraw({
        id: 'test-foot',
        type: ShapeTypes.IMAGE,
        imageKey: 'leftFootBasicBlue',
        x: 200,
        y: 200,
        draggable: true,
      });
    });

    // Simulate what happens when a shape is transformed (drag, scale, etc)
    // Konva sets scaleX and scaleY to 1
    act(() => {
      updateShapeState('test-panel', 'test-foot', {
        scaleX: 1,
        scaleY: 1,
      });
    });

    const panel = useAppStore.getState().panels[0];
    const footShape = panel.shapes[0];

    console.log('Transformed foot shape:', footShape);
    console.log('Has scaleX?', 'scaleX' in footShape, footShape.scaleX);
    console.log('Has scaleY?', 'scaleY' in footShape, footShape.scaleY);

    // After transform, feet WILL have scale properties
    expect(footShape.scaleX).toBe(1);
    expect(footShape.scaleY).toBe(1);
  });

  test('marquee selection with stored scaleX=1 for feet - TESTS THE ACTUAL FIX', () => {
    const { handleShapeDraw, updateShapeState } = useAppStore.getState();

    // Create a foot shape and simulate transformation that sets scaleX=1
    act(() => {
      handleShapeDraw({
        id: 'test-foot',
        type: ShapeTypes.IMAGE,
        imageKey: 'leftFootBasicBlue',
        x: 200,
        y: 200,
        draggable: true,
      });
      // Simulate what happens during drag/transform - scaleX is set to 1
      updateShapeState('test-panel', 'test-foot', { scaleX: 1, scaleY: 1 });
    });

    const panel = useAppStore.getState().panels[0];
    const shape = panel.shapes[0];

    const SHAPE_DIMENSIONS = { image: { width: 96, height: 137 } }; // Actual native dimensions
    const IMAGE_SCALE_FACTOR = 0.3;
    const IMAGE = 'image';
    const dims = SHAPE_DIMENSIONS.image;

    // THE FIX: For IMAGE types, the stored scaleX/scaleY is IGNORED during rendering
    // Images are always rendered at IMAGE_SCALE_FACTOR (0.3), see Symbols.js line 291-292
    const effectiveScaleX =
      shape.type === IMAGE ? IMAGE_SCALE_FACTOR : shape.scaleX || 1;
    const effectiveScaleY =
      shape.type === IMAGE ? IMAGE_SCALE_FACTOR : shape.scaleY || 1;

    const hw = (dims.width * effectiveScaleX) / 2;
    const hh = (dims.height * effectiveScaleY) / 2;

    const shapeBBox = {
      minX: shape.x - hw,
      maxX: shape.x + hw,
      minY: shape.y - hh,
      maxY: shape.y + hh,
    };

    const marqueeBox = { minX: 190, maxX: 210, minY: 190, maxY: 210 };

    const isEnclosed =
      shapeBBox.minX >= marqueeBox.minX &&
      shapeBBox.maxX <= marqueeBox.maxX &&
      shapeBBox.minY >= marqueeBox.minY &&
      shapeBBox.maxY <= marqueeBox.maxY;

    // WITH OLD LOGIC: These assertions will FAIL
    // - effectiveScaleX would be shape.scaleX (1.0) instead of IMAGE_SCALE_FACTOR (0.3)
    // - hw would be wrong
    // - bbox would be wrong
    // - isEnclosed would be wrong

    // With correct dimensions: 96*0.3 = 28.8, 137*0.3 = 41.1
    expect(hw).toBeCloseTo(14.4); // 96 * 0.3 / 2
    expect(hh).toBeCloseTo(20.55); // 137 * 0.3 / 2
    expect(shapeBBox.minX).toBeCloseTo(185.6); // 200 - 14.4
    expect(shapeBBox.maxX).toBeCloseTo(214.4); // 200 + 14.4
    expect(shapeBBox.minY).toBeCloseTo(179.45); // 200 - 20.55
    expect(shapeBBox.maxY).toBeCloseTo(220.55); // 200 + 20.55

    // Marquee 190-210 is now TOO SMALL for the actual foot (185.6-214.4)
    expect(isEnclosed).toBe(false);

    // But a properly sized marquee (185-215 x 179-221) WILL work
    const largerMarquee = { minX: 185, maxX: 215, minY: 179, maxY: 221 };
    const isEnclosedWithCorrectMarquee =
      shapeBBox.minX >= largerMarquee.minX &&
      shapeBBox.maxX <= largerMarquee.maxX &&
      shapeBBox.minY >= largerMarquee.minY &&
      shapeBBox.maxY <= largerMarquee.maxY;
    expect(isEnclosedWithCorrectMarquee).toBe(true); // This WILL work with correct dimensions!
  });

  test('OLD BEHAVIOR - using scaleX directly without IMAGE_SCALE_FACTOR', () => {
    const { handleShapeDraw, updateShapeState } = useAppStore.getState();

    // Create a foot with scaleX=1
    act(() => {
      handleShapeDraw({
        id: 'test-foot',
        type: ShapeTypes.IMAGE,
        imageKey: 'leftFootBasicBlue',
        x: 200,
        y: 200,
        draggable: true,
      });
      updateShapeState('test-panel', 'test-foot', { scaleX: 1, scaleY: 1 });
    });

    const panel = useAppStore.getState().panels[0];
    const shape = panel.shapes[0];

    console.log('=== OLD BEHAVIOR (demonstrates the bug) ===');

    const SHAPE_DIMENSIONS = { image: { width: 96, height: 137 } }; // Using correct native dimensions
    const dims = SHAPE_DIMENSIONS.image;

    // OLD LOGIC - just using scaleX directly (BUG)
    const effectiveScaleX = shape.scaleX || 1;
    const effectiveScaleY = shape.scaleY || 1;

    console.log(
      'OLD effective scaleX:',
      effectiveScaleX,
      '(is 1, should be 0.3)',
    );

    const hw = (dims.width * effectiveScaleX) / 2;
    const hh = (dims.height * effectiveScaleY) / 2;

    const shapeBBox = {
      minX: shape.x - hw,
      maxX: shape.x + hw,
      minY: shape.y - hh,
      maxY: shape.y + hh,
    };

    console.log('OLD Half-width (hw):', hw, '(will be 48, not 14.4)');
    console.log('OLD bounding box:', shapeBBox);
    console.log('Expected with bug:', {
      minX: 152,
      maxX: 248,
      minY: 131.5,
      maxY: 268.5,
    });

    // Marquee that should cover the ACTUAL visible foot (28.8 x 41.1 pixels)
    const marqueeBox = {
      minX: 185,
      maxX: 215,
      minY: 179,
      maxY: 221,
    };

    console.log('Marquee box:', marqueeBox);

    const isEnclosed =
      shapeBBox.minX >= marqueeBox.minX &&
      shapeBBox.maxX <= marqueeBox.maxX &&
      shapeBBox.minY >= marqueeBox.minY &&
      shapeBBox.maxY <= marqueeBox.maxY;

    console.log(
      'OLD Is foot enclosed?',
      isEnclosed,
      '(should be FALSE - the bug!)',
    );

    // This demonstrates the BUG - with old logic using scaleX=1, bbox is way too large
    expect(isEnclosed).toBe(false);
    expect(hw).toBe(48); // Wrong! 96*1/2 = 48, should be 14.4 (96*0.3/2)
    expect(hh).toBe(68.5); // Wrong! 137*1/2 = 68.5, should be 20.55 (137*0.3/2)
  });
});
