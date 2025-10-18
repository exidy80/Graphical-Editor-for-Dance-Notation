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
import { useAppStore } from './useAppStore';

const Dancer = ({ panelId, id }) => {
  // Imports from context file
  const panels = useAppStore((state) => state.panels);
  const selectedDancer = useAppStore((state) => state.selectedDancer);
  const selectedHand = useAppStore((state) => state.selectedHand);
  const opacity = useAppStore((state) => state.opacity);
  const handleDancerSelection = useAppStore(
    (state) => state.handleDancerSelection,
  );
  const handleHandClick = useAppStore((state) => state.handleHandClick);
  const updateDancerState = useAppStore((state) => state.updateDancerState);
  const updateHandPosition = useAppStore((state) => state.updateHandPosition);
  const updateHandRotation = useAppStore((state) => state.updateHandRotation);
  const enforceLocksForDancer = useAppStore(
    (state) => state.enforceLocksForDancer,
  );
  const handFlash = useAppStore((state) => state.handFlash);

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
      enforceLocksForDancer(panelId, id);
    },
    [panelId, id, updateDancerState, enforceLocksForDancer],
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
        enforceLocksForDancer(panelId, id);
      }
    },
    [panelId, id, updateDancerState, enforceLocksForDancer],
  );

  const handleDragMove = useCallback(
    (e) => {
      const node = e.target;
      if (node === dancerRef.current) {
        updateDancerState(panelId, id, {
          x: node.x(),
          y: node.y(),
        });
        enforceLocksForDancer(panelId, id);
      }
    },
    [panelId, id, updateDancerState, enforceLocksForDancer],
  );

  // This function handles when a part of the dancer (like a hand) is dragged and logs position
  const handlePartDragEnd = useCallback(
    (part, side) => (e) => {
      const newPos = e.target.position();
      if (part === 'Hand') {
        updateHandPosition(panelId, id, side, newPos);
      } else if (part === 'Elbow') {
        updateDancerState(panelId, id, { [`${side}${part}Pos`]: newPos });
      }
    },
    [updateDancerState, updateHandPosition, panelId, id],
  );

  // This function handles rotating a hand
  const handleHandRotation = useCallback(
    (e) => {
      const node = e.target;
      const rotation = node.rotation();
      if (selectedHand) {
        updateHandRotation(panelId, id, selectedHand.handSide, rotation);
      }
    },
    [panelId, id, selectedHand, updateHandRotation],
  );

  const handleHandMouseEnter = (e) => {
    const shape = e.target;
    shape.shadowColor(dancer.colour);
    shape.shadowBlur(5);
    shape.shadowOpacity(1);
    shape.getLayer().batchDraw();
  };

  const handleHandMouseLeave = (e) => {
    const shape = e.target;
    shape.shadowColor(null);
    shape.shadowBlur(0);
    shape.shadowOpacity(0);
    shape.getLayer().batchDraw();
  };

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
    // Timeout here to make sure the reset happens before reattaching when hand shape changed
    setTimeout(attachHandTransformer, 0);
  }, [chosenHandShapes, resetHandTransformer, attachHandTransformer]);

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

  const renderHand = (side) => {
    const handPos = dancer[`${side}HandPos`];
    const handShape = chosenHandShapes[side];
    const isHandSelected =
      selectedHand &&
      selectedHand.panelId === panelId &&
      selectedHand.dancerId === id &&
      selectedHand.handSide === side;

    const isFlashing = handFlash.some(
      (h) => h.panelId === panelId && h.dancerId === id && h.side === side,
    );
    const baseProps = {
      fill: dancer.colour,
      draggable: !disabled,
      onDragMove: handlePartDragEnd('Hand', side),
      onDragEnd: handlePartDragEnd('Hand', side),
      onClick: disabled ? null : () => handleHandClick(panelId, id, side),
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
              offsetY={5} // This moves the circle up by its radius
              onMouseEnter={handleHandMouseEnter}
              onMouseLeave={handleHandMouseLeave}
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
              onMouseEnter={handleHandMouseEnter}
              onMouseLeave={handleHandMouseLeave}
            />
          </Group>
        );
      case 'Overhead':
        return (
          <RegularPolygon
            {...baseProps}
            sides={3}
            radius={7}
            offsetY={-1}
            onMouseEnter={handleHandMouseEnter}
            onMouseLeave={handleHandMouseLeave}
          />
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
      updateDancerState(panelId, id, {
        [`${side}${part}ArmThickness`]: newThickness,
      });
    },
    [panelId, id, dancer, updateDancerState, disabled],
  );

  const renderArm = (side) => {
    const upperArmThickness = dancer[`${side}UpperArmThickness`] || 'thick';
    const lowerArmThickness = dancer[`${side}LowerArmThickness`] || 'thick';

    return (
      <Group key={`${side}arm${dancer.id}`}>
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
          onDragMove={handlePartDragEnd('Elbow', side)}
          onDragEnd={handlePartDragEnd('Elbow', side)}
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
        opacity={opacity.dancers.value}
        draggable={!disabled}
        ref={dancerRef}
        onDragMove={handleDragMove}
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
