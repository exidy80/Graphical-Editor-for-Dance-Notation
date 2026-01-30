import React, { useState } from 'react';
import { useAppStore } from '../stores';
import * as ShapeTypes from '../constants/shapeTypes';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faLockOpen } from '@fortawesome/free-solid-svg-icons';
import bringToFrontImg from './images/bring-to-front.png';
import sendToBackImg from './images/send-to-back.png';

// Define type sets for each category
const MOVEMENT_TYPES = new Set([
  ShapeTypes.STRAIGHT_LINE,
  ShapeTypes.STRAIGHT_LINE_UP,
  ShapeTypes.STRAIGHT_LINE_DOWN,
  ShapeTypes.QUARTER_CURVED_LINE,
  ShapeTypes.QUARTER_CURVED_LINE_UP,
  ShapeTypes.QUARTER_CURVED_LINE_DOWN,
  ShapeTypes.HALF_CURVED_LINE,
  ShapeTypes.HALF_CURVED_LINE_UP,
  ShapeTypes.HALF_CURVED_LINE_DOWN,
  ShapeTypes.SPIN_TWO,
  ShapeTypes.SPIN_TWO_CW,
  ShapeTypes.SPIN_TWO_CCW,
  ShapeTypes.SPIN_ONE_AND_HALF,
  ShapeTypes.SPIN_ONE_AND_HALF_CW,
  ShapeTypes.SPIN_ONE_AND_HALF_CCW,
  ShapeTypes.SPIN_ONE,
  ShapeTypes.SPIN_ONE_CW,
  ShapeTypes.SPIN_ONE_CCW,
  ShapeTypes.SPIN_HALF,
  ShapeTypes.SPIN_HALF_CW,
  ShapeTypes.SPIN_HALF_CCW,
  ShapeTypes.SPIN_QUARTER,
  ShapeTypes.SPIN_QUARTER_CW,
  ShapeTypes.SPIN_QUARTER_CCW,
]);

// All signal-related types from ShapeTypes
const SIGNALS_TYPES = new Set([
  ShapeTypes.SIGNAL,
  ShapeTypes.BLOCK,
  ShapeTypes.SPLIT_HANDS,
  ShapeTypes.LINK_HANDS,
  ShapeTypes.OVERHEAD,
  ShapeTypes.SHOULDER,
  ShapeTypes.WAIST,
  ShapeTypes.HIP,
  ShapeTypes.KNEE,
  ShapeTypes.DIRECTION_UP,
  ShapeTypes.DIRECTION_DOWN,
]);

// Feet: all IMAGE types (feet symbols) from shapeMapping, but use a unique set of keys for all foot shapes
const FEET_TYPES = new Set([ShapeTypes.IMAGE]);

const LOCATION_TYPES = new Set([ShapeTypes.STAGE_X, ShapeTypes.STAGE_NEXT]);

const LAYER_CATEGORIES = [
  { label: 'Body', key: 'body' },
  { label: 'Movement', key: 'movement' },
  { label: 'Signals', key: 'signals' },
  { label: 'Feet', key: 'feet' },
  { label: 'Location', key: 'location' },
];

function isShapeInCategory(shape, catKey) {
  if (catKey === 'movement') return MOVEMENT_TYPES.has(shape.type);
  if (catKey === 'signals') return SIGNALS_TYPES.has(shape.type);
  if (catKey === 'feet') return FEET_TYPES.has(shape.type);
  if (catKey === 'location') return LOCATION_TYPES.has(shape.type);
  return false;
}

