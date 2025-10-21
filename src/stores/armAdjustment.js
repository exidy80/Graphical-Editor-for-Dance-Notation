// Arm adjustment utilities for maintaining proportional arm segments when hands are locked
// These utilities calculate new elbow positions to preserve arm segment ratios and bend angles

/**
 * Calculate the shoulder position for a given side
 * @param {string} side - 'left' or 'right'
 * @returns {Object} - {x, y} position of the shoulder
 */
const getShoulderPosition = (side) => {
  const bodyWidth = 60; // From Dancer.js
  const headSize = 30; // From Dancer.js
  return {
    x: side === 'left' ? -bodyWidth / 2 : bodyWidth / 2,
    y: headSize / 4,
  };
};

/**
 * Calculate the length of an arm segment
 * @param {Object} startPos - Starting position {x, y}
 * @param {Object} endPos - Ending position {x, y}
 * @returns {number} - Length of the segment
 */
const getSegmentLength = (startPos, endPos) => {
  const dx = endPos.x - startPos.x;
  const dy = endPos.y - startPos.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Calculate the ratio between upper and lower arm segments
 * @param {Object} dancer - The dancer object
 * @param {string} side - 'left' or 'right'
 * @returns {number} - Ratio of upper arm length to lower arm length
 */
const getArmRatio = (dancer, side) => {
  const shoulder = getShoulderPosition(side);
  const elbow = dancer[`${side}ElbowPos`];
  const hand = dancer[`${side}HandPos`];

  const upperLength = getSegmentLength(shoulder, elbow);
  const lowerLength = getSegmentLength(elbow, hand);

  return upperLength / lowerLength;
};

/**
 * Calculate the angle that the elbow makes relative to the straight line from shoulder to hand
 * @param {Object} dancer - The dancer object
 * @param {string} side - 'left' or 'right'
 * @returns {number} - Angle in radians
 */
const getElbowAngleFromStraight = (dancer, side) => {
  const shoulder = getShoulderPosition(side);
  const elbow = dancer[`${side}ElbowPos`];
  const hand = dancer[`${side}HandPos`];

  // Vector from shoulder to hand (straight line)
  const straightVec = { x: hand.x - shoulder.x, y: hand.y - shoulder.y };
  // Vector from shoulder to elbow
  const elbowVec = { x: elbow.x - shoulder.x, y: elbow.y - shoulder.y };

  // Calculate angle between vectors using cross product and dot product
  const dot = straightVec.x * elbowVec.x + straightVec.y * elbowVec.y;
  const crossZ = straightVec.x * elbowVec.y - straightVec.y * elbowVec.x;

  return Math.atan2(crossZ, dot);
};

/**
 * Calculate a new elbow position that maintains the original elbow position ratio along the arm
 * @param {Object} dancer - The dancer object
 * @param {string} side - 'left' or 'right'
 * @param {Object} newHandPos - New hand position {x, y}
 * @returns {Object} - New elbow position {x, y}
 */
const calculateAdjustedElbowPosition = (dancer, side, newHandPos) => {
  const shoulder = getShoulderPosition(side);

  // Get original elbow position to calculate its ratio along the straight arm line
  const originalElbow = dancer[`${side}ElbowPos`];
  const originalHand = dancer[`${side}HandPos`];

  // Calculate the original elbow's position ratio along the straight shoulder-to-hand line
  const originalTotalStraightLength = getSegmentLength(shoulder, originalHand);

  // If the original total arm length is too small, keep the original elbow position
  if (originalTotalStraightLength < 1) {
    return dancer[`${side}ElbowPos`];
  }

  // Calculate the elbow's projection onto the straight line from shoulder to hand
  // This gives us the ratio of where the elbow sits along the straight line
  const shoulderToHandVec = {
    x: originalHand.x - shoulder.x,
    y: originalHand.y - shoulder.y,
  };
  const shoulderToElbowVec = {
    x: originalElbow.x - shoulder.x,
    y: originalElbow.y - shoulder.y,
  };

  // Project shoulder-to-elbow vector onto shoulder-to-hand vector
  const dotProduct =
    shoulderToElbowVec.x * shoulderToHandVec.x +
    shoulderToElbowVec.y * shoulderToHandVec.y;
  const handVecLengthSquared =
    shoulderToHandVec.x * shoulderToHandVec.x +
    shoulderToHandVec.y * shoulderToHandVec.y;

  // The ratio along the straight line (0 = at shoulder, 1 = at hand)
  const originalElbowRatio =
    handVecLengthSquared > 0 ? dotProduct / handVecLengthSquared : 0.5;

  // Calculate where the elbow would be on the straight line from shoulder to original hand
  const originalStraightElbowX =
    shoulder.x + shoulderToHandVec.x * originalElbowRatio;
  const originalStraightElbowY =
    shoulder.y + shoulderToHandVec.y * originalElbowRatio;

  // Total arm length (straight line from shoulder to new hand position)
  const newTotalStraightLength = getSegmentLength(shoulder, newHandPos);

  // If the total arm length is too small, avoid division by zero issues
  if (newTotalStraightLength < 1) {
    return dancer[`${side}ElbowPos`]; // Keep original elbow position
  }

  // Position the elbow on the straight line at the correct ratio
  const straightElbowX =
    shoulder.x + (newHandPos.x - shoulder.x) * originalElbowRatio;
  const straightElbowY =
    shoulder.y + (newHandPos.y - shoulder.y) * originalElbowRatio;

  // Now apply the original angle to create the bend
  // The angle is measured from the straight line, so we need to offset perpendicular to the straight line
  const straightAngle = Math.atan2(
    newHandPos.y - shoulder.y,
    newHandPos.x - shoulder.x,
  );
  const perpAngle = straightAngle + Math.PI / 2; // Perpendicular to the straight line

  // The original elbow's distance from the straight line
  const originalPerpendicularOffset =
    (originalElbow.x - originalStraightElbowX) * Math.cos(perpAngle) +
    (originalElbow.y - originalStraightElbowY) * Math.sin(perpAngle);

  // Apply the same perpendicular offset to the new straight elbow position
  const newElbowX =
    straightElbowX + originalPerpendicularOffset * Math.cos(perpAngle);
  const newElbowY =
    straightElbowY + originalPerpendicularOffset * Math.sin(perpAngle);

  return { x: newElbowX, y: newElbowY };
};

/**
 * Adjust elbow positions for a dancer to maintain arm proportions after hand positions change
 * @param {Object} dancer - The dancer object
 * @param {Object} originalDancer - The dancer's state before hand position changes
 * @param {Array<string>} sidesToAdjust - Array of sides to adjust ('left', 'right', or both)
 * @returns {Object} - Updated dancer object with adjusted elbow positions
 */
const adjustElbowsForProportionalArms = (
  dancer,
  originalDancer,
  sidesToAdjust = ['left', 'right'],
) => {
  const adjustedDancer = { ...dancer };

  sidesToAdjust.forEach((side) => {
    try {
      // Calculate new elbow position
      const newElbowPos = calculateAdjustedElbowPosition(
        originalDancer,
        side,
        dancer[`${side}HandPos`],
      );

      // Update the elbow position
      adjustedDancer[`${side}ElbowPos`] = newElbowPos;
    } catch (error) {
      // If calculation fails, keep the original elbow position
      console.warn(
        `Failed to adjust ${side} elbow for dancer ${dancer.id}:`,
        error,
      );
    }
  });

  return adjustedDancer;
};

export {
  getShoulderPosition,
  getSegmentLength,
  getArmRatio,
  getElbowAngleFromStraight,
  calculateAdjustedElbowPosition,
  adjustElbowsForProportionalArms,
};
