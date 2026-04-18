import { SHAPE_STYLE } from './dimensions';
import { SHAPE_REGISTRY } from '../constants/shapeRegistry';
import * as ShapeTypes from '../constants/shapeTypes';

const CENTER_ANCHORED_TYPES = new Set([
  ShapeTypes.STRAIGHT_LINE,
  ShapeTypes.STRAIGHT_LINE_UP,
  ShapeTypes.STRAIGHT_LINE_DOWN,
  ShapeTypes.TWO_THIRDS_STRAIGHT_LINE,
  ShapeTypes.TWO_THIRDS_STRAIGHT_LINE_UP,
  ShapeTypes.TWO_THIRDS_STRAIGHT_LINE_DOWN,
  ShapeTypes.ONE_THIRD_STRAIGHT_LINE,
  ShapeTypes.ONE_THIRD_STRAIGHT_LINE_UP,
  ShapeTypes.ONE_THIRD_STRAIGHT_LINE_DOWN,
  ShapeTypes.QUARTER_CURVED_LINE,
  ShapeTypes.QUARTER_CURVED_LINE_UP,
  ShapeTypes.QUARTER_CURVED_LINE_DOWN,
  ShapeTypes.HALF_CURVED_LINE,
  ShapeTypes.HALF_CURVED_LINE_UP,
  ShapeTypes.HALF_CURVED_LINE_DOWN,
  ShapeTypes.SPIN_TWO,
  ShapeTypes.SPIN_TWO_CW,
  ShapeTypes.SPIN_TWO_CCW,
  ShapeTypes.SPIN_ONE_AND_HALF,
  ShapeTypes.SPIN_ONE_AND_HALF_CW,
  ShapeTypes.SPIN_ONE_AND_HALF_CCW,
  ShapeTypes.SPIN_ONE,
  ShapeTypes.SPIN_ONE_CW,
  ShapeTypes.SPIN_ONE_CCW,
  ShapeTypes.SPIN_HALF,
  ShapeTypes.SPIN_HALF_CW,
  ShapeTypes.SPIN_HALF_CCW,
  ShapeTypes.SPIN_QUARTER,
  ShapeTypes.SPIN_QUARTER_CW,
  ShapeTypes.SPIN_QUARTER_CCW,
  ShapeTypes.OVERHEAD,
  ShapeTypes.SHOULDER,
  ShapeTypes.HIP,
  ShapeTypes.KNEE,
]);

const PLACEMENT_DIMENSION_OVERRIDES = {
  [ShapeTypes.BLOCK]: { width: 10, height: 10 },
  [ShapeTypes.SPLIT_HANDS]: { width: 18, height: 24 },
  [ShapeTypes.LINK_HANDS]: { width: 18, height: 20 },
  [ShapeTypes.HASH_SIGN]: { width: 16, height: 20 },
  [ShapeTypes.ASTERISK_SIGN]: { width: 16, height: 26 },
};

const CURSOR_ANCHOR_OVERRIDES = {
  [ShapeTypes.SIGNAL]: { mode: 'px', x: 35, y: 14 },
  [ShapeTypes.DIRECTION_UP]: { mode: 'px', x: 14, y: 30 },
  [ShapeTypes.DIRECTION_DOWN]: { mode: 'px', x: 14, y: 35 },
};

const getPlacementDimensions = (shapeDraft) => {
  const override = PLACEMENT_DIMENSION_OVERRIDES[shapeDraft?.type];
  if (override) return override;
  return SHAPE_REGISTRY[shapeDraft?.type]?.defaultDimensions;
};

const getDefaultCursorAnchor = (shapeDraft) => {
  if (shapeDraft?.hotspot) return shapeDraft.hotspot;

  const anchorOverride = CURSOR_ANCHOR_OVERRIDES[shapeDraft?.type];
  if (anchorOverride) return anchorOverride;

  if (shapeDraft?.type === ShapeTypes.IMAGE) {
    return { mode: 'ratio', x: 1, y: 1 };
  }

  const defaultDimensions = getPlacementDimensions(shapeDraft);
  if (!defaultDimensions) {
    return { mode: 'px', x: 0, y: 0 };
  }

  if (CENTER_ANCHORED_TYPES.has(shapeDraft.type)) {
    return {
      mode: 'px',
      x: defaultDimensions.width / 2,
      y: defaultDimensions.height / 2,
    };
  }

  return {
    mode: 'px',
    x: defaultDimensions.width,
    y: defaultDimensions.height,
  };
};

export const getSymbolPlacementHotspotOffset = (
  shapeDraft,
  imageDimensions = {},
) => {
  if (!shapeDraft) return { x: 0, y: 0 };

  const hotspot = getDefaultCursorAnchor(shapeDraft);

  if (hotspot.mode === 'px') {
    return { x: hotspot.x || 0, y: hotspot.y || 0 };
  }

  const scaleX =
    SHAPE_STYLE.IMAGE_SCALE_FACTOR *
    (shapeDraft.scaleX !== undefined ? shapeDraft.scaleX : 1);
  const scaleY =
    SHAPE_STYLE.IMAGE_SCALE_FACTOR *
    (shapeDraft.scaleY !== undefined ? shapeDraft.scaleY : 1);
  const renderedWidth = (imageDimensions.width || 0) * scaleX;
  const renderedHeight = (imageDimensions.height || 0) * scaleY;

  return {
    x: renderedWidth * (hotspot.x !== undefined ? hotspot.x : 1),
    y: renderedHeight * (hotspot.y !== undefined ? hotspot.y : 1),
  };
};
