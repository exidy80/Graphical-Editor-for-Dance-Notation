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
import { useAppContext } from './AppContext';

const Symbol = ({ shapeProps, panelId }) => {
  //Get functions and states from context
  const { opacity, handleShapeSelection, updateShapeState, selectedShapeId } =
    useAppContext();
  //Refs for shapes and transformers
  const shapeRef = useRef();
  const trRef = useRef();
  //Load image for feet symbols
  const [image] = useImage(images[shapeProps.imageKey]);

  //Check if specific shape in a panel is selected
  const isSelected =
    selectedShapeId &&
    selectedShapeId.panelId === panelId &&
    selectedShapeId.shapeId === shapeProps.id;
  //check if it's disabled
  const disabled = opacity.symbols.disabled;
  //check if its the stage marker
  const isStageX = shapeProps.type === 'stageX';

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

  //Handles the end of a drag and pushes the update to the state
  const handleDragEnd = useCallback(
    (e) => {
      const node = e.target;
      updateShapeState(panelId, shapeProps.id, {
        x: node.x(),
        y: node.y(),
      });
    },
    [panelId, shapeProps.id, updateShapeState],
  );

  //Handles click on a shape
  const handleClick = useCallback(
    (e) => {
      if (disabled || isStageX) return;

      handleShapeSelection(panelId, shapeProps.id);
    },
    [
      disabled,
      isStageX,
      panelId,
      shapeProps.id,
      handleShapeSelection,
      isSelected,
    ],
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
  }, [isSelected, isStageX, shapeProps.id]);
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
      updateShapeState(panelId, shapeProps.id, newState);
      // Force selection to remain after transform
    },
    [panelId, shapeProps.id, updateShapeState, handleShapeSelection],
  );

  //common properties for all shapes
  const commonProps = {
    ref: shapeRef,
    ...shapeProps,
    opacity: opacity.symbols.value,
    draggable: !disabled,
    scaleX: shapeProps.scaleX || 1,
    scaleY: shapeProps.scaleY || 1,
    rotation: shapeProps.rotation || 0,
    onClick: handleClick,
    onDragEnd: handleDragEnd,
    strokeScaleEnabled: false,
  };

  //Attach or detach transformer when selection changes
  useEffect(() => {
    if (isSelected && !isStageX && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected, isStageX]);

  // Render the chosen shape
  return (
    <>
      {shapeProps.type === 'spinThree' && (
        <Arrow
          {...commonProps}
          points={generateSpiralPoints(30, 1, Math.PI / 6)}
          tension={0.5}
          pointerLength={5}
          pointerWidth={5}
          stroke={shapeProps.stroke}
          fill={shapeProps.fill}
          strokeWidth={2}
          hitStrokeWidth={10}
          dash={[10, 5]}
        />
      )}
      {shapeProps.type === 'spinTwo' && (
        <Arrow
          {...commonProps}
          points={generateSpiralPoints(20, 1, Math.PI / 6)}
          tension={0.5}
          pointerLength={5}
          pointerWidth={5}
          stroke={shapeProps.stroke}
          fill={shapeProps.fill}
          strokeWidth={2}
          hitStrokeWidth={10}
          dash={[10, 5]}
        />
      )}
      {shapeProps.type === 'spinOne' && (
        <Arrow
          {...commonProps}
          points={generateSpiralPoints(36, 25, Math.PI / 18, 'circle')}
          tension={0.5}
          pointerLength={5}
          pointerWidth={5}
          fill={shapeProps.fill}
          stroke={shapeProps.stroke}
          strokeWidth={2}
          hitStrokeWidth={10}
          dash={[10, 5]}
        />
      )}
      {shapeProps.type === 'spinHalf' && (
        <Arrow
          {...commonProps}
          points={generateSpiralPoints(12, 2, Math.PI / 17)}
          tension={0.5}
          pointerLength={5}
          pointerWidth={5}
          fill={shapeProps.fill}
          stroke={shapeProps.stroke}
          strokeWidth={2}
          hitStrokeWidth={10}
          dash={[10, 5]}
        />
      )}
      {shapeProps.type === 'spinQuarter' && (
        <Arrow
          {...commonProps}
          points={generateSpiralPoints(8, 2, Math.PI / 20)}
          tension={0.5}
          pointerLength={5}
          pointerWidth={5}
          fill={shapeProps.fill}
          stroke={shapeProps.stroke}
          strokeWidth={2}
          hitStrokeWidth={10}
          dash={[10, 5]}
        />
      )}
      {shapeProps.type === 'straightLine' && (
        <Arrow
          {...commonProps}
          points={[10, 10, 75, 10]}
          pointerLength={5}
          pointerWidth={5}
          fill={shapeProps.fill}
          stroke={shapeProps.stroke}
          strokeWidth={3}
          hitStrokeWidth={10}
          dash={[10, 5]}
        />
      )}
      {shapeProps.type === 'curvedLine' && (
        <Arrow
          {...commonProps}
          points={generateSpiralPoints(3, 30, Math.PI / 14)}
          tension={0.5}
          pointerLength={5}
          pointerWidth={5}
          fill={shapeProps.fill}
          stroke={shapeProps.stroke}
          strokeWidth={3}
          hitStrokeWidth={10}
          dash={[10, 5]}
        />
      )}
      {shapeProps.type === 'signal' && (
        <Arrow
          {...commonProps}
          points={[10, 10, 30, 10]}
          pointerLength={5}
          pointerWidth={5}
          fill={shapeProps.fill}
          stroke={shapeProps.stroke}
          strokeWidth={3}
          hitStrokeWidth={10}
        />
      )}
      {shapeProps.type === 'image' && (
        <KonvaImage {...commonProps} image={image} scaleX={0.3} scaleY={0.3} />
      )}
      {shapeProps.type === 'stageX' && (
        <Text {...commonProps} text="X" fontSize={20} fill="black" />
      )}
      {shapeProps.type === 'knee' && (
        <Circle
          {...commonProps}
          radius={3}
          fill={shapeProps.fill}
          stroke={shapeProps.stroke}
          strokeWidth={3}
        />
      )}
      {shapeProps.type === 'waist' && (
        <Rect
          {...commonProps}
          width={12}
          height={2}
          fill={shapeProps.fill}
          stroke={shapeProps.stroke}
          strokeWidth={3}
        />
      )}
      {shapeProps.type === 'shoulder' && (
        <Arc
          {...commonProps}
          angle={180}
          innerRadius={0}
          outerRadius={6}
          fill={shapeProps.fill}
          stroke={shapeProps.stroke}
          strokeWidth={3}
        />
      )}
      {shapeProps.type === 'overhead' && (
        <RegularPolygon
          {...commonProps}
          sides={3}
          radius={5}
          fill={shapeProps.fill}
          stroke={shapeProps.stroke}
        />
      )}
      {/* Transformer for selected shape */}
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
