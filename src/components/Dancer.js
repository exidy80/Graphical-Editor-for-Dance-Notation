import React, { useRef, useEffect, useCallback } from 'react';
import {
  Group,
  Line,
  RegularPolygon,
  Path,
  Rect,
  Arc,
  Circle,
  Transformer,
} from 'react-konva';
import {
  DANCER_DIMENSIONS,
  HAND_DIMENSIONS,
  ARM_THICKNESS,
  UI_DIMENSIONS,
} from '../utils/dimensions';

const Dancer = ({
  dancer,
  chosenHead,
  chosenHandShapes,
  isSelected,
  selectedHandSide,
  handFlash,
  disabled,
  opacity,
  onDancerSelect,
  onHandClick,
  onUpdateDancerState,
  onUpdateHandPosition,
  onUpdateHandRotation,
  onDragStart,
  onDragEnd,
  isGlowing,
  renderOnly = 'all', // 'all', 'body', or 'arms'
}) => {
  const dancerRef = useRef();
  const headRef = useRef();
  const bodyRef = useRef();
  const leftUpperArmRef = useRef();
  const leftLowerArmRef = useRef();
  const rightUpperArmRef = useRef();
  const rightLowerArmRef = useRef();
  const transformerRef = useRef();
  const handTransformerRef = useRef();
  const handRefs = {
    left: useRef(),
    right: useRef(),
  };

  const headSize = DANCER_DIMENSIONS.HEAD_SIZE;
  const bodyWidth = DANCER_DIMENSIONS.BODY_WIDTH;
  const bodyHeight = DANCER_DIMENSIONS.BODY_HEIGHT;

  // handles when the dancer is transformed (moved, rotated, scaled)
  const handleTransform = useCallback(
    (e) => {
      const node = e.target;
      onUpdateDancerState({
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
        scaleX: node.scaleX(),
        scaleY: node.scaleY(),
      });
    },
    [onUpdateDancerState],
  );

  // handles when the dancer drag starts
  const handleDragStart = useCallback(() => {
    onDragStart();
  }, [onDragStart]);

  // handles when the dancer transform starts
  const handleTransformStart = useCallback(() => {
    onDragStart();
  }, [onDragStart]);

  // handles when the dancer is being dragged
  const handleDragMove = useCallback(
    (e) => {
      const node = e.target;
      if (node === dancerRef.current) {
        onUpdateDancerState({
          x: node.x(),
          y: node.y(),
        });
      }
    },
    [onUpdateDancerState],
  );

  // handles when the dancer drag is complete
  const handleDragEnd = useCallback(
    (e) => {
      const node = e.target;
      if (node === dancerRef.current) {
        onDragEnd({
          x: node.x(),
          y: node.y(),
        });
      }
    },
    [onDragEnd],
  );

  // handles when the dancer transform ends
  const handleTransformEnd = useCallback(() => {
    onDragEnd();
  }, [onDragEnd]);

  // This function handles when a part drag starts
  const handlePartDragStartCallback = useCallback(
    (part, side) => (e) => {
      const currentPos = e.target.position();
      // Capture initial position before starting drag
      if (part === 'Hand') {
        onUpdateHandPosition(side, currentPos);
      } else if (part === 'Elbow') {
        onUpdateDancerState({ [`${side}${part}Pos`]: currentPos });
      }
      // Now start drag mode to pause tracking
      onDragStart();
    },
    [onUpdateDancerState, onUpdateHandPosition, onDragStart],
  );

  // This function handles when a part of the dancer (like a hand) is being dragged
  const handlePartDragMove = useCallback(
    (part, side) => (e) => {
      const newPos = e.target.position();
      if (part === 'Hand') {
        onUpdateHandPosition(side, newPos);
      } else if (part === 'Elbow') {
        // Elbow position changes don't need lock enforcement since they
        // don't affect transform properties (x, y, rotation, scale)
        onUpdateDancerState({ [`${side}${part}Pos`]: newPos });
      }
    },
    [onUpdateDancerState, onUpdateHandPosition],
  );

  // This function handles when a part drag ends
  const handlePartDragEndCallback = useCallback(
    (part, side) => (e) => {
      const newPos = e.target.position();
      // Call onDragEnd FIRST to resume tracking, THEN do the final update
      onDragEnd();
      if (part === 'Hand') {
        onUpdateHandPosition(side, newPos);
      } else if (part === 'Elbow') {
        onUpdateDancerState({ [`${side}${part}Pos`]: newPos });
      }
    },
    [onUpdateDancerState, onUpdateHandPosition, onDragEnd],
  );

  // This function handles when hand rotation starts
  const handleHandRotationStartCallback = useCallback(
    (e) => {
      const node = e.target;
      const rotation = node.rotation();
      // Capture initial rotation before starting
      if (selectedHandSide) {
        onUpdateHandRotation(selectedHandSide, rotation);
      }
      // Now start drag mode to pause tracking
      onDragStart();
    },
    [selectedHandSide, onUpdateHandRotation, onDragStart],
  );

  // This function handles rotating a hand (during transform)
  const handleHandRotation = useCallback(
    (e) => {
      const node = e.target;
      const rotation = node.rotation();
      if (selectedHandSide) {
        onUpdateHandRotation(selectedHandSide, rotation);
      }
    },
    [selectedHandSide, onUpdateHandRotation],
  );

  // This function handles when hand rotation ends
  const handleHandRotationEndCallback = useCallback(
    (e) => {
      const node = e.target;
      const rotation = node.rotation();
      // Call onDragEnd FIRST to resume tracking, THEN do the final update
      onDragEnd();
      if (selectedHandSide) {
        onUpdateHandRotation(selectedHandSide, rotation);
      }
    },
    [selectedHandSide, onUpdateHandRotation, onDragEnd],
  );

  const handleHandMouseEnter = (e) => {
    const shape = e.target;
    shape.shadowColor(dancer.colour);
    shape.shadowBlur(10);
    shape.shadowOpacity(1);
    shape.shadowOffsetX(0);
    shape.shadowOffsetY(0);
    shape.getLayer().batchDraw();
  };

  const handleHandMouseLeave = (e) => {
    const shape = e.target;
    shape.shadowColor(null);
    shape.shadowBlur(0);
    shape.shadowOpacity(0);
    shape.shadowOffsetX(0);
    shape.shadowOffsetY(0);
    shape.getLayer().batchDraw();
  };

  const handleElbowMouseEnter = (e) => {
    const shape = e.target;
    shape.shadowColor(dancer.colour);
    shape.shadowBlur(10);
    shape.shadowOpacity(1);
    shape.shadowOffsetX(0);
    shape.shadowOffsetY(0);
    shape.getLayer().batchDraw();
  };

  const handleElbowMouseLeave = (e) => {
    const shape = e.target;
    shape.shadowColor(null);
    shape.shadowBlur(0);
    shape.shadowOpacity(0);
    shape.shadowOffsetX(0);
    shape.shadowOffsetY(0);
    shape.getLayer().batchDraw();
  };

  const resetHandTransformer = useCallback(() => {
    if (handTransformerRef.current) {
      handTransformerRef.current.nodes([]);
      handTransformerRef.current.getLayer().batchDraw();
    }
  }, []);

  const attachHandTransformer = useCallback(() => {
    if (selectedHandSide) {
      const handNode = handRefs[selectedHandSide].current;
      if (handNode && handTransformerRef.current) {
        handTransformerRef.current.nodes([handNode]);
        handTransformerRef.current.getLayer().batchDraw();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHandSide]);

  //Keeps arms tracking hands
  useEffect(() => {
    const updateArm = (side) => {
      const upperArm =
        side === 'left' ? leftUpperArmRef.current : rightUpperArmRef.current;
      const lowerArm =
        side === 'left' ? leftLowerArmRef.current : rightLowerArmRef.current;
      const shoulderX = side === 'left' ? -bodyWidth / 2 : bodyWidth / 2;
      const elbowPos = dancer[`${side}ElbowPos`];
      const handPos = dancer[`${side}HandPos`];

      if (upperArm && lowerArm) {
        upperArm.points([shoulderX, headSize / 4, elbowPos.x, elbowPos.y]);
        lowerArm.points([elbowPos.x, elbowPos.y, handPos.x, handPos.y]);
      }
    };

    updateArm('left');
    updateArm('right');
  }, [dancer, chosenHandShapes, bodyWidth, headSize]);

  useEffect(() => {
    if (renderOnly !== 'all') return;

    if (isSelected && dancerRef.current && transformerRef.current) {
      transformerRef.current.nodes([dancerRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }

    if (selectedHandSide) {
      attachHandTransformer();
    } else {
      resetHandTransformer();
    }
  }, [
    isSelected,
    selectedHandSide,
    resetHandTransformer,
    attachHandTransformer,
    renderOnly,
  ]);

  useEffect(() => {
    if (renderOnly !== 'all') return;

    resetHandTransformer();
    // Timeout here to make sure the reset happens before reattaching when hand shape changed
    setTimeout(attachHandTransformer, 0);
  }, [
    chosenHandShapes,
    resetHandTransformer,
    attachHandTransformer,
    renderOnly,
  ]);

  const renderHead = () => {
    const baseProps = {
      ref: headRef,
      fill: dancer.colour,
      opacity: opacity,
      onClick: disabled ? null : onDancerSelect,
    };

    switch (chosenHead) {
      case 'Bow':
        return (
          <Rect
            {...baseProps}
            width={bodyWidth / 2}
            height={bodyHeight * 2}
            x={-15}
          />
        );
      case 'Duck':
        return (
          <Arc
            {...baseProps}
            outerRadius={15}
            rotation={180}
            angle={180}
            y={10}
            innerRadius={0}
          />
        );
      case 'Upright':
      default:
        // 90-degree apex isosceles triangle pointing up
        // Match original RegularPolygon positioning
        const apexY = -headSize / 2; // -15
        const baseY = headSize / 4 + headSize / 8; // 7.5 to match body overlap
        const triangleHeight = baseY - apexY; // ~22.5
        const baseHalfWidth = triangleHeight; // For 90° apex: tan(45°) = 1, so base half-width = height
        return (
          <Path
            {...baseProps}
            data={`M 0,${apexY} L ${-baseHalfWidth},${baseY} L ${baseHalfWidth},${baseY} Z`}
          />
        );
    }
  };

  const renderHand = (side) => {
    const handPos = dancer[`${side}HandPos`];
    const handShape = chosenHandShapes[side];
    const isHandSelected = selectedHandSide === side;

    const isFlashing = handFlash.some((h) => h.side === side);
    const baseProps = {
      fill: dancer.colour,
      draggable: !disabled,
      onDragStart: handlePartDragStartCallback('Hand', side),
      onDragMove: handlePartDragMove('Hand', side),
      onDragEnd: handlePartDragEndCallback('Hand', side),
      onClick: disabled ? null : () => onHandClick(side),
      x: handPos.x,
      y: handPos.y,
      rotation: dancer[`${side}HandRotation`] || 0,
      ref: handRefs[side],
      name: `${side}Hand`,
      shadowColor: isHandSelected || isFlashing ? dancer.colour : null,
      shadowBlur: isHandSelected || isFlashing ? 15 : 0,
      shadowOpacity: isHandSelected || isFlashing ? 1 : 0,
    };

    switch (handShape) {
      case 'Knee':
        return (
          <Group {...baseProps}>
            <Circle
              fill={dancer.colour}
              radius={5}
              offsetY={5}
              onMouseEnter={handleHandMouseEnter}
              onMouseLeave={handleHandMouseLeave}
            />
            {/* This invisible rectangle adjusts the rotation point */}
            <Rect width={1} height={10} opacity={0} />
          </Group>
        );
      case 'Hip':
        return (
          <Group {...baseProps}>
            <Circle
              stroke={dancer.colour}
              strokeWidth={2}
              radius={5}
              offsetY={5}
              onMouseEnter={handleHandMouseEnter}
              onMouseLeave={handleHandMouseLeave}
            />
            {/* This invisible rectangle adjusts the rotation point */}
            <Rect width={1} height={10} opacity={0} />
          </Group>
        );
      case 'Shoulder':
        return (
          <Group {...baseProps}>
            <RegularPolygon
              sides={4}
              radius={7}
              stroke={dancer.colour}
              strokeWidth={2}
              offsetY={-1}
              onMouseEnter={handleHandMouseEnter}
              onMouseLeave={handleHandMouseLeave}
            />
            {/* This invisible rectangle adjusts the rotation point */}
            <Rect width={1} height={10} opacity={0} />
          </Group>
        );
      case 'Overhead':
        return (
          <Group {...baseProps}>
            <RegularPolygon
              sides={4}
              radius={7}
              fill={dancer.colour}
              offsetY={-1}
              onMouseEnter={handleHandMouseEnter}
              onMouseLeave={handleHandMouseLeave}
            />
            {/* This invisible rectangle adjusts the rotation point */}
            <Rect width={1} height={10} opacity={0} />
          </Group>
        );
      case 'Waist':
      default:
        return (
          <Rect
            {...baseProps}
            width={HAND_DIMENSIONS.WIDTH}
            height={HAND_DIMENSIONS.HEIGHT}
            offsetX={7.5}
            offsetY={2.5}
            onMouseEnter={handleHandMouseEnter}
            onMouseLeave={handleHandMouseLeave}
          />
        );
    }
  };
  //Allows clicking of arm to change thickness
  const handleArmClick = useCallback(
    (side, part) => (e) => {
      if (disabled) return; // Extra check to prevent execution when disabled
      const currentThickness = dancer[`${side}${part}ArmThickness`];
      const newThickness = currentThickness === 'thick' ? 'thin' : 'thick';
      // Arm thickness changes automatically don't trigger lock enforcement
      onUpdateDancerState({
        [`${side}${part}ArmThickness`]: newThickness,
      });
    },
    [dancer, onUpdateDancerState, disabled],
  );

  const renderArm = (side) => {
    const upperArmThickness = dancer[`${side}UpperArmThickness`] || 'thick';
    const lowerArmThickness = dancer[`${side}LowerArmThickness`] || 'thick';

    return (
      <Group key={`${side}arm${dancer.id}`}>
        <Line
          ref={side === 'left' ? leftUpperArmRef : rightUpperArmRef}
          stroke={dancer.colour}
          strokeWidth={
            upperArmThickness === 'thick'
              ? ARM_THICKNESS.THICK
              : ARM_THICKNESS.THIN
          } //The two thickness options to toggle between
          hitStrokeWidth={ARM_THICKNESS.HIT_STROKE_WIDTH} // Consistent hitbox
          onClick={(e) => handleArmClick(side, 'Upper')(e)}
          shadowColor={isGlowing ? dancer.colour : null}
          shadowBlur={isGlowing ? 15 : 0}
          shadowOpacity={isGlowing ? 1 : 0}
        />
        <Line
          ref={side === 'left' ? leftLowerArmRef : rightLowerArmRef}
          stroke={dancer.colour}
          strokeWidth={
            lowerArmThickness === 'thick'
              ? ARM_THICKNESS.THICK
              : ARM_THICKNESS.THIN
          }
          shadowColor={isGlowing ? dancer.colour : null}
          shadowBlur={isGlowing ? 15 : 0}
          shadowOpacity={isGlowing ? 1 : 0}
          hitStrokeWidth={ARM_THICKNESS.HIT_STROKE_WIDTH} // Consistent hitbox
          onClick={(e) => handleArmClick(side, 'Lower')(e)}
        />
        <Circle
          x={dancer[`${side}ElbowPos`].x}
          y={dancer[`${side}ElbowPos`].y}
          radius={3}
          fill={dancer.colour}
          draggable={!disabled}
          onDragStart={handlePartDragStartCallback('Elbow', side)}
          onDragMove={handlePartDragMove('Elbow', side)}
          onDragEnd={handlePartDragEndCallback('Elbow', side)}
          onMouseEnter={handleElbowMouseEnter}
          onMouseLeave={handleElbowMouseLeave}
          shadowColor={isGlowing ? dancer.colour : null}
          shadowBlur={isGlowing ? 15 : 0}
          shadowOpacity={isGlowing ? 1 : 0}
        />
        {renderHand(side)}
      </Group>
    );
  };

  return (
    <>
      <Group
        x={dancer.x}
        y={dancer.y}
        rotation={dancer.rotation}
        scaleX={dancer.scaleX || 1}
        scaleY={dancer.scaleY || 1}
        opacity={
          renderOnly === 'all' && (isSelected || selectedHandSide) ? 0 : opacity
        }
        draggable={!disabled && (renderOnly === 'body' || renderOnly === 'all')}
        ref={dancerRef}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onTransform={handleTransform}
        onTransformEnd={handleTransformEnd}
        data-testid={`dancer-body-${dancer.id}`}
      >
        {(renderOnly === 'all' || renderOnly === 'body') && (
          <>
            {renderHead()}
            <Rect
              ref={bodyRef}
              width={bodyWidth}
              height={bodyHeight}
              fill={dancer.colour}
              y={headSize / 4}
              offsetX={bodyWidth / 2}
              shadowColor={isGlowing ? dancer.colour : null}
              shadowBlur={isGlowing ? 15 : 0}
              shadowOpacity={isGlowing ? 1 : 0}
            />
          </>
        )}
        {(renderOnly === 'all' || renderOnly === 'arms') &&
          ['left', 'right'].map((side) => renderArm(side))}
      </Group>
      {isSelected && renderOnly === 'all' && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) =>
            newBox.width < UI_DIMENSIONS.MIN_TRANSFORM_SIZE ||
            newBox.height < UI_DIMENSIONS.MIN_TRANSFORM_SIZE
              ? oldBox
              : newBox
          }
          onTransformStart={handleTransformStart}
          onTransform={handleTransform}
          onTransformEnd={handleTransformEnd}
        />
      )}
      {selectedHandSide && renderOnly === 'all' && (
        <Transformer
          ref={handTransformerRef}
          resizeEnabled={false}
          onTransformStart={handleHandRotationStartCallback}
          onTransform={handleHandRotation}
          onTransformEnd={handleHandRotationEndCallback}
        />
      )}
    </>
  );
};

export default Dancer;
