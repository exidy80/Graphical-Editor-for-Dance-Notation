import { fireEvent, screen, act } from '@testing-library/react';
import { useAppStore } from '../../stores';
import React from 'react';
import { render } from '@testing-library/react';
import PositionPanel from '../PositionPanel';

const setElementMetric = (element, key, value) => {
  Object.defineProperty(element, key, {
    configurable: true,
    get: () => value,
  });
};

const setupGridAndPanelMetrics = () => {
  const gridElement = document.querySelector('.position-panel-grid');
  const panelElement = document.querySelector('.position-panel');
  const canvasWrapper = panelElement.querySelector('.panel-canvas-wrapper');

  gridElement.scrollTo = jest.fn();
  setElementMetric(gridElement, 'clientWidth', 400);
  setElementMetric(gridElement, 'clientHeight', 300);
  setElementMetric(gridElement, 'scrollWidth', 3000);
  setElementMetric(gridElement, 'scrollHeight', 3000);
  setElementMetric(gridElement, 'scrollLeft', 0);
  setElementMetric(gridElement, 'scrollTop', 0);

  setElementMetric(panelElement, 'offsetLeft', 100);
  setElementMetric(panelElement, 'offsetTop', 200);
  setElementMetric(panelElement, 'clientWidth', 600);
  setElementMetric(panelElement, 'clientHeight', 640);

  gridElement.getBoundingClientRect = jest.fn(() => ({
    left: 0,
    top: 0,
    right: 400,
    bottom: 300,
    width: 400,
    height: 300,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  }));
  panelElement.getBoundingClientRect = jest.fn(() => ({
    left: 100,
    top: 200,
    right: 700,
    bottom: 840,
    width: 600,
    height: 640,
    x: 100,
    y: 200,
    toJSON: () => ({}),
  }));

  canvasWrapper.getBoundingClientRect = jest.fn(() => ({
    left: 102,
    top: 240.25,
    right: 638,
    bottom: 729.640625,
    width: 536,
    height: 489.390625,
    x: 102,
    y: 240.25,
    toJSON: () => ({}),
  }));

  setElementMetric(canvasWrapper, 'offsetLeft', 0);
  setElementMetric(canvasWrapper, 'offsetTop', 40);

  return { gridElement, panelElement };
};

const renderInGrid = () =>
  render(
    <div className="position-panel-grid">
      <PositionPanel />
    </div>,
  );

test('PositionPanel renders without crashing', () => {
  render(<PositionPanel />);
});

test('addPanel selects the newly added panel', () => {
  render(<PositionPanel />);
  const addButton = screen.getAllByTitle('Add Panel')[0];
  act(() => {
    fireEvent.click(addButton);
  });
  const panels = useAppStore.getState().panels;
  const selectedPanel = useAppStore.getState().selectedPanel;
  expect(selectedPanel).toBe(panels[panels.length - 1].id);
});

test('clonePanel selects the newly cloned panel', () => {
  render(<PositionPanel />);
  // Add a panel to ensure at least one exists
  const addButton = screen.getAllByTitle('Add Panel')[0];
  act(() => {
    fireEvent.click(addButton);
  });
  // Clone the last panel
  const cloneButtons = screen.getAllByTitle('Clone Panel');
  act(() => {
    fireEvent.click(cloneButtons[cloneButtons.length - 1]);
  });
  const panels = useAppStore.getState().panels;
  const selectedPanel = useAppStore.getState().selectedPanel;
  expect(selectedPanel).toBe(panels[panels.length - 1].id);
});

test('magnify centers selected panel when nothing is selected', () => {
  const initialPanel = useAppStore.getState().panels[0];

  act(() => {
    useAppStore.setState({
      selectedPanel: initialPanel.id,
      magnifyEnabled: false,
      selectedItems: [],
    });
  });

  renderInGrid();
  const { gridElement } = setupGridAndPanelMetrics();

  act(() => {
    useAppStore.setState({ magnifyEnabled: true });
  });

  expect(gridElement.scrollTo).toHaveBeenLastCalledWith({
    top: 390.25,
    left: 202,
    behavior: 'smooth',
  });
});

test('magnify centers one selected item', () => {
  const state = useAppStore.getState();
  const panel = state.panels[0];
  const selectedDancer = panel.dancers[0];

  act(() => {
    useAppStore.setState({
      selectedPanel: panel.id,
      magnifyEnabled: false,
      selectedItems: [
        { type: 'dancer', panelId: panel.id, id: selectedDancer.id },
      ],
    });
  });

  renderInGrid();
  const { gridElement } = setupGridAndPanelMetrics();

  act(() => {
    useAppStore.setState({ magnifyEnabled: true });
  });

  expect(gridElement.scrollTo).toHaveBeenLastCalledWith({
    top: 210.25,
    left: 202,
    behavior: 'smooth',
  });
});

test('magnify uses shared center for multi-selection', () => {
  const state = useAppStore.getState();
  const panel = state.panels[0];

  act(() => {
    useAppStore.setState({
      selectedPanel: panel.id,
      magnifyEnabled: false,
      selectedItems: [
        { type: 'dancer', panelId: panel.id, id: panel.dancers[0].id },
        { type: 'dancer', panelId: panel.id, id: panel.dancers[1].id },
      ],
    });
  });

  renderInGrid();
  const { gridElement } = setupGridAndPanelMetrics();

  act(() => {
    useAppStore.setState({ magnifyEnabled: true });
  });

  expect(gridElement.scrollTo).toHaveBeenLastCalledWith({
    top: 390.25,
    left: 202,
    behavior: 'smooth',
  });
});

test('magnify re-centers selection when canvas size increases', () => {
  const state = useAppStore.getState();
  const panel = state.panels[0];
  const selectedDancer = panel.dancers[0];

  act(() => {
    useAppStore.setState({
      selectedPanel: panel.id,
      magnifyEnabled: false,
      panelSize: { width: 300, height: 300 },
      selectedItems: [
        { type: 'dancer', panelId: panel.id, id: selectedDancer.id },
      ],
    });
  });

  renderInGrid();
  const { gridElement } = setupGridAndPanelMetrics();

  act(() => {
    useAppStore.setState({ magnifyEnabled: true });
  });

  expect(gridElement.scrollTo).toHaveBeenLastCalledWith({
    top: 210.25,
    left: 202,
    behavior: 'smooth',
  });

  act(() => {
    useAppStore.setState({
      globalCanvasSize: 2,
      panelSize: { width: 600, height: 600 },
    });
  });

  expect(gridElement.scrollTo).toHaveBeenLastCalledWith({
    top: 510.25,
    left: 502,
    behavior: 'smooth',
  });
});
