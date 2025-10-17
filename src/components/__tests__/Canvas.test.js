import React from 'react';
import { render } from '@testing-library/react';
import Canvas from '../Canvas';
import { useAppStore } from '../useAppStore';

test('Canvas renders without crashing for first panel', () => {
  const panelId = useAppStore.getState().panels[0].id;
  render(<Canvas panelId={panelId} />);
});


