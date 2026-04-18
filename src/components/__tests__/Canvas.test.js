import React from 'react';
import { act, render } from '@testing-library/react';
import Canvas from '../Canvas';
import { useAppStore } from '../../stores';

const collectConsoleCalls = (spy) =>
  spy.mock.calls
    .flat()
    .filter((value) => typeof value === 'string')
    .join('\n');

test('Canvas renders without crashing for first panel', () => {
  const panelId = useAppStore.getState().panels[0].id;
  render(<Canvas panelId={panelId} />);
});

test('symbol placement flow does not emit Konva NaN warnings during render', () => {
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

  const store = useAppStore.getState();
  const panelId = store.panels[0].id;

  act(() => {
    store.armSymbolPlacement({
      panelId,
      symbolDraft: {
        id: 'nan-warning-shape',
        type: 'image',
        imageKey: 'leftFootBasicBlue',
        draggable: true,
      },
    });
  });

  act(() => {
    store.commitSymbolPlacement(panelId, {
      x: 120,
      y: 150,
      insidePanel: true,
    });
  });

  render(<Canvas panelId={panelId} />);

  const output = `${collectConsoleCalls(errorSpy)}\n${collectConsoleCalls(warnSpy)}`;

  expect(output).not.toMatch(/Konva warning:\s*NaN/i);

  errorSpy.mockRestore();
  warnSpy.mockRestore();
});
