import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  Group,
  Line,
  RegularPolygon,
  Rect,
  Arc,
  Circle,
  Transformer,
} from 'react-konva';

const Dancer = ({
  dancer,
  isSelected,
  selectedHand,
  opacity,
  disabled,
  chosenHead,
  chosenHandShapes,
  handleDancerSelection,
  handleHandClick,
  updateDancerState,
}) => {
  // setting up references to different parts of the dancer
  const [hoveredHand, setHoveredHand] = useState({ left: false, right: false });

  const dancerRef = useRef();
  const transformerRef = useRef();
  const handTransformerRef = useRef();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handRefs = {
    left: useRef(),
    right: useRef(),
  };

  // Constants for body parts
  const headSize = 30;
  const bodyWidth = 60;
  const bodyHeight = 5;

  // handles when the dancer is transformed (moved, rotated, scaled)
  const handleTransform = useCallback(
    (e) => {
      const node = e.target;
      updateDancerState(dancer.id, {
        x: node.x(), //logs position of dancer on X axis when transformed
        y: node.y(), //logs position on Y axis
        rotation: node.rotation(), //logs rotation
        scaleX: node.scaleX(), //logs scale
        scaleY: node.scaleY(),
      });
    },
    [dancer.id, updateDancerState],
  );

  // This function handles when the dancer is dragged and logs position
  const handleDragEnd = useCallback(
    (e) => {
      const node = e.target;
      if (node === dancerRef.current) {
        updateDancerState(dancer.id, {
          x: node.x(),
          y: node.y(),
        });
      }
    },
    [dancer.id, updateDancerState],
  );

  // This function handles when a part of the dancer (like a hand) is dragged and logs position
  const handlePartDragEnd = useCallback(
    (part, side) => (e) => {
      const newPos = e.target.position();
      updateDancerState(dancer.id, { [`${side}${part}Pos`]: newPos });
    },
    [updateDancerState, dancer.id],
  );

  // This function handles rotating a hand
  const handleHandRotation = useCallback(
    (e) => {
      const node = e.target;
      const rotation = node.rotation();
      updateDancerState(dancer.id, {
        [`${selectedHand.handSide}HandRotation`]: rotation,
      });
    },
    [dancer.id, selectedHand, updateDancerState],
  );

  // These two functions help me manage the transformer for the hands
  const resetHandTransformer = useCallback(() => {
    if (handTransformerRef.current) {
      handTransformerRef.current.nodes([]);
      handTransformerRef.current.getLayer().batchDraw();
    }
  }, []);

  const attachHandTransformer = useCallback(() => {
    if (selectedHand) {
      const handNode = handRefs[selectedHand.handSide].current;
      if (handNode && handTransformerRef.current) {
        handTransformerRef.current.nodes([handNode]);
        handTransformerRef.current.getLayer().batchDraw();
      }
    }
  }, [handRefs, selectedHand]);

  useEffect(() => {
    if (isSelected && dancerRef.current) {
      transformerRef.current.nodes([dancerRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }

    if (selectedHand) {
      attachHandTransformer();
    } else {
      resetHandTransformer();
    }
  }, [isSelected, selectedHand, resetHandTransformer, attachHandTransformer]);

  useEffect(() => {
    resetHandTransformer();
    requestAnimationFrame(() => {
      attachHandTransformer();
    });
  }, [chosenHandShapes, resetHandTransformer, attachHandTransformer]);

  // This function renders the head of the dancer
  const renderHead = () => {
    const baseProps = {
      fill: dancer.colour,
      opacity,
      onClick: disabled ? null : () => handleDancerSelection(dancer.id),
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
        return (
          <RegularPolygon {...baseProps} sides={3} radius={headSize / 2} />
        );
    }
  };

  // This function renders the hands of the dancer
  const renderHand = (side) => {
    const handPos = dancer[`${side}HandPos`];
    const handShape = chosenHandShapes[side];
    const isHandSelected = selectedHand && selectedHand.handSide === side;
    const isHovered = hoveredHand[side];
  
    const shadowProps = {
      shadowColor: dancer.colour,
      shadowBlur: 5,
      shadowOpacity: 1, 
    };
    
  
    return (
      <Group
        x={handPos.x}
        y={handPos.y}
        rotation={dancer[`${side}HandRotation`] || 0}
        draggable={!disabled}
        onDragMove={handlePartDragEnd('Hand', side)}
        onDragEnd={handlePartDragEnd('Hand', side)}
        onClick={disabled ? null : () => handleHandClick(dancer.id, side)}
        onMouseEnter={() =>
          setHoveredHand((prev) => ({ ...prev, [side]: true }))
        }
        onMouseLeave={() =>
          setHoveredHand((prev) => ({ ...prev, [side]: false }))
        }
        ref={handRefs[side]}
        name={`${side}Hand`}
      >
        {(() => {
          switch (handShape) {
            case 'Knee':
              return (
                <>
                  <Circle
                    radius={5}
                    offsetY={5}
                    fill={dancer.colour}
                    {...(isHandSelected || isHovered ? shadowProps : {})}
                  />
                </>
              );
            case 'Shoulder':
              return (
                <>
                  <Arc
                    angle={180}
                    innerRadius={0}
                    outerRadius={8}
                    rotation={180}
                    fill={dancer.colour}
                    {...(isHandSelected || isHovered ? shadowProps : {})}
                  />
                </>
              );
            case 'Overhead':
              return (
                <>
                  <RegularPolygon
                    sides={3}
                    radius={7}
                    offsetY={-1}
                    fill={dancer.colour}
                    {...(isHandSelected || isHovered ? shadowProps : {})}
                  />
                </>
              );
            case 'Waist':
            default:
              return (
                <>
                  <Rect
                    width={15}
                    height={5}
                    offsetX={7.5}
                    offsetY={2.5}
                    fill={dancer.colour}
                    {...(isHandSelected || isHovered ? shadowProps : {})}
                  />
                </>
              );
          }
        })()}
        {/* Invisible enlarged hit area */}
        {/* <Rect width={30} height={30} offsetX={15} offsetY={15} opacity={0} /> */}
      </Group>
    );
  };
  
  
  //Allows clicking of arm to change thickness
  const handleArmClick = useCallback(
    (side, part) => (e) => {
      if (disabled) return; // Extra check to prevent execution when disabled
      const currentThickness = dancer[`${side}${part}ArmThickness`];
      const newThickness = currentThickness === 'thick' ? 'thin' : 'thick';
      updateDancerState(dancer.id, {
        [`${side}${part}ArmThickness`]: newThickness,
      });
    },
    [dancer.id, dancer, updateDancerState, disabled],
  );

  //renders the Arm
  const renderArm = (side) => {
    const elbowPos = dancer[`${side}ElbowPos`];
    const handPos = dancer[`${side}HandPos`];
    const upperArmThickness = dancer[`${side}UpperArmThickness`] || 'thick';
    const lowerArmThickness = dancer[`${side}LowerArmThickness`] || 'thick';
    const shoulderX = side === 'left' ? -bodyWidth / 2 : bodyWidth / 2;
    const shoulderY = headSize / 4;

    return (
      <Group key={`${side}arm${dancer.id}`}>
        <Line
          points={[shoulderX, shoulderY, elbowPos.x, elbowPos.y]}
          stroke={dancer.colour}
          strokeWidth={upperArmThickness === 'thick' ? 5 : 2}
          hitStrokeWidth={10}
          onClick={handleArmClick(side, 'Upper')}
        />
        <Line
          points={[elbowPos.x, elbowPos.y, handPos.x, handPos.y]}
          stroke={dancer.colour}
          strokeWidth={lowerArmThickness === 'thick' ? 5 : 2}
          hitStrokeWidth={10}
          onClick={handleArmClick(side, 'Lower')}
        />
        <Circle
          x={elbowPos.x}
          y={elbowPos.y}
          radius={3}
          fill={dancer.colour}
          draggable={!disabled}
          onDragMove={handlePartDragEnd('Elbow', side)}
          onDragEnd={handlePartDragEnd('Elbow', side)}
        />
        {renderHand(side)}
      </Group>
    );
  };

  // Finally, I'm returning the complete dancer component
  return (
    <>
      <Group
        x={dancer.x}
        y={dancer.y}
        rotation={dancer.rotation}
        scaleX={dancer.scaleX || 1}
        scaleY={dancer.scaleY || 1}
        opacity={opacity}
        draggable={!disabled}
        ref={dancerRef}
        onDragEnd={handleDragEnd}
        onTransform={handleTransform}
      >
        {renderHead()}
        <Rect
          width={bodyWidth}
          height={bodyHeight}
          fill={dancer.colour}
          y={headSize / 4}
          offsetX={bodyWidth / 2}
        />
        {['left', 'right'].map((side) => renderArm(side))}
      </Group>
      {isSelected && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) =>
            newBox.width < 5 || newBox.height < 5 ? oldBox : newBox
          }
          onTransform={handleTransform}
        />
      )}
      {selectedHand && (
        <Transformer
          ref={handTransformerRef}
          resizeEnabled={false}
          onTransform={handleHandRotation}
        />
      )}
    </>
  );
};

export default Dancer;
