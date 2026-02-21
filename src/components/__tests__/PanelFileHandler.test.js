import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PanelFileHandler from '../PanelFileHandler';
import { useAppStore } from '../../stores';

test('renders Open, Save, and Save As buttons', () => {
  render(<PanelFileHandler />);
  expect(screen.getByText(/Open/i)).toBeInTheDocument();
  expect(screen.getByText(/^Save$/i)).toBeInTheDocument();
  expect(screen.getByText(/Save As/i)).toBeInTheDocument();
});

test('invalid JSON on open does not replace panels and shows alert', () => {
  const originalPanels = useAppStore.getState().panels;
  const setPanelsSpy = jest.spyOn(useAppStore.getState(), 'setPanels');

  const originalFileReader = global.FileReader;
  global.FileReader = class MockFileReader {
    constructor() {
      this.onload = null;
    }

    readAsText() {
      if (this.onload) {
        this.onload({ target: { result: '{ invalid json' } });
      }
    }
  };

  const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

  const { container } = render(<PanelFileHandler />);
  const fileInput = container.querySelector('input[type="file"]');

  fireEvent.change(fileInput, {
    target: {
      files: [
        new File(['{ invalid json'], 'bad.json', { type: 'application/json' }),
      ],
    },
  });

  expect(setPanelsSpy).not.toHaveBeenCalled();
  expect(useAppStore.getState().panels).toBe(originalPanels);
  expect(alertSpy).toHaveBeenCalled();

  setPanelsSpy.mockRestore();
  alertSpy.mockRestore();
  global.FileReader = originalFileReader;
});
