import React, { useState, useEffect } from 'react';
import { useAppStore } from '../stores';
import { LAYER_CATEGORIES, isShapeInCategory } from '../utils/layersConfig.js';
import * as ShapeTypes from '../constants/shapeTypes';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLock,
  faLockOpen,
  faEye,
  faEyeSlash,
} from '@fortawesome/free-solid-svg-icons';
import bringToFrontImg from './images/bring-to-front.png';
import sendToBackImg from './images/send-to-back.png';

const LayerControl = () => {
  const [locked, setLocked] = useState(() =>
    new Array(LAYER_CATEGORIES.length).fill(false),
  );
  const [hidden, setHidden] = useState(() =>
    new Array(LAYER_CATEGORIES.length).fill(false),
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const [usePopup, setUsePopup] = useState(false);

  const panels = useAppStore((state) => state.panels);
  const queueDancerFlash = useAppStore((state) => state.queueDancerFlash);
  const queueSymbolFlash = useAppStore((state) => state.queueSymbolFlash);
  const handleOpacityChange = useAppStore((state) => state.handleOpacityChange);
  const addToDisableList = useAppStore((state) => state.addToDisableList);
  const removeFromDisableList = useAppStore(
    (state) => state.removeFromDisableList,
  );
  const addToHideList = useAppStore((state) => state.addToHideList);
  const removeFromHideList = useAppStore((state) => state.removeFromHideList);
  const setLayerOrder = useAppStore((state) => state.setLayerOrder);

  // Use media query to determine if we should use popup approach
  // On small screens (height < 1000px), use popup to save space
  useEffect(() => {
    if (!window.matchMedia) return;
    const mediaQuery = window.matchMedia('(max-height: 900px)');
    if (!mediaQuery) return;

    const handleChange = (e) => {
      setUsePopup(e.matches);
    };

    // Set initial value
    setUsePopup(mediaQuery.matches);

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  const _queueFlashForCategory = (catKey) => {
    panels.forEach((panel) => {
      if (catKey === 'body') {
        panel.dancers.forEach((d) => queueDancerFlash(panel.id, d.id));
      } else {
        panel.shapes.forEach((s) => {
          if (isShapeInCategory(s, catKey)) {
            queueSymbolFlash(panel.id, s.id);
          }
        });
      }
    });
  };

  // Handler: Bring to front (all panels)
  const handleBringToFront = (catIdx) => {
    const catKey = LAYER_CATEGORIES[catIdx].key;
    _queueFlashForCategory(catKey);
    _handleLock(catIdx, false);
    setLayerOrder((prev) => [...prev.filter((k) => k !== catKey), catKey]);
  };

  // Handler: Send to back (all panels)
  const handleSendToBack = (catIdx) => {
    const catKey = LAYER_CATEGORIES[catIdx].key;
    _queueFlashForCategory(catKey);
    setLayerOrder((prev) => [catKey, ...prev.filter((k) => k !== catKey)]);
  };

  const _handleLock = (catIdx, shouldLock = true) => {
    // if catIdx is already in the correct state, do nothing
    if (locked[catIdx] === shouldLock) return;
    setLocked((prev) => {
      const newLocked = [...prev];
      newLocked[catIdx] = shouldLock;
      return newLocked;
    });
    const catKey = LAYER_CATEGORIES[catIdx].key;
    if (catKey === 'body') {
      // Use the same lock mode as Toolbar for dancers
      // if we are at this point, we know we are changing the lock state
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
      if (shouldLock) {
        // Add all shapes in this category to disable list
        addToDisableList(shapeIdsInCategory);
      } else {
        // Remove all shapes in this category from disable list
        removeFromDisableList(shapeIdsInCategory);
      }
    }
  };

  // Handler: Lock/Unlock (global)
  const handleToggleLock = (catIdx) => {
    const isLocking = !locked[catIdx];
    _handleLock(catIdx, isLocking);
  };

  // Handler: Hide/Show (global)
  const handleToggleHide = (catIdx) => {
    const isHiding = !hidden[catIdx];
    _handleHide(catIdx, isHiding);
  };

  const _handleHide = (catIdx, shouldHide = true) => {
    // if catIdx is already in the correct state, do nothing
    if (hidden[catIdx] === shouldHide) return;
    setHidden((prev) => {
      const newHidden = [...prev];
      newHidden[catIdx] = shouldHide;
      return newHidden;
    });
    const catKey = LAYER_CATEGORIES[catIdx].key;
    if (catKey === 'body') {
      if (shouldHide) {
        addToHideList(new Set(['body']));
      } else {
        removeFromHideList(new Set(['body']));
      }
      return;
    }
    if (panels) {
      const shapesInCategory = panels.reduce((acc, panel) => {
        const shapes = panel.shapes.filter((s) => isShapeInCategory(s, catKey));
        return acc.concat(shapes);
      }, []);
      // Stage center should remain visible even when the Location layer is hidden.
      const filteredShapes =
        catKey === 'location'
          ? shapesInCategory.filter(
              (shape) => shape.type !== ShapeTypes.STAGE_CENTER,
            )
          : shapesInCategory;
      const shapeIdsInCategory = new Set(filteredShapes.map((s) => s.id));
      if (shouldHide) {
        addToHideList(shapeIdsInCategory);
      } else {
        removeFromHideList(shapeIdsInCategory);
      }
    }
  };

  // Determine if we should show expanded or use popup
  const shouldShowExpanded = usePopup ? isExpanded : true;

  return (
    <div
      onMouseEnter={() => usePopup && setIsExpanded(true)}
      onMouseLeave={() => usePopup && setIsExpanded(false)}
      style={{
        backgroundColor: '#fff',
        borderTop: '2px solid #ddd',
        padding: shouldShowExpanded ? '15px' : '12px 15px',
        minHeight: shouldShowExpanded ? 'auto' : '20px',
        transition: 'all 0.2s ease',
      }}
    >
      <h3
        style={{
          margin: 0,
          fontSize: '14px',
          fontWeight: 'bold',
          color: shouldShowExpanded ? 'inherit' : '#666',
          cursor: usePopup ? 'pointer' : 'default',
        }}
      >
        Layers
      </h3>
      {shouldShowExpanded && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '8px',
            marginTop: '12px',
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
                pointerEvents: 'none',
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
          {/* Hide/Show toggles */}
          {LAYER_CATEGORIES.map((cat, i) => (
            <button
              key={`hide-${cat.key}`}
              style={{
                width: '38px',
                height: '38px',
                border: '2px solid #333',
                borderRadius: '4px',
                backgroundColor: hidden[i] ? '#ddd' : '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                padding: 0,
              }}
              title={hidden[i] ? 'Hidden' : 'Visible'}
              onClick={() => handleToggleHide(i)}
            >
              <FontAwesomeIcon icon={hidden[i] ? faEyeSlash : faEye} />
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
      )}
    </div>
  );
};

export default LayerControl;