const LayerControl = () => {
  const [locked, setLocked] = useState([false, false, false, false, false]);
  const panels = useAppStore((state) => state.panels);
  const setPanels = useAppStore((state) => state.setPanels);
  const queueDancerFlash = useAppStore((state) => state.queueDancerFlash);
  const queueSymbolFlash = useAppStore((state) => state.queueSymbolFlash);
  const handleOpacityChange = useAppStore((state) => state.handleOpacityChange);
  const addToDisableList = useAppStore((state) => state.addToDisableList);
  const removeFromDisableList = useAppStore(
    (state) => state.removeFromDisableList,
  );

  // Handler: Bring to front (all panels)
  const handleBringToFront = (catIdx) => {
    const catKey = LAYER_CATEGORIES[catIdx].key;
    setPanels(
      panels.map((panel) => {
        if (catKey === 'body') {
          // Glow all dancers
          panel.dancers.forEach((d) => queueDancerFlash(panel.id, d.id));
          return { ...panel, dancers: [...panel.dancers] };
        }
        // Glow all shapes of this category
        panel.shapes.forEach((s) => {
          if (isShapeInCategory(s, catKey)) queueSymbolFlash(panel.id, s.id);
        });
        // Move all shapes of this category to the end (front)
        const shapesOfCat = panel.shapes.filter((s) =>
          isShapeInCategory(s, catKey),
        );
        const shapesOther = panel.shapes.filter(
          (s) => !isShapeInCategory(s, catKey),
        );
        return { ...panel, shapes: [...shapesOther, ...shapesOfCat] };
      }),
    );
  };

  // Handler: Send to back (all panels)
  const handleSendToBack = (catIdx) => {
    const catKey = LAYER_CATEGORIES[catIdx].key;
    setPanels(
      panels.map((panel) => {
        if (catKey === 'body') {
          // Glow all dancers
          panel.dancers.forEach((d) => queueDancerFlash(panel.id, d.id));
          return { ...panel, dancers: [...panel.dancers] };
        }
        // Glow all shapes of this category
        panel.shapes.forEach((s) => {
          if (isShapeInCategory(s, catKey)) queueSymbolFlash(panel.id, s.id);
        });
        // Move all shapes of this category to the start (back)
        const shapesOfCat = panel.shapes.filter((s) =>
          isShapeInCategory(s, catKey),
        );
        const shapesOther = panel.shapes.filter(
          (s) => !isShapeInCategory(s, catKey),
        );
        return { ...panel, shapes: [...shapesOfCat, ...shapesOther] };
      }),
    );
  };

  // Handler: Lock/Unlock (global)
  const handleToggleLock = (catIdx) => {
    const isLocking = !locked[catIdx];
    setLocked((prev) => {
      const newLocked = [...prev];
      newLocked[catIdx] = !newLocked[catIdx];
      return newLocked;
    });
    const catKey = LAYER_CATEGORIES[catIdx].key;
    if (catKey === 'body') {
      // Use the same lock mode as Toolbar for dancers
      handleOpacityChange('dancers');
      return;
    }
    if (panels) {
      // go through all panels and collect all the shapes in this category. use reduce.
      const shapesInCategory = panels.reduce((acc, panel) => {
        const shapes = panel.shapes.filter((s) => isShapeInCategory(s, catKey));
        return acc.concat(shapes);
      }, []);
      const shapeIdsInCategory = new Set(shapesInCategory.map((s) => s.id));
      if (isLocking) {
        // Add all shapes in this category to disable list
        addToDisableList(shapeIdsInCategory);
      } else {
        // Remove all shapes in this category from disable list
        removeFromDisableList(shapeIdsInCategory);
      }
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#fff',
        borderTop: '2px solid #ddd',
        padding: '15px',
      }}
    >
      <h3
        style={{
          margin: '0 0 12px 0',
          fontSize: '16px',
          fontWeight: 'bold',
        }}
      >
        Layers
      </h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '8px',
        }}
      >
        {/* Column headers */}
        {LAYER_CATEGORIES.map((cat) => (
          <div
            key={cat.key}
            style={{
              fontSize: '14px',
              textAlign: 'center',
              fontWeight: '500',
              marginBottom: '4px',
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              transform: 'rotate(180deg)',
              height: '70px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {cat.label}
          </div>
        ))}
        {/* Bring to front buttons */}
        {LAYER_CATEGORIES.map((cat, i) => (
          <button
            key={`front-${cat.key}`}
            style={{
              padding: '5px',
              border: '2px solid #333',
              borderRadius: '4px',
              backgroundColor: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
            }}
            title="Bring to front"
            onClick={() => handleBringToFront(i)}
          >
            <img
              src={bringToFrontImg}
              alt="Bring to front"
              style={{ width: 28, height: 28 }}
            />
          </button>
        ))}
        {/* Send to back buttons */}
        {LAYER_CATEGORIES.map((cat, i) => (
          <button
            key={`back-${cat.key}`}
            style={{
              padding: '5px',
              border: '2px solid #333',
              borderRadius: '4px',
              backgroundColor: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
            }}
            title="Send to back"
            onClick={() => handleSendToBack(i)}
          >
            <img
              src={sendToBackImg}
              alt="Send to back"
              style={{ width: 28, height: 28 }}
            />
          </button>
        ))}
        {/* Lock/Unlock toggles */}
        {LAYER_CATEGORIES.map((cat, i) => (
          <button
            key={`lock-${cat.key}`}
            style={{
              width: '38px',
              height: '38px',
              border: '2px solid #333',
              borderRadius: '4px',
              backgroundColor: locked[i] ? '#999' : '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              padding: 0,
            }}
            title={locked[i] ? 'Locked' : 'Unlocked'}
            onClick={() => handleToggleLock(i)}
          >
            <FontAwesomeIcon icon={locked[i] ? faLock : faLockOpen} />
          </button>
        ))}
      </div>
    </div>
  );
};

export default LayerControl;
