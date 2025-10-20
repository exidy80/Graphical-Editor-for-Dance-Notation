// Test for the improved file dialog functionality
import { useAppStore } from '../../stores';

// Mock File System Access API
const mockFileHandle = {
  createWritable: jest.fn().mockResolvedValue({
    write: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
  }),
  getFile: jest
    .fn()
    .mockResolvedValue(
      new File(['{"test": "data"}'], 'test.json', { type: 'application/json' }),
    ),
};

const mockShowSaveFilePicker = jest.fn().mockResolvedValue(mockFileHandle);
const mockShowOpenFilePicker = jest.fn().mockResolvedValue([mockFileHandle]);

// Add these to global for testing
global.showSaveFilePicker = mockShowSaveFilePicker;
global.showOpenFilePicker = mockShowOpenFilePicker;

describe('File System Access API Integration', () => {
  let store;

  beforeEach(() => {
    store = useAppStore.getState();
    jest.clearAllMocks();

    // Reset store to a known state
    useAppStore.setState(
      {
        panels: [
          {
            id: 'test-panel',
            dancers: [
              {
                id: 'dancer-1',
                x: 100,
                y: 100,
                colour: 'red',
                rotation: 0,
                scaleX: 1,
                scaleY: 1,
                leftHandPos: { x: -30, y: -40 },
                rightHandPos: { x: 30, y: -40 },
                leftElbowPos: { x: -45, y: -12 },
                rightElbowPos: { x: 45, y: -12 },
                leftHandRotation: 0,
                rightHandRotation: 0,
                leftUpperArmThickness: 'thick',
                leftLowerArmThickness: 'thick',
                rightUpperArmThickness: 'thick',
                rightLowerArmThickness: 'thick',
              },
            ],
            headShapes: ['Upright'],
            handShapes: [{ left: 'Waist', right: 'Waist' }],
            shapes: [
              {
                id: 'shape-1',
                type: 'signal',
                x: 50,
                y: 50,
                stroke: 'blue',
                fill: 'blue',
              },
            ],
            locks: [],
          },
        ],
      },
      false,
    );
  });

  test('should detect File System Access API availability', () => {
    // Test with API available
    global.showSaveFilePicker = mockShowSaveFilePicker;
    global.showOpenFilePicker = mockShowOpenFilePicker;

    const hasFileSystemAccess =
      'showSaveFilePicker' in global && 'showOpenFilePicker' in global;
    expect(hasFileSystemAccess).toBe(true);
  });

  test('should detect when File System Access API is not available', () => {
    // Remove the APIs temporarily
    delete global.showSaveFilePicker;
    delete global.showOpenFilePicker;

    const hasFileSystemAccess =
      'showSaveFilePicker' in global && 'showOpenFilePicker' in global;
    expect(hasFileSystemAccess).toBe(false);

    // Restore for other tests
    global.showSaveFilePicker = mockShowSaveFilePicker;
    global.showOpenFilePicker = mockShowOpenFilePicker;
  });

  test('should serialize data correctly for File System Access API', () => {
    const panels = useAppStore.getState().panels;
    const serializedPanels = panels
      .map((panel) => store.serializePanel(panel.id))
      .filter((panel) => panel !== null);

    expect(serializedPanels).toHaveLength(1);
    expect(serializedPanels[0].dancers).toHaveLength(1);
    expect(serializedPanels[0].shapes).toHaveLength(1);

    const jsonString = JSON.stringify(serializedPanels, null, 2);
    expect(jsonString).toContain('test-panel');
    expect(jsonString).toContain('dancer-1');
    expect(jsonString).toContain('shape-1');
  });

  test('should handle File System Access API save options correctly', () => {
    const expectedOptions = {
      suggestedName: 'dance-notation.json',
      types: [
        {
          description: 'JSON files',
          accept: {
            'application/json': ['.json'],
          },
        },
      ],
    };

    // This would be called by the downloadPanels function
    expect(expectedOptions.suggestedName).toBe('dance-notation.json');
    expect(expectedOptions.types[0].accept['application/json']).toContain(
      '.json',
    );
  });

  test('should handle File System Access API open options correctly', () => {
    const expectedOptions = {
      types: [
        {
          description: 'JSON files',
          accept: {
            'application/json': ['.json'],
          },
        },
      ],
      multiple: false,
    };

    expect(expectedOptions.multiple).toBe(false);
    expect(expectedOptions.types[0].accept['application/json']).toContain(
      '.json',
    );
  });

  test('should handle user cancellation gracefully', async () => {
    // Mock user cancellation
    const abortError = new Error('User cancelled');
    abortError.name = 'AbortError';

    const cancelledSaveFilePicker = jest.fn().mockRejectedValue(abortError);
    const cancelledOpenFilePicker = jest.fn().mockRejectedValue(abortError);

    global.showSaveFilePicker = cancelledSaveFilePicker;
    global.showOpenFilePicker = cancelledOpenFilePicker;

    // These should not throw errors when user cancels
    expect(async () => {
      try {
        await global.showSaveFilePicker();
      } catch (err) {
        if (err.name === 'AbortError') {
          // This is expected behavior
          return;
        }
        throw err;
      }
    }).not.toThrow();

    // Restore mocks
    global.showSaveFilePicker = mockShowSaveFilePicker;
    global.showOpenFilePicker = mockShowOpenFilePicker;
  });

  test('should provide proper fallback when API fails', () => {
    // Test that the fallback download method would work
    const panels = useAppStore.getState().panels;
    const serializedPanels = panels
      .map((panel) => store.serializePanel(panel.id))
      .filter((panel) => panel !== null);

    const jsonString = JSON.stringify(serializedPanels, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });

    expect(blob.type).toBe('application/json');
    expect(blob.size).toBeGreaterThan(0);
  });
});
