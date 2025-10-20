import { renderHook, act } from '@testing-library/react';
import { useAppStore } from '../useAppStore';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

describe('Auto-save functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  test('should mark unsaved changes when panel is added', () => {
    const { result } = renderHook(() => useAppStore());

    act(() => {
      result.current.addPanel();
    });

    expect(result.current.hasUnsavedChanges).toBe(true);
  });

  test('should mark unsaved changes when dancer state is updated', () => {
    const { result } = renderHook(() => useAppStore());
    const panelId = result.current.panels[0].id;
    const dancerId = result.current.panels[0].dancers[0].id;

    act(() => {
      result.current.updateDancerState(panelId, dancerId, { x: 100 });
    });

    expect(result.current.hasUnsavedChanges).toBe(true);
  });

  test('should mark unsaved changes when shape is added', () => {
    const { result } = renderHook(() => useAppStore());
    const panelId = result.current.panels[0].id;

    act(() => {
      result.current.setSelectedPanel(panelId);
      result.current.handleShapeDraw({
        id: 'test-shape',
        type: 'circle',
        x: 50,
        y: 50,
        radius: 10,
        fill: 'red',
      });
    });

    expect(result.current.hasUnsavedChanges).toBe(true);
  });

  test('should have auto-save state available', () => {
    const { result } = renderHook(() => useAppStore());

    expect(typeof result.current.clearAutoSave).toBe('function');
    expect(result.current.hasUnsavedChanges).toBeDefined();
    expect(result.current.lastSaveTime).toBeDefined();
  });

  test('should automatically detect consequential changes via middleware', () => {
    const { result } = renderHook(() => useAppStore());
    const panelId = result.current.panels[0].id;
    const dancerId = result.current.panels[0].dancers[0].id;

    // Test adding panel (consequential change)
    act(() => {
      useAppStore.setState({ hasUnsavedChanges: false });
      result.current.addPanel();
    });
    expect(result.current.hasUnsavedChanges).toBe(true);

    // Test updating dancer state (consequential change)
    act(() => {
      useAppStore.setState({ hasUnsavedChanges: false });
      result.current.updateDancerState(panelId, dancerId, { x: 50 });
    });
    expect(result.current.hasUnsavedChanges).toBe(true);

    // Test UI state change (non-consequential)
    act(() => {
      useAppStore.setState({ hasUnsavedChanges: false });
      result.current.setSelectedPanel(panelId);
    });
    expect(result.current.hasUnsavedChanges).toBe(false);
  });
});
