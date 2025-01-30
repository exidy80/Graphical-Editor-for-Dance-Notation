import React, { useRef, useEffect, useCallback } from 'react';
import {
  Group,
  Line,
  RegularPolygon,
  Rect,
  Arc,
  Circle,
  Transformer,
} from 'react-konva';
import { useAppContext } from './AppContext';
import { constrainToCircle, calculateAngle } from '../utils/trigonometry';

const Dancer = ({ panelId, id }) => {
  // Imports from context file
  const {
    panels,
    selectedDancer,
    selectedHand,
    opacity,
    handleDancerSelection,
    handleHandClick,
    updateDancerState,
  } = useAppContext();

  // setting up references to different parts of the dancer
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

  // finding the specific dancer to render
  const panel = panels.find((p) => p.id === panelId);
  const dancer = panel.dancers.find((d) => d.id === id);
  const chosenHead = panel.headShapes[panel.dancers.indexOf(dancer)];
  const chosenHandShapes = panel.handShapes[panel.dancers.indexOf(dancer)];

  // checking if this dancer is currently selected
  const isSelected =
    selectedDancer &&
    selectedDancer.panelId === panelId &&
    selectedDancer.dancerId === id;
  const disabled = opacity.dancers.disabled; //Can't select dancer if it's been disabled

  // Constants for body parts
  const headSize = 30;
  const bodyWidth = 60;
  const bodyHeight = 5;

  // handles when the dancer is transformed (moved, rotated, scaled)
  const handleTransform = useCallback(
    (e) => {
      const node = e.target;
      updateDancerState(panelId, id, {
        x: node.x(), //logs position of dancer on X axis when transformed
        y: node.y(), //logs position on Y axis
        rotation: node.rotation(), //logs rotation
        scaleX: node.scaleX(), //logs scale
        scaleY: node.scaleY(),
      });
    },
    [panelId, id, updateDancerState],
  );

  // This function handles when the dancer is dragged and logs position
  const handleDragEnd = useCallback(
    (e) => {
      const node = e.target;
      if (node === dancerRef.current) {
        updateDancerState(panelId, id, {
          x: node.x(),
          y: node.y(),
        });
      }
    },
    [panelId, id, updateDancerState],
  );

  const handleHandDragMove = useCallback(
    (side) => (e) => {
      const node = e.target;
      const newPos = node.position();
      const elbowPos = dancer[`${side}ElbowPos`];
      const shoulderPos = {
        x: side === 'left' ? -bodyWidth / 2 : bodyWidth / 2,
        y: headSize / 4,
      };

      // Calculate constrained hand position
      const constrainedHandPos = constrainToCircle(elbowPos, newPos, 32);
      const angle = calculateAngle(
        shoulderPos,
        elbowPos,
        constrainedHandPos,
        side,
      );

      if (angle > 180) {
        node.position(dancer[`${side}HandPos`]); // Freeze position
      } else {
        node.position(constrainedHandPos); // Update visually
        updateDancerState(panelId, id, {
          [`${side}HandPos`]: constrainedHandPos,
        });
      }
    },
    [updateDancerState, panelId, id, dancer, bodyWidth, headSize],
  );

  const handleElbowDragMove = useCallback(
    (side) => (e) => {
      const node = e.target;
      const newPos = node.position();
      const shoulderPos = {
        x: side === 'left' ? -bodyWidth / 2 : bodyWidth / 2,
        y: headSize / 4,
      };
      const handPos = dancer[`${side}HandPos`];

      // Calculate constrained elbow and hand positions
      const { constrainedElbowPos, constrainedHandPos, angle } =
        calculateConstrainedArmPositions({
          shoulderPos,
          elbowPos: newPos,
          handPos,
          upperArmLength: 30,
          lowerArmLength: 32,
          side,
        });

      if (angle > 180) {
        node.position(dancer[`${side}ElbowPos`]); // Freeze position
      } else {
        node.position(constrainedElbowPos); // Update elbow visually
        updateDancerState(panelId, id, {
          [`${side}ElbowPos`]: constrainedElbowPos,
          [`${side}HandPos`]: constrainedHandPos,
        });
      }
    },
    [updateDancerState, panelId, id, dancer, bodyWidth, headSize],
  );

  const calculateConstrainedArmPositions = ({
    shoulderPos,
    elbowPos,
    handPos,
    upperArmLength,
    lowerArmLength,
    side,
  }) => {
    // Constrain elbow to the upper arm circle
    const constrainedElbowPos = constrainToCircle(
      shoulderPos,
      elbowPos,
      upperArmLength,
    );

    // Constrain hand to the lower arm circle from the new elbow position
    const constrainedHandPos = constrainToCircle(
      constrainedElbowPos,
      handPos,
      lowerArmLength,
    );

    // Calculate the angle between shoulder, elbow, and hand
    const angle = calculateAngle(
      shoulderPos,
      constrainedElbowPos,
      constrainedHandPos,
      side,
    );

    return {
      constrainedElbowPos,
      constrainedHandPos,
      angle,
    };
  };

  // This function handles rotating a hand
  const handleHandRotation = useCallback(
    (e) => {
      const node = e.target;
      const rotation = node.rotation();
      updateDancerState(panelId, id, {
        [`${selectedHand.handSide}HandRotation`]: rotation,
      });
    },
    [panelId, id, selectedHand, updateDancerState],
  );

  // These two functions help me manage the transformer for the hands
  const resetHandTransformer = useCallback(() => {
    if (handTransformerRef.current) {
      handTransformerRef.current.nodes([]);
      handTransformerRef.current.getLayer().batchDraw();
    }
  }, []);

  const attachHandTransformer = useCallback(() => {
    if (
      selectedHand &&
      selectedHand.panelId === panelId &&
      selectedHand.dancerId === id
    ) {
      const handNode = handRefs[selectedHand.handSide].current;
      if (handNode && handTransformerRef.current) {
        handTransformerRef.current.nodes([handNode]);
        handTransformerRef.current.getLayer().batchDraw();
      }
    }
  }, [selectedHand, panelId, id]);

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
  }, [dancer, chosenHandShapes]);

  useEffect(() => {
    if (isSelected && dancerRef.current) {
      transformerRef.current.nodes([dancerRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }

    if (
      selectedHand &&
      selectedHand.panelId === panelId &&
      selectedHand.dancerId === id
    ) {
      attachHandTransformer();
    } else {
      resetHandTransformer();
    }
  }, [
    isSelected,
    selectedHand,
    panelId,
    id,
    resetHandTransformer,
    attachHandTransformer,
  ]);

  useEffect(() => {
    resetHandTransformer();
    // I'm using a timeout here to make sure the reset happens before reattaching when hand shape changed
    setTimeout(attachHandTransformer, 0);
  }, [chosenHandShapes, resetHandTransformer, attachHandTransformer]);

  // This function renders the head of the dancer
  const renderHead = () => {
    const baseProps = {
      ref: headRef,
      fill: dancer.colour,
      opacity: opacity.dancers.value,
      onClick: disabled ? null : () => handleDancerSelection(panelId, id),
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
    const isHandSelected =
      selectedHand &&
      selectedHand.panelId === panelId &&
      selectedHand.dancerId === id &&
      selectedHand.handSide === side;

    const baseProps = {
      fill: dancer.colour,
      draggable: !disabled,
      onDragMove: handleHandDragMove(side),
      onClick: disabled ? null : () => handleHandClick(panelId, id, side),
      x: handPos.x,
      y: handPos.y,
      rotation: dancer[`${side}HandRotation`] || 0,
      ref: handRefs[side],
      name: `${side}Hand`,
      shadowColor: isHandSelected ? dancer.colour : null,
      shadowBlur: isHandSelected ? 15 : 0,
      shadowOpacity: isHandSelected ? 1 : 0,
    };

    switch (handShape) {
      case 'Knee':
        return (
          <Group {...baseProps}>
            <Circle
              fill={dancer.colour}
              radius={5}
              offsetY={5} // This moves the circle up by its radius
            />
            {/* This invisible rectangle adjusts the rotation point */}
            <Rect width={1} height={10} opacity={0} />
          </Group>
        );
      case 'Shoulder':
        return (
          // wrapped in group so that initial rotation can be set but still change dynamically
          <Group {...baseProps}>
            <Arc
              angle={180}
              innerRadius={0}
              outerRadius={8}
              rotation={180}
              fill={dancer.colour}
            />
          </Group>
        );
      case 'Overhead':
        return (
          <RegularPolygon {...baseProps} sides={3} radius={7} offsetY={-1} />
        );
      case 'Waist':
      default:
        return (
          <Rect
            {...baseProps}
            width={15}
            height={5}
            offsetX={7.5}
            offsetY={2.5}
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
      updateDancerState(panelId, id, {
        [`${side}${part}ArmThickness`]: newThickness,
      });
    },
    [panelId, id, dancer, updateDancerState, disabled],
  );

  //renders the Arm
  const renderArm = (side) => {
    const upperArmThickness = dancer[`${side}UpperArmThickness`] || 'thick';
    const lowerArmThickness = dancer[`${side}LowerArmThickness`] || 'thick';

    return (
      <Group>
        <Line
          ref={side === 'left' ? leftUpperArmRef : rightUpperArmRef}
          stroke={dancer.colour}
          strokeWidth={upperArmThickness === 'thick' ? 5 : 2} //The two thickness options to toggle between
          hitStrokeWidth={10} // Consistent hitbox
          onClick={(e) => handleArmClick(side, 'Upper')(e)}
        />
        <Line
          ref={side === 'left' ? leftLowerArmRef : rightLowerArmRef}
          stroke={dancer.colour}
          strokeWidth={lowerArmThickness === 'thick' ? 5 : 2}
          hitStrokeWidth={10} // Consistent hitbox
          onClick={(e) => handleArmClick(side, 'Lower')(e)}
        />
        <Circle
          x={dancer[`${side}ElbowPos`].x}
          y={dancer[`${side}ElbowPos`].y}
          radius={3}
          fill={dancer.colour}
          draggable={!disabled}
          onDragMove={handleElbowDragMove(side)}
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
        opacity={opacity.dancers.value}
        draggable={!disabled}
        ref={dancerRef}
        onDragEnd={handleDragEnd}
        onTransform={handleTransform}
      >
        {renderHead()}
        <Rect
          ref={bodyRef}
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
      {selectedHand &&
        selectedHand.panelId === panelId &&
        selectedHand.dancerId === id && (
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
