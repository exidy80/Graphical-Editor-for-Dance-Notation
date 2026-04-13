/**
 * Shape Registry integrity tests.
 *
 * Rule: every type string exported from shapeTypes.js must have an entry in
 * the registry.  This test acts as a compile-time guard — if you add a new
 * type constant but forget to add it to shapeRegistry.js, this test fails.
 */

import * as ShapeTypes from '../../constants/shapeTypes';
import {
  SHAPE_REGISTRY,
  DEFAULT_SHAPE_DIMENSIONS,
} from '../../constants/shapeRegistry';
import { isShapeInCategory, LAYER_KEYS } from '../../utils/layersConfig';

// All shape type string values from shapeTypes.js (factory functions excluded)
const TYPE_STRINGS = Object.values(ShapeTypes).filter(
  (v) => typeof v === 'string',
);

// Layer keys that shapes can belong to (excludes 'body' — that is for dancers)
const VALID_CATEGORIES = LAYER_KEYS.filter((k) => k !== 'body');

describe('shapeRegistry — completeness', () => {
  test.each(TYPE_STRINGS)('type "%s" has a registry entry', (typeString) => {
    expect(SHAPE_REGISTRY[typeString]).toBeDefined();
  });
});

describe('shapeRegistry — entry validity', () => {
  const entries = Object.entries(SHAPE_REGISTRY);

  test('every entry has a valid category', () => {
    entries.forEach(([type, meta]) => {
      expect(VALID_CATEGORIES).toContain(meta.category);
    });
  });

  test('every entry has a renderKind string', () => {
    entries.forEach(([type, meta]) => {
      expect(typeof meta.renderKind).toBe('string');
      expect(meta.renderKind.length).toBeGreaterThan(0);
    });
  });

  test('every entry has numeric defaultDimensions', () => {
    entries.forEach(([type, meta]) => {
      expect(typeof meta.defaultDimensions.width).toBe('number');
      expect(typeof meta.defaultDimensions.height).toBe('number');
      expect(meta.defaultDimensions.width).toBeGreaterThan(0);
      expect(meta.defaultDimensions.height).toBeGreaterThan(0);
    });
  });

  test('straight-line entries have points array with 4 elements', () => {
    entries
      .filter(([, meta]) => meta.renderKind === 'straightLine')
      .forEach(([type, meta]) => {
        expect(Array.isArray(meta.renderConfig?.points)).toBe(true);
        expect(meta.renderConfig.points).toHaveLength(4);
      });
  });

  test('spin entries have required renderConfig fields', () => {
    entries
      .filter(([, meta]) => meta.renderKind === 'spin')
      .forEach(([type, meta]) => {
        const cfg = meta.renderConfig;
        expect(typeof cfg.numPoints).toBe('number');
        expect(typeof cfg.radiusIncrement).toBe('number');
        expect(typeof cfg.angleIncrement).toBe('number');
        expect(['cw', 'ccw']).toContain(cfg.direction);
      });
  });

  test('curvedLine entries have required renderConfig fields', () => {
    entries
      .filter(([, meta]) => meta.renderKind === 'curvedLine')
      .forEach(([type, meta]) => {
        const cfg = meta.renderConfig;
        expect(typeof cfg.numPoints).toBe('number');
        expect(typeof cfg.startAngle).toBe('number');
      });
  });
});

describe('shapeRegistry — layersConfig integration', () => {
  test('every registry type is classified into exactly one layer by isShapeInCategory', () => {
    Object.keys(SHAPE_REGISTRY).forEach((type) => {
      const matches = VALID_CATEGORIES.filter((key) =>
        isShapeInCategory({ type }, key),
      );
      expect(matches).toHaveLength(1);
    });
  });

  test('DEFAULT_SHAPE_DIMENSIONS has positive width and height', () => {
    expect(DEFAULT_SHAPE_DIMENSIONS.width).toBeGreaterThan(0);
    expect(DEFAULT_SHAPE_DIMENSIONS.height).toBeGreaterThan(0);
  });
});
