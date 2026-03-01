import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../stores';
import {
  COLORS,
  feetButtonMapping,
  shapeMapping,
  SIDES,
} from './sidebarConstants';
import * as ShapeTypes from '../constants/shapeTypes';

const ContextMenu = () => {
  const menuRef = useRef(null);
  const contextMenu = useAppStore((state) => state.contextMenu);
  const closeContextMenu = useAppStore((state) => state.closeContextMenu);
  const handleHandSelection = useAppStore((state) => state.handleHandSelection);
  const setSelectedHand = useAppStore((state) => state.setSelectedHand);
  const setSelectedPanel = useAppStore((state) => state.setSelectedPanel);
  const updateShapeState = useAppStore((state) => state.updateShapeState);
  const panels = useAppStore((state) => state.panels);
  const hasOverlappingHands = useAppStore((state) => state.hasOverlappingHands);
  const getLockForHand = useAppStore((state) => state.getLockForHand);
  const removeLockById = useAppStore((state) => state.removeLockById);
  const lockOverlappingHands = useAppStore(
    (state) => state.lockOverlappingHands,
  );

  useEffect(() => {
    if (!contextMenu.open) return undefined;

    const handleGlobalClose = (event) => {
      if (
        event.type === 'contextmenu' &&
        Date.now() - (contextMenu.openedAt || 0) < 150
      ) {
        return;
      }
      if (menuRef.current && menuRef.current.contains(event.target)) return;
      closeContextMenu();
    };

    window.addEventListener('mousedown', handleGlobalClose);
    window.addEventListener('contextmenu', handleGlobalClose);

    return () => {
      window.removeEventListener('mousedown', handleGlobalClose);
      window.removeEventListener('contextmenu', handleGlobalClose);
    };
  }, [contextMenu.open, contextMenu.openedAt, closeContextMenu]);

  if (!contextMenu.open || !contextMenu.target) return null;

  const { x, y, target } = contextMenu;

  const menuStyle = {
    position: 'fixed',
    top: `${y}px`,
    left: `${x}px`,
    zIndex: 1000,
    background: '#fff',
    border: '1px solid #ccc',
    borderRadius: '4px',
    padding: '6px 0',
    minWidth: '180px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
  };

  const itemStyle = {
    display: 'block',
    width: '100%',
    padding: '6px 12px',
    background: 'transparent',
    border: 'none',
    textAlign: 'left',
    fontSize: '13px',
    cursor: 'pointer',
  };

  const itemDisabledStyle = {
    ...itemStyle,
    color: '#999',
    cursor: 'default',
  };

  const closeAfter = (action) => () => {
    action();
    closeContextMenu();
  };

  const setHandShape = (handShape) => {
    setSelectedPanel(target.panelId);
    setSelectedHand({
      panelId: target.panelId,
      dancerId: target.dancerId,
      handSide: target.handSide,
    });
    handleHandSelection(handShape);
  };

  const getShapeForTarget = () => {
    const panel = panels.find((p) => p.id === target.panelId);
    if (!panel) return null;
    return panel.shapes.find((s) => s.id === target.shapeId) || null;
  };

  const getFootSideFromKey = (imageKey) => {
    if (!imageKey) return null;
    const key = imageKey.toLowerCase();
    if (key.includes('left')) return SIDES.LEFT;
    if (key.includes('right')) return SIDES.RIGHT;
    return null;
  };

  const getFootColorFromKey = (imageKey) => {
    if (!imageKey) return null;
    const key = imageKey.toLowerCase();
    if (key.includes('red')) return COLORS.RED;
    if (key.includes('blue')) return COLORS.BLUE;
    return null;
  };

  const updateHandSignal = (nextType) => {
    const shape = getShapeForTarget();
    if (!shape) return;

    const baseColor = shape.stroke || shape.fill || 'black';
    const nextState = {
      type: nextType,
      stroke: baseColor,
      fill:
        nextType === ShapeTypes.HIP || nextType === ShapeTypes.SHOULDER
          ? null
          : baseColor,
    };

    updateShapeState(target.panelId, target.shapeId, nextState);
  };

  const updateFootSymbol = (itemKey) => {
    const shape = getShapeForTarget();
    if (!shape) return;

    const side =
      getFootSideFromKey(shape.imageKey) ||
      getFootSideFromKey(shape.imageKeyRed) ||
      getFootSideFromKey(shape.imageKeyBlue);
    const color =
      getFootColorFromKey(shape.imageKey) ||
      (shape.imageKey === shape.imageKeyRed ? COLORS.RED : COLORS.BLUE);

    if (!side || !color) return;

    const shapeKey = feetButtonMapping[itemKey][side];
    const shapeProps = shapeMapping[shapeKey];
    if (!shapeProps) return;

    const imageKey =
      color === COLORS.RED ? shapeProps.imageKeyRed : shapeProps.imageKeyBlue;

    updateShapeState(target.panelId, target.shapeId, {
      imageKey,
      imageKeyRed: shapeProps.imageKeyRed,
      imageKeyBlue: shapeProps.imageKeyBlue,
    });
  };

  const renderHandMenu = () => {
    const lock = getLockForHand(
      target.panelId,
      target.dancerId,
      target.handSide,
    );
    const canHoldHands = hasOverlappingHands(
      target.panelId,
      target.dancerId,
      target.handSide,
    );

    return (
      <>
        {lock ? (
          <button
            type="button"
            style={itemStyle}
            onClick={closeAfter(() => removeLockById(target.panelId, lock.id))}
          >
            Release hands
          </button>
        ) : (
          <button
            type="button"
            style={canHoldHands ? itemStyle : itemDisabledStyle}
            onClick={closeAfter(() => lockOverlappingHands(target.panelId))}
            disabled={!canHoldHands}
          >
            Hold hands
          </button>
        )}
        <button
          type="button"
          style={itemStyle}
          onClick={closeAfter(() => setHandShape('Overhead'))}
        >
          Overhead
        </button>
        <button
          type="button"
          style={itemStyle}
          onClick={closeAfter(() => setHandShape('Shoulder'))}
        >
          Shoulder
        </button>
        <button
          type="button"
          style={itemStyle}
          onClick={closeAfter(() => setHandShape('Waist'))}
        >
          Waist
        </button>
        <button
          type="button"
          style={itemStyle}
          onClick={closeAfter(() => setHandShape('Hip'))}
        >
          Hip
        </button>
        <button
          type="button"
          style={itemStyle}
          onClick={closeAfter(() => setHandShape('Knee'))}
        >
          Knee
        </button>
      </>
    );
  };

  const renderHandSymbolMenu = () => (
    <>
      <button
        type="button"
        style={itemStyle}
        onClick={closeAfter(() => updateHandSignal(ShapeTypes.OVERHEAD))}
      >
        Overhead
      </button>
      <button
        type="button"
        style={itemStyle}
        onClick={closeAfter(() => updateHandSignal(ShapeTypes.SHOULDER))}
      >
        Shoulder
      </button>
      <button
        type="button"
        style={itemStyle}
        onClick={closeAfter(() => updateHandSignal(ShapeTypes.WAIST))}
      >
        Waist
      </button>
      <button
        type="button"
        style={itemStyle}
        onClick={closeAfter(() => updateHandSignal(ShapeTypes.HIP))}
      >
        Hip
      </button>
      <button
        type="button"
        style={itemStyle}
        onClick={closeAfter(() => updateHandSignal(ShapeTypes.KNEE))}
      >
        Knee
      </button>
    </>
  );

  const renderFootSymbolMenu = () => (
    <>
      <button
        type="button"
        style={itemStyle}
        onClick={closeAfter(() => updateFootSymbol('Basic'))}
      >
        Default
      </button>
      <button
        type="button"
        style={itemStyle}
        onClick={closeAfter(() => updateFootSymbol('Hover'))}
      >
        Lift
      </button>
      <button
        type="button"
        style={itemStyle}
        onClick={closeAfter(() => updateFootSymbol('Heel'))}
      >
        Heel
      </button>
      <button
        type="button"
        style={itemStyle}
        onClick={closeAfter(() => updateFootSymbol('Ball'))}
      >
        Toe
      </button>
      <button
        type="button"
        style={itemStyle}
        onClick={closeAfter(() => updateFootSymbol('Whole'))}
      >
        Whole
      </button>
    </>
  );

  let content = null;
  if (target.kind === 'hand') content = renderHandMenu();
  if (target.kind === 'handSymbol') content = renderHandSymbolMenu();
  if (target.kind === 'footSymbol') content = renderFootSymbolMenu();

  if (!content) return null;

  return (
    <div ref={menuRef} style={menuStyle} role="menu">
      {content}
    </div>
  );
};

export default ContextMenu;
