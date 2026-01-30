import React from 'react';
import { render, screen } from '@testing-library/react';
import { useAppStore } from '../../stores';
import Canvas from '../Canvas';

// This test will fail until the glow mechanism is generalized

describe('Generalized glow/flash mechanism', () => {
  test('can trigger glow for a symbol by id', () => {
    const panel = useAppStore.getState().panels[0];
    const symbol = panel.shapes[0];
    // Simulate a generalized flash action (not yet implemented)
    useAppStore.getState().queueSymbolFlash(panel.id, symbol.id);
    render(<Canvas panelId={panel.id} />);
    // Assert the symbol is glowing
    const symbolNode = screen.getByTestId(`symbol-${symbol.id}`);
    expect(symbolNode.className).toMatch(/glow/);
  });

  test('can trigger glow for a dancer body by id', () => {
    const panel = useAppStore.getState().panels[0];
    const dancer = panel.dancers[0];
    // Simulate a generalized flash action (not yet implemented)
    useAppStore.getState().queueDancerFlash(panel.id, dancer.id);
    render(<Canvas panelId={panel.id} />);
    // Assert the dancer body is glowing
    const dancerNode = screen.getByTestId(`dancer-body-${dancer.id}`);
    expect(dancerNode.className).toMatch(/glow/);
  });
});
