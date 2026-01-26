import React from 'react';
import { Arrow } from 'react-konva';
import { SHAPE_STYLE } from '../../utils/dimensions';

// Generates the points for spiral patterns
const generateSpiralPoints = (
  numPoints,
  radiusIncrement,
  angleIncrement,
  pattern,
  startAngle = 0,
) => {
  const points = [];
  for (let i = 0; i < numPoints; i++) {
    const angle = startAngle + i * angleIncrement;
    let radius;
    if (pattern === 'circle') {
      radius = radiusIncrement; // Fixed radius for a circle
    } else {
      radius = i * radiusIncrement;
    }
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    points.push(x, y);
  }
  return points;
};

const SpinSymbol = ({ config, shape, commonProps }) => {
  const points = generateSpiralPoints(
    config.numPoints,
    config.radiusIncrement,
    config.angleIncrement,
    config.pattern,
  );

  return (
    <Arrow
      {...commonProps}
      points={points}
      tension={0.5}
      pointerLength={5}
      pointerWidth={config.pattern === 'circle' ? 5 : SHAPE_STYLE.POINTER_WIDTH}
      stroke={shape.stroke}
      fill={shape.fill}
      strokeWidth={config.pattern === 'circle' ? 2 : SHAPE_STYLE.STROKE_WIDTH_THIN}
      hitStrokeWidth={config.pattern === 'circle' ? 10 : SHAPE_STYLE.HIT_STROKE_WIDTH}
      dash={[10, 5]}
      scaleX={(commonProps.scaleX || 1) * config.scaleX}
    />
  );
};

export default SpinSymbol;
