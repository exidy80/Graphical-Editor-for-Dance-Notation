export const constrainToCircle = (center, point, radius) => {
  const vector = { x: point.x - center.x, y: point.y - center.y };
  const distance = Math.sqrt(vector.x ** 2 + vector.y ** 2);
  const normalizedVector = {
    x: vector.x / distance,
    y: vector.y / distance,
  };

  return {
    x: center.x + normalizedVector.x * radius,
    y: center.y + normalizedVector.y * radius,
  };
};

export const calculateAngle = (p1, p2, p3, side) => {
  const vectorA = { x: p1.x - p2.x, y: p1.y - p2.y };
  const vectorB = { x: p3.x - p2.x, y: p3.y - p2.y };

  const dotProduct = vectorA.x * vectorB.x + vectorA.y * vectorB.y;
  const magnitudeA = Math.sqrt(vectorA.x ** 2 + vectorA.y ** 2);
  const magnitudeB = Math.sqrt(vectorB.x ** 2 + vectorB.y ** 2);

  const angle = Math.acos(dotProduct / (magnitudeA * magnitudeB));
  const crossProduct = vectorA.x * vectorB.y - vectorA.y * vectorB.x;

  return side === 'right'
    ? crossProduct > 0
      ? (angle * 180) / Math.PI
      : 360 - (angle * 180) / Math.PI
    : crossProduct < 0
    ? (angle * 180) / Math.PI
    : 360 - (angle * 180) / Math.PI;
};
