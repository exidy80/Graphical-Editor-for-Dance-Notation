import React, { useRef, useEffect, useCallback } from 'react';
import {
  Transformer,
  Arrow,
  Text,
  Rect,
  Circle,
  Image as KonvaImage,
  RegularPolygon,
} from 'react-konva';
import images from './ImageMapping';
import { useImage } from 'react-konva-utils';
import { SHAPE_STYLE } from '../utils/dimensions';
import * as ShapeTypes from '../constants/shapeTypes';
import SpinSymbol from './symbols/SpinSymbol';
import CurvedLineSymbol from './symbols/CurvedLineSymbol';
import {
  SPIN_CONFIGS,
  CURVED_LINE_CONFIGS,
  STRAIGHT_LINE_CONFIGS,
  DIRECTION_CONFIGS,
} from './symbols/shapeConfigs';

const Symbol = ({
  shape,
  isSelected,
  disabled,
  opacity,
  onShapeSelect,
  onUpdateShapeState,
  onDragStart,
  isGlowing,
}) => {
  const shapeRef = useRef();
  const trRef = useRef();

  //Load image for feet symbols
  const [image] = useImage(images[shape.imageKey]);

  //check if its the stage marker
  const isStageCenter = shape.type === ShapeTypes.STAGE_CENTER;

  const handleDragEnd = useCallback(
    (e) => {
      const node = e.target;
      onUpdateShapeState({
        x: node.x(),
        y: node.y(),
      });
    },
    [onUpdateShapeState],
  );

  const handleDragStart = useCallback(() => {
    if (onDragStart) onDragStart();
  }, [onDragStart]);

  const handleDragMove = useCallback(
    (e) => {
      const node = e.target;
      onUpdateShapeState({
        x: node.x(),
        y: node.y(),
      });
    },
    [onUpdateShapeState],
  );

  const handleTransform = useCallback(() => {
    const node = shapeRef.current;
    if (!node) return;
    const imageScaleFactor =
      shape.type === ShapeTypes.IMAGE
        ? SHAPE_STYLE.IMAGE_SCALE_FACTOR * (isGlowing ? 1.5 : 1)
        : 1;
    const scaleX =
      shape.type === ShapeTypes.IMAGE
        ? node.scaleX() / imageScaleFactor
        : node.scaleX();
    const scaleY =
      shape.type === ShapeTypes.IMAGE
        ? node.scaleY() / imageScaleFactor
        : node.scaleY();
    onUpdateShapeState({
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
      scaleX: scaleX,
      scaleY: scaleY,
    });
  }, [isGlowing, onUpdateShapeState, shape.type]);

  const handleClick = useCallback(
    (e) => {
      if (disabled || isStageCenter) return;
      // Pass whether Shift was held so the caller can toggle multi-select
      const multiSelect = !!e?.evt?.shiftKey;
      onShapeSelect(multiSelect);
    },
    [disabled, isStageCenter, onShapeSelect],
  );

  useEffect(() => {
    if (isSelected && !isStageCenter && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    } else if (!isSelected && trRef.current) {
      // Detach the transformer when the shape is deselected
      trRef.current.nodes([]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected, isStageCenter]);

  //handles end of transform and updates the state
  const handleTransformEnd = useCallback(
    (e) => {
      const node = shapeRef.current;
      const imageScaleFactor =
        shape.type === ShapeTypes.IMAGE
          ? SHAPE_STYLE.IMAGE_SCALE_FACTOR * (isGlowing ? 1.5 : 1)
          : 1;
      const scaleX =
        shape.type === ShapeTypes.IMAGE
          ? node.scaleX() / imageScaleFactor
          : node.scaleX();
      const scaleY =
        shape.type === ShapeTypes.IMAGE
          ? node.scaleY() / imageScaleFactor
          : node.scaleY();
      const newState = {
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
        scaleX: scaleX,
        scaleY: scaleY,
      };
      onUpdateShapeState(newState);
    },
    [isGlowing, onUpdateShapeState, shape.type],
  );

  //Attach or detach transformer when selection changes
  useEffect(() => {
    if (isSelected && !isStageCenter && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected, isStageCenter]);

  const commonProps = {
    ref: shapeRef,
    ...shape,
    shapeId: shape.id,
    shapeType: shape.type,
    opacity: opacity,
    draggable: !disabled && !isStageCenter,
    scaleX: shape.scaleX || 1,
    scaleY: shape.scaleY || 1,
    rotation: shape.rotation || 0,
    onClick: handleClick,
    onDragStart: handleDragStart,
    onDragMove: handleDragMove,
    onDragEnd: handleDragEnd,
    onTransform: handleTransform,
    strokeScaleEnabled: false,
    'data-testid': `symbol-${shape.id}`,
    shadowColor: isGlowing ? shape.stroke || shape.fill || 'yellow' : null,
    shadowBlur: isGlowing ? 15 : 0,
    shadowOpacity: isGlowing ? 1 : 0,
  };

  // Check if it's a spin symbol
  const spinConfig = SPIN_CONFIGS[shape.type];
  if (spinConfig) {
    return (
      <>
        <SpinSymbol
          config={spinConfig}
          shape={shape}
          commonProps={commonProps}
        />
        {isSelected && !isStageCenter && (
          <Transformer
            ref={trRef}
            centeredScaling={true}
            onTransformStart={handleDragStart}
            onTransformEnd={handleTransformEnd}
          />
        )}
      </>
    );
  }

  // Check if it's a curved line symbol
  const curvedLineConfig = CURVED_LINE_CONFIGS[shape.type];
  if (curvedLineConfig) {
    return (
      <>
        <CurvedLineSymbol
          config={curvedLineConfig}
          shape={shape}
          commonProps={commonProps}
        />
        {isSelected && !isStageCenter && (
          <Transformer
            ref={trRef}
            centeredScaling={true}
            onTransformStart={handleDragStart}
            onTransformEnd={handleTransformEnd}
          />
        )}
      </>
    );
  }

  // Check if it's a straight line symbol
  const straightLineConfig = STRAIGHT_LINE_CONFIGS[shape.type];
  if (straightLineConfig) {
    return (
      <>
        <Arrow
          {...commonProps}
          points={straightLineConfig.points}
          pointerLength={5}
          pointerWidth={SHAPE_STYLE.POINTER_WIDTH}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={SHAPE_STYLE.STROKE_WIDTH_THICK}
          hitStrokeWidth={SHAPE_STYLE.HIT_STROKE_WIDTH}
          dash={[10, 5]}
        />
        {isSelected && !isStageCenter && (
          <Transformer
            ref={trRef}
            centeredScaling={true}
            onTransformStart={handleDragStart}
            onTransformEnd={handleTransformEnd}
          />
        )}
      </>
    );
  }

  // Check if it's a direction arrow
  const directionConfig = DIRECTION_CONFIGS[shape.type];
  if (directionConfig) {
    return (
      <>
        <Arrow
          {...commonProps}
          points={directionConfig.points}
          pointerLength={5}
          pointerWidth={5}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={3}
          hitStrokeWidth={10}
        />
        {isSelected && !isStageCenter && (
          <Transformer
            ref={trRef}
            centeredScaling={true}
            onTransformStart={handleDragStart}
            onTransformEnd={handleTransformEnd}
          />
        )}
      </>
    );
  }

  // Render the remaining individual shapes
  return (
    <>
      {shape.type === ShapeTypes.BLOCK && (
        <Rect
          {...commonProps}
          width={10}
          height={10}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={2}
        />
      )}
      {shape.type === ShapeTypes.SPLIT_HANDS && (
        <Text
          {...commonProps}
          text="×"
          fontSize={24}
          fontWeight="bold"
          fill={shape.fill}
        />
      )}
      {shape.type === ShapeTypes.LINK_HANDS && (
        <Text {...commonProps} text="∞" fontSize={20} fill={shape.fill} />
      )}
      {shape.type === ShapeTypes.IMAGE && (
        <KonvaImage
          {...commonProps}
          image={image}
          scaleX={
            SHAPE_STYLE.IMAGE_SCALE_FACTOR *
            (isGlowing ? 1.5 : 1) *
            (shape.scaleX || 1)
          }
          scaleY={
            SHAPE_STYLE.IMAGE_SCALE_FACTOR *
            (isGlowing ? 1.5 : 1) *
            (shape.scaleY || 1)
          }
        />
      )}
      {shape.type === ShapeTypes.STAGE_X && (
        <Text
          {...commonProps}
          text={shape.text}
          fontSize={shape.fontSize}
          fill={shape.fill}
          offsetX={8.3}
          offsetY={8.3}
        />
      )}
      {shape.type === ShapeTypes.STAGE_NEXT && (
        <Text
          {...commonProps}
          text={shape.text}
          fontSize={shape.fontSize}
          fill={shape.fill}
          offsetX={8.3}
          offsetY={8.3}
        />
      )}
      {shape.type === ShapeTypes.STAGE_CENTER && (
        <Circle {...commonProps} radius={shape.radius || 5} fill={shape.fill} />
      )}
      {shape.type === ShapeTypes.KNEE && (
        <Circle
          {...commonProps}
          radius={3}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={1}
        />
      )}
      {shape.type === ShapeTypes.HIP && (
        <Circle
          {...commonProps}
          radius={3}
          stroke={shape.stroke}
          strokeWidth={2}
        />
      )}
      {shape.type === ShapeTypes.WAIST && (
        <Rect
          {...commonProps}
          width={12}
          height={2}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={3}
        />
      )}
      {shape.type === ShapeTypes.SHOULDER && (
        <RegularPolygon
          {...commonProps}
          sides={4}
          radius={5}
          stroke={shape.stroke}
          strokeWidth={2}
        />
      )}
      {shape.type === ShapeTypes.OVERHEAD && (
        <RegularPolygon
          {...commonProps}
          sides={4}
          radius={5}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={1}
        />
      )}
      {isSelected && !isStageCenter && (
        <Transformer
          ref={trRef}
          centeredScaling={true}
          onTransformStart={handleDragStart}
          onTransformEnd={handleTransformEnd}
        />
      )}
    </>
  );
};

export default Symbol;
