// Coordinate transformation utilities for dancer positioning
// These handle the math for rotating, scaling, and positioning dancers and their hands

const coordinateTransforms = {
  // Convert local dancer coordinates to absolute canvas coordinates
  localToAbsolute: (dancer, point) => {
    const rotationDeg = dancer.rotation || 0;
    const r = (rotationDeg * Math.PI) / 180;
    const cos = Math.cos(r);
    const sin = Math.sin(r);
    const sx = dancer.scaleX || 1;
    const sy = dancer.scaleY || 1;
    const lx = (point?.x || 0) * sx;
    const ly = (point?.y || 0) * sy;
    const rx = lx * cos - ly * sin;
    const ry = lx * sin + ly * cos;
    return { x: (dancer.x || 0) + rx, y: (dancer.y || 0) + ry };
  },

  // Convert absolute canvas coordinates to local dancer coordinates
  absoluteToLocal: (dancer, absPoint) => {
    const dx = (absPoint?.x || 0) - (dancer.x || 0);
    const dy = (absPoint?.y || 0) - (dancer.y || 0);
    const rotationDeg = dancer.rotation || 0;
    const r = (rotationDeg * Math.PI) / 180;
    const cos = Math.cos(-r);
    const sin = Math.sin(-r);
    const rx = dx * cos - dy * sin;
    const ry = dx * sin + dy * cos;
    const sx = dancer.scaleX || 1;
    const sy = dancer.scaleY || 1;
    return { x: rx / sx, y: ry / sy };
  },
};

export default coordinateTransforms;
