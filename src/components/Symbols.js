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
}) => {
  const shapeRef = useRef();
  const trRef = useRef();

  //Load image for feet symbols
  const [image] = useImage(images[shape.imageKey]);

  //check if its the stage marker
  const isStageOrigin = shape.type === ShapeTypes.STAGE_X;

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

  const handleClick = useCallback(
    (e) => {
      if (disabled || isStageOrigin) return;

      onShapeSelect();
    },
    [disabled, isStageOrigin, onShapeSelect],
  );

  useEffect(() => {
    if (isSelected && !isStageOrigin && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    } else if (!isSelected && trRef.current) {
      // Detach the transformer when the shape is deselected
      trRef.current.nodes([]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected, isStageOrigin]);

  //handles end of transform and updates the state
  const handleTransformEnd = useCallback(
    (e) => {
      const node = shapeRef.current;
      let newScaleX = node.scaleX();

      const spinConfig = SPIN_CONFIGS[shape.type];

      if (spinConfig) {
        // Direction (CW / CCW) is encoded in the config, not in the shape
        const baseSignX = Math.sign(spinConfig.scaleX ?? 1) || 1;

        // Take the magnitude from the transform, but force the config’s sign
        newScaleX = Math.abs(newScaleX) * baseSignX;

        // Normalize the node so what you see matches what you store
        node.scaleX(newScaleX);
      }

      const newState = {
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
        scaleX: node.scaleX(),
        scaleY: node.scaleY(),
      };
      onUpdateShapeState(newState);
    },
    [onUpdateShapeState, shape.type],
  );

  //Attach or detach transformer when selection changes
  useEffect(() => {
    if (isSelected && !isStageOrigin && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected, isStageOrigin]);

  const commonProps = {
    ref: shapeRef,
    ...shape,
    opacity: opacity,
    draggable: !disabled,
    scaleX: shape.scaleX || 1,
    scaleY: shape.scaleY || 1,
    rotation: shape.rotation || 0,
    onClick: handleClick,
    onDragEnd: handleDragEnd,
    strokeScaleEnabled: false,
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
        {isSelected && !isStageOrigin && (
          <Transformer
            ref={trRef}
            centeredScaling={true}
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
        {isSelected && !isStageOrigin && (
          <Transformer
            ref={trRef}
            centeredScaling={true}
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
        {isSelected && !isStageOrigin && (
          <Transformer
            ref={trRef}
            centeredScaling={true}
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
        {isSelected && !isStageOrigin && (
          <Transformer
            ref={trRef}
            centeredScaling={true}
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
          scaleX={SHAPE_STYLE.IMAGE_SCALE_FACTOR}
          scaleY={SHAPE_STYLE.IMAGE_SCALE_FACTOR}
        />
      )}
      {shape.type === ShapeTypes.STAGE_X && (
        <Text
          {...commonProps}
          text={shape.text}
          fontSize={shape.fontSize}
          fill={shape.fill}
          offsetX={10}
          offsetY={10}
        />
      )}
      {shape.type === ShapeTypes.STAGE_NEXT && (
        <Text
          {...commonProps}
          text={shape.text}
          fontSize={shape.fontSize}
          fill={shape.fill}
          offsetX={10}
          offsetY={10}
        />
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
      {isSelected && !isStageOrigin && (
        <Transformer
          ref={trRef}
          centeredScaling={true}
          onTransformEnd={handleTransformEnd}
        />
      )}
    </>
  );
};

export default Symbol;
