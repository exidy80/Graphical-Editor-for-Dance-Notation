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

const Symbol = ({
  shapeProps,
  opacity,
  disabled,
  handleShapeSelection,
  updateShapeState,
  isSelected,
}) => {
  //Refs for shapes and transformers
  const shapeRef = useRef();
  const trRef = useRef();
  //Load image for feet symbols
  const [image] = useImage(images[shapeProps.imageKey]);

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
      const radius =
        pattern === 'circle' ? radiusIncrement : i * radiusIncrement;
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
      updateShapeState(shapeProps.id, {
        x: node.x(),
        y: node.y(),
      });
    },
    [shapeProps.id, updateShapeState],
  );

  //Handles click on a shape
  const handleClick = useCallback(
    (e) => {
      if (disabled || isStageX) return;

      handleShapeSelection(shapeProps.id);
    },
    [disabled, isStageX, shapeProps.id, handleShapeSelection],
  );

  //Attach or detach transformer when selection changes
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
      updateShapeState(shapeProps.id, newState);
      // Force selection to remain after transform
    },
    [shapeProps.id, updateShapeState],
  );

  //common properties for all shapes
  const commonProps = {
    ref: shapeRef,
    ...shapeProps,
    opacity,
    draggable: !disabled,
    scaleX: shapeProps.scaleX || 1,
    scaleY: shapeProps.scaleY || 1,
    rotation: shapeProps.rotation || 0,
    onClick: handleClick,
    onDragEnd: handleDragEnd,
    strokeScaleEnabled: false,
  };

  const shapeRenderers = {
    spinThree: (props) => (
      <Arrow
        {...props}
        points={generateSpiralPoints(30, 1, Math.PI / 6)}
        tension={0.5}
        pointerLength={5}
        pointerWidth={5}
        strokeWidth={2}
        hitStrokeWidth={10}
        dash={[10, 5]}
      />
    ),
    spinTwo: (props) => (
      <Arrow
        {...props}
        points={generateSpiralPoints(20, 1, Math.PI / 6)}
        tension={0.5}
        pointerLength={5}
        pointerWidth={5}
        strokeWidth={2}
        hitStrokeWidth={10}
        dash={[10, 5]}
      />
    ),
    spinOne: (props) => (
      <Arrow
        {...props}
        points={generateSpiralPoints(36, 25, Math.PI / 18, 'circle')}
        tension={0.5}
        pointerLength={5}
        pointerWidth={5}
        strokeWidth={2}
        hitStrokeWidth={10}
        dash={[10, 5]}
      />
    ),
    spinHalf: (props) => (
      <Arrow
        {...props}
        points={generateSpiralPoints(12, 2, Math.PI / 17)}
        tension={0.5}
        pointerLength={5}
        pointerWidth={5}
        strokeWidth={2}
        hitStrokeWidth={10}
        dash={[10, 5]}
      />
    ),
    spinQuarter: (props) => (
      <Arrow
        {...props}
        points={generateSpiralPoints(8, 2, Math.PI / 20)}
        tension={0.5}
        pointerLength={5}
        pointerWidth={5}
        strokeWidth={2}
        hitStrokeWidth={10}
        dash={[10, 5]}
      />
    ),
    straightLine: (props) => (
      <Arrow
        {...props}
        points={[10, 10, 75, 10]}
        pointerLength={5}
        pointerWidth={5}
        strokeWidth={3}
        hitStrokeWidth={10}
        dash={[10, 5]}
      />
    ),
    curvedLine: (props) => (
      <Arrow
        {...props}
        points={generateSpiralPoints(3, 30, Math.PI / 14)}
        tension={0.5}
        pointerLength={5}
        pointerWidth={5}
        strokeWidth={3}
        hitStrokeWidth={10}
        dash={[10, 5]}
      />
    ),
    signal: (props) => (
      <Arrow
        {...props}
        points={[10, 10, 30, 10]}
        pointerLength={5}
        pointerWidth={5}
        strokeWidth={3}
        hitStrokeWidth={10}
      />
    ),
    image: (props) => (
      <KonvaImage {...props} image={image} scaleX={0.3} scaleY={0.3} />
    ),
    stageX: (props) => <Text {...props} text="X" fontSize={20} fill="black" />,
    knee: (props) => <Circle {...props} radius={3} strokeWidth={3} />,
    waist: (props) => <Rect {...props} width={12} height={2} strokeWidth={3} />,
    shoulder: (props) => (
      <Arc
        {...props}
        angle={180}
        innerRadius={0}
        outerRadius={6}
        strokeWidth={3}
      />
    ),
    overhead: (props) => <RegularPolygon {...props} sides={3} radius={5} />,
  };

  const renderShape = shapeRenderers[shapeProps.type];

  return (
    <>
      {renderShape
        ? renderShape({
            ...commonProps,
            fill: shapeProps.fill,
            stroke: shapeProps.stroke,
          })
        : null}
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
