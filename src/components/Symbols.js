import React, { useRef, useEffect, useCallback } from 'react';
import {
  Transformer,
  Arrow,
  Arc,
  Text,
  Rect,
  Circle,
  Image as KonvaImage,
  RegularPolygon,
} from 'react-konva';
import images from './ImageMapping';
import { useImage } from 'react-konva-utils';
import { useUndoRedo } from './useUndoRedo';

const Symbol = ({
  shape,
  isSelected,
  disabled,
  opacity,
  onShapeSelect,
  onUpdateShapeState,
}) => {
  const { startDragOperation, endDragOperation } = useUndoRedo();
  const shapeRef = useRef();
  const trRef = useRef();

  //Load image for feet symbols
  const [image] = useImage(images[shape.imageKey]);

  //check if its the stage marker
  const isStageX = shape.type === 'stageX';

  // Generates the points for each type of spin
  const generateSpiralPoints = (
    numPoints,
    radiusIncrement,
    angleIncrement,
    pattern,
  ) => {
    const points = [];
    for (let i = 0; i < numPoints; i++) {
      const angle = i * angleIncrement;
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

  const handleDragStart = useCallback(
    (e) => {
      startDragOperation('shape');
    },
    [startDragOperation],
  );

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

  const handleDragEnd = useCallback(
    (e) => {
      const node = e.target;
      onUpdateShapeState({
        x: node.x(),
        y: node.y(),
      });
      endDragOperation();
    },
    [onUpdateShapeState, endDragOperation],
  );

  const handleClick = useCallback(
    (e) => {
      if (disabled || isStageX) return;

      onShapeSelect();
    },
    [disabled, isStageX, onShapeSelect],
  );

  useEffect(() => {
    if (isSelected && !isStageX && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    } else if (!isSelected && trRef.current) {
      // Detach the transformer when the shape is deselected
      trRef.current.nodes([]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected, isStageX]);
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
    if (isSelected && !isStageX && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected, isStageX]);

  const commonProps = {
    ref: shapeRef,
    ...shape,
    opacity: opacity,
    draggable: !disabled,
    scaleX: shape.scaleX || 1,
    scaleY: shape.scaleY || 1,
    rotation: shape.rotation || 0,
    onClick: handleClick,
    onDragStart: handleDragStart,
    onDragMove: handleDragMove,
    onDragEnd: handleDragEnd,
    strokeScaleEnabled: false,
  };

  // Render the chosen shape
  return (
    <>
      {shape.type === 'spinThree' && (
        <Arrow
          {...commonProps}
          points={generateSpiralPoints(30, 1, Math.PI / 6)}
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
      {shape.type === 'spinTwo' && (
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
      {shape.type === 'spinOne' && (
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
      {shape.type === 'spinHalf' && (
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
      {shape.type === 'spinQuarter' && (
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
      {shape.type === 'straightLine' && (
        <Arrow
          {...commonProps}
          points={[10, 10, 75, 10]}
          pointerLength={5}
          pointerWidth={5}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={3}
          hitStrokeWidth={10}
          dash={[10, 5]}
        />
      )}
      {shape.type === 'curvedLine' && (
        <Arrow
          {...commonProps}
          points={generateSpiralPoints(3, 30, Math.PI / 14)}
          tension={0.5}
          pointerLength={5}
          pointerWidth={5}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={3}
          hitStrokeWidth={10}
          dash={[10, 5]}
        />
      )}
      {shape.type === 'signal' && (
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
      {shape.type === 'image' && (
        <KonvaImage {...commonProps} image={image} scaleX={0.3} scaleY={0.3} />
      )}
      {shape.type === 'stageX' && (
        <Text {...commonProps} text="X" fontSize={20} fill="black" />
      )}
      {shape.type === 'knee' && (
        <Circle
          {...commonProps}
          radius={3}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={3}
        />
      )}
      {shape.type === 'waist' && (
        <Rect
          {...commonProps}
          width={12}
          height={2}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={3}
        />
      )}
      {shape.type === 'shoulder' && (
        <Arc
          {...commonProps}
          angle={180}
          innerRadius={0}
          outerRadius={6}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={3}
        />
      )}
      {shape.type === 'overhead' && (
        <RegularPolygon
          {...commonProps}
          sides={3}
          radius={5}
          fill={shape.fill}
          stroke={shape.stroke}
        />
      )}
      {isSelected && !isStageX && (
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
