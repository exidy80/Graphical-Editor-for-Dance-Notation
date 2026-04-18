import React, { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../stores';
import images from './ImageMapping';
import { SHAPE_STYLE } from '../utils/dimensions';

const FeetPlacementGhostOverlay = () => {
  const feetPlacement = useAppStore((state) => state.feetPlacement);
  const isArmed = feetPlacement.active && Boolean(feetPlacement.symbolDraft);
  const shapeDraft = feetPlacement.symbolDraft;
  const [cursor, setCursor] = useState(null);
  const [isDropAllowed, setIsDropAllowed] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!isArmed) {
      setCursor(null);
      setIsDropAllowed(false);
      return;
    }

    const handleMouseMove = (event) => {
      const x = event.clientX;
      const y = event.clientY;
      const target = document.elementFromPoint(x, y);
      const overKonvaStage = Boolean(target?.closest('.konvajs-content'));

      setCursor({ x, y });
      setIsDropAllowed(overKonvaStage);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isArmed]);

  const hotspotOffset = useMemo(() => {
    if (!shapeDraft) return { x: 0, y: 0 };

    const hotspot = shapeDraft.hotspot || { mode: 'ratio', x: 0.5, y: 0.5 };
    const scaleX =
      SHAPE_STYLE.IMAGE_SCALE_FACTOR *
      (shapeDraft.scaleX !== undefined ? shapeDraft.scaleX : 1);
    const scaleY =
      SHAPE_STYLE.IMAGE_SCALE_FACTOR *
      (shapeDraft.scaleY !== undefined ? shapeDraft.scaleY : 1);
    const renderedWidth = imageSize.width * scaleX;
    const renderedHeight = imageSize.height * scaleY;

    if (hotspot.mode === 'px') {
      return { x: hotspot.x || 0, y: hotspot.y || 0 };
    }

    return {
      x: renderedWidth * (hotspot.x !== undefined ? hotspot.x : 0.5),
      y: renderedHeight * (hotspot.y !== undefined ? hotspot.y : 0.5),
    };
  }, [imageSize.height, imageSize.width, shapeDraft]);

  if (!isArmed || !shapeDraft?.imageKey || !cursor) return null;

  const scaleX =
    SHAPE_STYLE.IMAGE_SCALE_FACTOR *
    (shapeDraft.scaleX !== undefined ? shapeDraft.scaleX : 1);
  const scaleY =
    SHAPE_STYLE.IMAGE_SCALE_FACTOR *
    (shapeDraft.scaleY !== undefined ? shapeDraft.scaleY : 1);
  const left = cursor.x - hotspotOffset.x;
  const top = cursor.y - hotspotOffset.y;

  return (
    <div className="feet-ghost-overlay" aria-hidden="true">
      <img
        src={images[shapeDraft.imageKey]}
        alt=""
        className="feet-ghost-image"
        style={{
          left,
          top,
          transform: `scale(${scaleX}, ${scaleY})`,
          opacity: isDropAllowed ? 0.45 : 0.22,
        }}
        onLoad={(event) => {
          const { naturalWidth, naturalHeight } = event.currentTarget;
          setImageSize({ width: naturalWidth, height: naturalHeight });
        }}
      />
      {!isDropAllowed && (
        <div
          className="feet-ghost-no-drop"
          style={{
            left: cursor.x,
            top: cursor.y,
          }}
        >
          <span className="feet-ghost-no-drop-slash" />
        </div>
      )}
    </div>
  );
};

export default FeetPlacementGhostOverlay;
