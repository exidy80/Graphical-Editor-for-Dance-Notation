import '@testing-library/jest-dom';
import React from 'react';
import { TextEncoder, TextDecoder } from 'util';

// Polyfill TextEncoder/TextDecoder for Node.js test environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Silence specific deprecated act warning emitted by RTL + react-dom/test-utils bridge
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('`ReactDOMTestUtils.act` is deprecated')
  ) {
    return;
  }
  originalConsoleError(...args);
};

// Mock react-konva primitives to ref-friendly HTML wrappers without leaking props
jest.mock('react-konva', () => {
  const React = require('react');
  const { forwardRef, useImperativeHandle } = React;

  const makeSimple = (tag) =>
    forwardRef(({ children }, ref) => {
      useImperativeHandle(ref, () => ({}));
      return <div data-mock={tag}>{children}</div>;
    });

  const Line = forwardRef(({ children }, ref) => {
    useImperativeHandle(ref, () => ({ points: () => {} }));
    return <div data-mock="Line">{children}</div>;
  });

  const Transformer = forwardRef(({ children }, ref) => {
    useImperativeHandle(ref, () => ({
      nodes: () => {},
      getLayer: () => ({ batchDraw: () => {} }),
    }));
    return <div data-mock="Transformer">{children}</div>;
  });

  return {
    Stage: makeSimple('Stage'),
    Layer: makeSimple('Layer'),
    Group: makeSimple('Group'),
    Line,
    Rect: makeSimple('Rect'),
    Arc: makeSimple('Arc'),
    Circle: makeSimple('Circle'),
    Transformer,
    Text: makeSimple('Text'),
    Image: makeSimple('Image'),
    RegularPolygon: makeSimple('RegularPolygon'),
    Arrow: makeSimple('Arrow'),
  };
});

// Mock react-konva-utils useImage
jest.mock('react-konva-utils', () => ({
  useImage: () => [null],
}));

// Deterministic but unique-ish UUIDs for tests
jest.mock('uuid', () => {
  let c = 0;
  return { v4: () => `test-uuid-${++c}` };
});
