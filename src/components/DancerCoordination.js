import React from 'react';
import Dancer from './Dancer';
import { DANCER_DIMENSIONS, HAND_DIMENSIONS } from '../utils/dimensions';

/**
 * Returns the axis-aligned bounding box (AABB) in layer space for a dancer,
 * accounting for rotation and scale. Uses local points to better match
 * the dancer's origin (shoulders) instead of assuming a centered rectangle.
 */
export const getDancerAABB = (dancer) => {
  const scaleX = dancer.scaleX || 1;
  const scaleY = dancer.scaleY || 1;
  const r = ((dancer.rotation || 0) * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);

  const bodyHalfWidth = DANCER_DIMENSIONS.BODY_WIDTH / 2;
  const headBaseY = DANCER_DIMENSIONS.HEAD_SIZE / 4;
  const headTop = headBaseY - DANCER_DIMENSIONS.HEAD_SIZE / 2;
  const bodyBottom = headBaseY + DANCER_DIMENSIONS.BODY_HEIGHT;
  const handPad = Math.max(HAND_DIMENSIONS.WIDTH, HAND_DIMENSIONS.HEIGHT) / 2;
  const elbowPad = 3;

  const points = [
    { x: -bodyHalfWidth, y: headTop },
    { x: bodyHalfWidth, y: headTop },
    { x: -bodyHalfWidth, y: bodyBottom },
    { x: bodyHalfWidth, y: bodyBottom },
  ];

  const leftHand = dancer.leftHandPos || { x: 0, y: 0 };
  const rightHand = dancer.rightHandPos || { x: 0, y: 0 };
  const leftElbow = dancer.leftElbowPos || { x: 0, y: 0 };
  const rightElbow = dancer.rightElbowPos || { x: 0, y: 0 };

  const addPointWithPad = (pt, pad) => {
    points.push(
      { x: pt.x - pad, y: pt.y - pad },
      { x: pt.x + pad, y: pt.y + pad },
    );
  };

  addPointWithPad(leftHand, handPad);
  addPointWithPad(rightHand, handPad);
  addPointWithPad(leftElbow, elbowPad);
  addPointWithPad(rightElbow, elbowPad);

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  points.forEach((pt) => {
    const sx = pt.x * scaleX;
    const sy = pt.y * scaleY;
    const rx = sx * cos - sy * sin;
    const ry = sx * sin + sy * cos;
    const worldX = dancer.x + rx;
    const worldY = dancer.y + ry;
    minX = Math.min(minX, worldX);
    maxX = Math.max(maxX, worldX);
    minY = Math.min(minY, worldY);
    maxY = Math.max(maxY, worldY);
  });

  return { minX, maxX, minY, maxY };
};

/**
 * DancerCoordination is responsible for coordinating the rendering of all
 * dancers in a panel. It owns:
 *   - Which dancers are visible
 *   - The order in which dancer bodies, arm segments, and interaction layers
 *     are drawn (z-ordering)
 *   - The arm z-order rule: thin segments render beneath thick ones;
 *     when thickness matches, blue defaults to the top
 *
 * Each dancer is rendered as three passes:
 *   1. All bodies (so bodies are never occluded by arms)
 *   2. All arm segments sorted by thickness/colour
 *   3. Interaction-only instances for selected dancers (transformers, etc.)
 *
 * In the future, this component is a natural home for multi-dancer constraints,
 * colour rules, and any other cross-dancer coordination logic.
 */

const ARM_SEGMENTS = [
  { renderKey: 'leftUpperArm', thicknessKey: 'leftUpperArmThickness' },
  { renderKey: 'rightUpperArm', thicknessKey: 'rightUpperArmThickness' },
  { renderKey: 'leftLowerArm', thicknessKey: 'leftLowerArmThickness' },
  { renderKey: 'rightLowerArm', thicknessKey: 'rightLowerArmThickness' },
];

const THICKNESS_RANK = { thin: 0, thick: 1 };
const COLOUR_RANK = { red: 0, blue: 1 };

const getSortedArmRenderItems = (visibleDancers) =>
  ARM_SEGMENTS.flatMap(({ renderKey, thicknessKey }, segmentIndex) =>
    visibleDancers.map((dancer, dancerIndex) => ({
      dancer,
      renderKey,
      dancerIndex,
      segmentIndex,
      thickness: dancer[thicknessKey] || 'thick',
    })),
  ).sort((a, b) => {
    const thicknessDelta =
      THICKNESS_RANK[a.thickness] - THICKNESS_RANK[b.thickness];
    if (thicknessDelta !== 0) return thicknessDelta;

    const colourDelta =
      (COLOUR_RANK[a.dancer.colour] ?? 0) - (COLOUR_RANK[b.dancer.colour] ?? 0);
    if (colourDelta !== 0) return colourDelta;

    const segmentDelta = a.segmentIndex - b.segmentIndex;
    if (segmentDelta !== 0) return segmentDelta;

    return a.dancerIndex - b.dancerIndex;
  });

/**
 * Props:
 *   dancers         – array of dancer state objects for this panel
 *   getDancerProps  – fn(dancer, index) → props object for <Dancer>
 *   isObjectHidden  – fn(dancer, 'dancer') → bool
 */
const DancerCoordination = ({ dancers, getDancerProps, isObjectHidden }) => {
  const visibleDancers = dancers.filter((d) => !isObjectHidden(d, 'dancer'));

  const bodies = visibleDancers.map((dancer, index) => (
    <Dancer
      key={`${dancer.id}-body`}
      {...getDancerProps(dancer, index)}
      renderOnly="body"
    />
  ));

  const arms = getSortedArmRenderItems(visibleDancers).map(
    ({ dancer, renderKey, dancerIndex }) => (
      <Dancer
        key={`${dancer.id}-${renderKey}`}
        {...getDancerProps(dancer, dancerIndex)}
        renderOnly={renderKey}
      />
    ),
  );

  const interactionLayer = visibleDancers
    .map((dancer, index) => {
      const props = getDancerProps(dancer, index);
      if (!props.isSelected && !props.selectedHandSide) return null;
      return (
        <Dancer key={`${dancer.id}-interaction`} {...props} renderOnly="all" />
      );
    })
    .filter(Boolean);

  return [...bodies, ...arms, ...interactionLayer];
};

export default DancerCoordination;
