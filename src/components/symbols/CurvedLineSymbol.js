import React from 'react';
import { Arrow } from 'react-konva';

// Generates the points for spiral patterns (same as SpinSymbol but needed here)
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
    if (pattern === 'arc') {
      // For arc patterns, use constant radius
      radius = radiusIncrement;
    } else {
      // For spiral patterns, increase radius
      radius = i * radiusIncrement;
    }
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    points.push(x, y);
  }
  return points;
};

// Calculates the center of the bounding box for points array [x1, y1, x2, y2, ...]
const calculateBoundingBoxCenter = (points) => {
  let minX = Infinity,
    maxX = -Infinity;
  let minY = Infinity,
    maxY = -Infinity;

  for (let i = 0; i < points.length; i += 2) {
    minX = Math.min(minX, points[i]);
    maxX = Math.max(maxX, points[i]);
    minY = Math.min(minY, points[i + 1]);
    maxY = Math.max(maxY, points[i + 1]);
  }

  return {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
  };
};

const CurvedLineSymbol = ({ config, shape, commonProps }) => {
  const points = generateSpiralPoints(
    config.numPoints,
    config.radiusIncrement,
    config.angleIncrement,
    config.pattern,
    config.startAngle,
  );

  const center = calculateBoundingBoxCenter(points);

  return (
    <Arrow
      {...commonProps}
      points={points}
      tension={0.5}
      pointerLength={5}
      pointerWidth={5}
      fill={shape.fill}
      stroke={shape.stroke}
      strokeWidth={3}
      hitStrokeWidth={10}
      dash={[10, 5]}
      offsetX={center.x}
      offsetY={center.y}
    />
  );
};

export default CurvedLineSymbol;
