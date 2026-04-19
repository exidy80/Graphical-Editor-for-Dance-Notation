export const getNodeVisualCenter = (node) => {
  const rect = node.getClientRect();
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
};

export const getCenterDeltaInParentSpace = (
  node,
  beforeCenter,
  afterCenter,
) => {
  const parent = node.getParent?.();
  if (!parent?.getAbsoluteTransform) {
    return {
      x: beforeCenter.x - afterCenter.x,
      y: beforeCenter.y - afterCenter.y,
    };
  }

  const parentTransform = parent.getAbsoluteTransform().copy();
  parentTransform.invert();

  const beforeLocal = parentTransform.point(beforeCenter);
  const afterLocal = parentTransform.point(afterCenter);

  return {
    x: beforeLocal.x - afterLocal.x,
    y: beforeLocal.y - afterLocal.y,
  };
};

export const rotatePointAroundPivot = (point, pivot, degrees) => {
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const dx = point.x - pivot.x;
  const dy = point.y - pivot.y;

  // Screen-space rotation where positive angles rotate clockwise.
  return {
    x: pivot.x + dx * cos - dy * sin,
    y: pivot.y + dx * sin + dy * cos,
  };
};

export const getStageDeltaInParentSpace = (
  node,
  beforeStagePoint,
  afterStagePoint,
) => {
  const parent = node.getParent?.();
  if (!parent?.getAbsoluteTransform) {
    return {
      x: afterStagePoint.x - beforeStagePoint.x,
      y: afterStagePoint.y - beforeStagePoint.y,
    };
  }

  const parentTransform = parent.getAbsoluteTransform().copy();
  parentTransform.invert();

  const beforeLocal = parentTransform.point(beforeStagePoint);
  const afterLocal = parentTransform.point(afterStagePoint);

  return {
    x: afterLocal.x - beforeLocal.x,
    y: afterLocal.y - beforeLocal.y,
  };
};
