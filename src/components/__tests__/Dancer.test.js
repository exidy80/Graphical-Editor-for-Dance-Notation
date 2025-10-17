import React from 'react';
import { render } from '@testing-library/react';
import Dancer from '../Dancer';
import { useAppStore } from '../useAppStore';

test('Dancer renders without errors and uses store data', () => {
  const panel = useAppStore.getState().panels[0];
  const dancer = panel.dancers[0];
  render(<Dancer panelId={panel.id} id={dancer.id} />);
});


