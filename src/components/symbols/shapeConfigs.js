import { SHAPE_REGISTRY } from '../../constants/shapeRegistry';

// All four config maps are derived from the central shape registry.
// To add a new shape, add an entry to shapeRegistry.js — nothing here changes.

const byKind = (renderKind) =>
  Object.fromEntries(
    Object.entries(SHAPE_REGISTRY)
      .filter(([, meta]) => meta.renderKind === renderKind)
      .map(([type, meta]) => [type, meta.renderConfig]),
  );

export const SPIN_CONFIGS = byKind('spin');
export const CURVED_LINE_CONFIGS = byKind('curvedLine');
export const STRAIGHT_LINE_CONFIGS = byKind('straightLine');
export const DIRECTION_CONFIGS = byKind('direction');
