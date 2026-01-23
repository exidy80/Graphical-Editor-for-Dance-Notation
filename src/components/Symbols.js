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

  // Calculates the center of the bounding box for points array [x1, y1, x2, y2, ...]
  const calculateBoundingBoxCenter = (points) => {
    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;

    for (let i = 0; i < points.length; i += 2) {
      minX = Math.min(minX, points[i]);
      maxX = Math.max(maxX, points[i]);
      minY = Math.min(minY, points[i + 1]);
      maxY = Math.max(maxY, points[i + 1]);
    }

    return {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
    };
  };

  // Generates the points for each type of spin
  const generateSpiralPoints = (
    numPoints,
    radiusIncrement,
    angleIncrement,
    pattern,
    startAngle = 0,
  ) => {
    const points = [];
    for (let i = 0; i < numPoints; i++) {
      const angle = startAngle + i * angleIncrement;
      let radius;
      if (pattern === 'circle') {
        radius = radiusIncrement; // Fixed radius for a circle
      } else {
        radius = i * radiusIncrement;
      }
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      points.push(x, y);
    }
    return points;
  };

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
      const newState = {
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
        scaleX: node.scaleX(),
        scaleY: node.scaleY(),
      };
      onUpdateShapeState(newState);
    },
    [onUpdateShapeState],
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

  // Render the chosen shape
  return (
    <>
      {shape.type === ShapeTypes.SPIN_TWO && (
        <Arrow
          {...commonProps}
          points={generateSpiralPoints(30, 1, Math.PI / 6)}
          tension={0.5}
          pointerLength={5}
          pointerWidth={SHAPE_STYLE.POINTER_WIDTH}
          stroke={shape.stroke}
          fill={shape.fill}
          strokeWidth={SHAPE_STYLE.STROKE_WIDTH_THIN}
          hitStrokeWidth={SHAPE_STYLE.HIT_STROKE_WIDTH}
          dash={[10, 5]}
        />
      )}
      {shape.type === ShapeTypes.SPIN_TWO_CW && (
        <Arrow
          {...commonProps}
          points={generateSpiralPoints(30, 1, Math.PI / 6)}
          tension={0.5}
          pointerLength={5}
          pointerWidth={SHAPE_STYLE.POINTER_WIDTH}
          stroke={shape.stroke}
          fill={shape.fill}
          strokeWidth={SHAPE_STYLE.STROKE_WIDTH_THIN}
          hitStrokeWidth={SHAPE_STYLE.HIT_STROKE_WIDTH}
          dash={[10, 5]}
        />
      )}
      {shape.type === ShapeTypes.SPIN_TWO_CCW && (
        <Arrow
          {...commonProps}
          points={generateSpiralPoints(30, 1, Math.PI / 6)}
          tension={0.5}
          pointerLength={5}
          pointerWidth={SHAPE_STYLE.POINTER_WIDTH}
          stroke={shape.stroke}
          fill={shape.fill}
          strokeWidth={SHAPE_STYLE.STROKE_WIDTH_THIN}
          hitStrokeWidth={SHAPE_STYLE.HIT_STROKE_WIDTH}
          dash={[10, 5]}
          scaleX={-1}
        />
      )}
      {shape.type === ShapeTypes.SPIN_ONE_AND_HALF && (
        <Arrow
          {...commonProps}
          points={generateSpiralPoints(20, 1, Math.PI / 6)}
          tension={0.5}
          pointerLength={5}
          pointerWidth={5}
          stroke={shape.stroke}
          fill={shape.fill}
          strokeWidth={2}
          hitStrokeWidth={10}
          dash={[10, 5]}
        />
      )}
      {shape.type === ShapeTypes.SPIN_ONE_AND_HALF_CW && (
        <Arrow
          {...commonProps}
          points={generateSpiralPoints(20, 1, Math.PI / 6)}
          tension={0.5}
          pointerLength={5}
          pointerWidth={5}
          stroke={shape.stroke}
          fill={shape.fill}
          strokeWidth={2}
          hitStrokeWidth={10}
          dash={[10, 5]}
        />
      )}
      {shape.type === ShapeTypes.SPIN_ONE_AND_HALF_CCW && (
        <Arrow
          {...commonProps}
          points={generateSpiralPoints(20, 1, Math.PI / 6)}
          tension={0.5}
          pointerLength={5}
          pointerWidth={5}
          stroke={shape.stroke}
          fill={shape.fill}
          strokeWidth={2}
          hitStrokeWidth={10}
          dash={[10, 5]}
          scaleX={-1}
        />
      )}
      {shape.type === ShapeTypes.SPIN_ONE && (
        <Arrow
          {...commonProps}
          points={generateSpiralPoints(36, 25, Math.PI / 18, 'circle')}
          tension={0.5}
          pointerLength={5}
          pointerWidth={5}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={2}
          hitStrokeWidth={10}
          dash={[10, 5]}
        />
      )}
      {shape.type === ShapeTypes.SPIN_ONE_CW && (
        <Arrow
          {...commonProps}
          points={generateSpiralPoints(36, 25, Math.PI / 18, 'circle')}
          tension={0.5}
          pointerLength={5}
          pointerWidth={5}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={2}
          hitStrokeWidth={10}
          dash={[10, 5]}
        />
      )}
      {shape.type === ShapeTypes.SPIN_ONE_CCW && (
        <Arrow
          {...commonProps}
          points={generateSpiralPoints(36, 25, Math.PI / 18, 'circle')}
          tension={0.5}
          pointerLength={5}
          pointerWidth={5}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={2}
          hitStrokeWidth={10}
          dash={[10, 5]}
          scaleX={-1}
        />
      )}
      {shape.type === ShapeTypes.SPIN_HALF && (
        <Arrow
          {...commonProps}
          points={generateSpiralPoints(12, 2, Math.PI / 17)}
          tension={0.5}
          pointerLength={5}
          pointerWidth={5}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={2}
          hitStrokeWidth={10}
          dash={[10, 5]}
        />
      )}
      {shape.type === ShapeTypes.SPIN_HALF_CW && (
        <Arrow
          {...commonProps}
          points={generateSpiralPoints(12, 2, Math.PI / 17)}
          tension={0.5}
          pointerLength={5}
          pointerWidth={5}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={2}
          hitStrokeWidth={10}
          dash={[10, 5]}
        />
      )}
      {shape.type === ShapeTypes.SPIN_HALF_CCW && (
        <Arrow
          {...commonProps}
          points={generateSpiralPoints(12, 2, Math.PI / 17)}
          tension={0.5}
          pointerLength={5}
          pointerWidth={5}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={2}
          hitStrokeWidth={10}
          dash={[10, 5]}
          scaleX={-1}
        />
      )}
      {shape.type === ShapeTypes.SPIN_QUARTER && (
        <Arrow
          {...commonProps}
          points={generateSpiralPoints(8, 2, Math.PI / 20)}
          tension={0.5}
          pointerLength={5}
          pointerWidth={5}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={2}
          hitStrokeWidth={10}
          dash={[10, 5]}
        />
      )}
      {shape.type === ShapeTypes.SPIN_QUARTER_CW && (
        <Arrow
          {...commonProps}
          points={generateSpiralPoints(8, 2, Math.PI / 20)}
          tension={0.5}
          pointerLength={5}
          pointerWidth={5}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={2}
          hitStrokeWidth={10}
          dash={[10, 5]}
        />
      )}
      {shape.type === ShapeTypes.SPIN_QUARTER_CCW && (
        <Arrow
          {...commonProps}
          points={generateSpiralPoints(8, 2, Math.PI / 20)}
          tension={0.5}
          pointerLength={5}
          pointerWidth={5}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={2}
          hitStrokeWidth={10}
          dash={[10, 5]}
          scaleX={-1}
        />
      )}
      {shape.type === ShapeTypes.STRAIGHT_LINE && (
        <Arrow
          {...commonProps}
          points={[-37.5, 0, 37.5, 0]}
          pointerLength={5}
          pointerWidth={SHAPE_STYLE.POINTER_WIDTH}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={SHAPE_STYLE.STROKE_WIDTH_THICK}
          hitStrokeWidth={SHAPE_STYLE.HIT_STROKE_WIDTH}
          dash={[10, 5]}
        />
      )}
      {shape.type === ShapeTypes.STRAIGHT_LINE_UP && (
        <Arrow
          {...commonProps}
          points={[0, 37.5, 0, -37.5]}
          pointerLength={5}
          pointerWidth={SHAPE_STYLE.POINTER_WIDTH}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={SHAPE_STYLE.STROKE_WIDTH_THICK}
          hitStrokeWidth={SHAPE_STYLE.HIT_STROKE_WIDTH}
          dash={[10, 5]}
        />
      )}
      {shape.type === ShapeTypes.STRAIGHT_LINE_DOWN && (
        <Arrow
          {...commonProps}
          points={[0, -37.5, 0, 37.5]}
          pointerLength={5}
          pointerWidth={SHAPE_STYLE.POINTER_WIDTH}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={SHAPE_STYLE.STROKE_WIDTH_THICK}
          hitStrokeWidth={SHAPE_STYLE.HIT_STROKE_WIDTH}
          dash={[10, 5]}
        />
      )}
      {shape.type === ShapeTypes.QUARTER_CURVED_LINE &&
        (() => {
          const points = generateSpiralPoints(3, 30, Math.PI / 14);
          const center = calculateBoundingBoxCenter(points);
          return (
            <Arrow
              {...commonProps}
              points={points}
              tension={0.5}
              pointerLength={5}
              pointerWidth={5}
              fill={shape.fill}
              stroke={shape.stroke}
              strokeWidth={3}
              hitStrokeWidth={10}
              dash={[10, 5]}
              offsetX={center.x}
              offsetY={center.y}
            />
          );
        })()}
      {shape.type === ShapeTypes.QUARTER_CURVED_LINE_UP &&
        (() => {
          const points = generateSpiralPoints(
            3,
            30,
            Math.PI / 14,
            undefined,
            -Math.PI / 2,
          );
          const center = calculateBoundingBoxCenter(points);
          return (
            <Arrow
              {...commonProps}
              points={points}
              tension={0.5}
              pointerLength={5}
              pointerWidth={5}
              fill={shape.fill}
              stroke={shape.stroke}
              strokeWidth={3}
              hitStrokeWidth={10}
              dash={[10, 5]}
              offsetX={center.x}
              offsetY={center.y}
            />
          );
        })()}
      {shape.type === ShapeTypes.QUARTER_CURVED_LINE_DOWN &&
        (() => {
          const points = generateSpiralPoints(
            3,
            30,
            -Math.PI / 14,
            undefined,
            Math.PI / 2,
          );
          const center = calculateBoundingBoxCenter(points);
          return (
            <Arrow
              {...commonProps}
              points={points}
              tension={0.5}
              pointerLength={5}
              pointerWidth={5}
              fill={shape.fill}
              stroke={shape.stroke}
              strokeWidth={3}
              hitStrokeWidth={10}
              dash={[10, 5]}
              offsetX={center.x}
              offsetY={center.y}
            />
          );
        })()}
      {shape.type === ShapeTypes.HALF_CURVED_LINE &&
        (() => {
          const points = generateSpiralPoints(6, 15, Math.PI / 14);
          const center = calculateBoundingBoxCenter(points);
          return (
            <Arrow
              {...commonProps}
              points={points}
              tension={0.5}
              pointerLength={5}
              pointerWidth={5}
              fill={shape.fill}
              stroke={shape.stroke}
              strokeWidth={3}
              hitStrokeWidth={10}
              dash={[10, 5]}
              offsetX={center.x}
              offsetY={center.y}
            />
          );
        })()}
      {shape.type === ShapeTypes.HALF_CURVED_LINE_UP &&
        (() => {
          const points = generateSpiralPoints(
            6,
            15,
            Math.PI / 14,
            undefined,
            -Math.PI / 2,
          );
          const center = calculateBoundingBoxCenter(points);
          return (
            <Arrow
              {...commonProps}
              points={points}
              tension={0.5}
              pointerLength={5}
              pointerWidth={5}
              fill={shape.fill}
              stroke={shape.stroke}
              strokeWidth={3}
              hitStrokeWidth={10}
              dash={[10, 5]}
              offsetX={center.x}
              offsetY={center.y}
            />
          );
        })()}
      {shape.type === ShapeTypes.HALF_CURVED_LINE_DOWN &&
        (() => {
          const points = generateSpiralPoints(
            6,
            15,
            -Math.PI / 14,
            undefined,
            Math.PI / 2,
          );
          const center = calculateBoundingBoxCenter(points);
          return (
            <Arrow
              {...commonProps}
              points={points}
              tension={0.5}
              pointerLength={5}
              pointerWidth={5}
              fill={shape.fill}
              stroke={shape.stroke}
              strokeWidth={3}
              hitStrokeWidth={10}
              dash={[10, 5]}
              offsetX={center.x}
              offsetY={center.y}
            />
          );
        })()}
      {shape.type === ShapeTypes.SIGNAL && (
        <Arrow
          {...commonProps}
          points={[10, 10, 30, 10]}
          pointerLength={5}
          pointerWidth={5}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={3}
          hitStrokeWidth={10}
        />
      )}
      {shape.type === ShapeTypes.DIRECTION_UP && (
        <Arrow
          {...commonProps}
          points={[10, 30, 10, 10]}
          pointerLength={5}
          pointerWidth={5}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={3}
          hitStrokeWidth={10}
        />
      )}
      {shape.type === ShapeTypes.DIRECTION_DOWN && (
        <Arrow
          {...commonProps}
          points={[10, 10, 10, 30]}
          pointerLength={5}
          pointerWidth={5}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={3}
          hitStrokeWidth={10}
        />
      )}
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
