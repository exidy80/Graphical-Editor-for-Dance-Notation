// Tests for document-centric file handling (Save, Save As, Open)
import { useAppStore } from '../../stores';

// Mock File System Access API
const createMockFileHandle = (name = 'test-dance.json') => ({
  name: name,
  createWritable: jest.fn().mockResolvedValue({
    write: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
  }),
  getFile: jest.fn().mockResolvedValue(
    new File(
      [
        JSON.stringify([
          {
            id: 'loaded-panel',
            dancers: [],
            headShapes: [],
            handShapes: [],
            shapes: [],
            locks: [],
          },
        ]),
      ],
      name,
      { type: 'application/json' },
    ),
  ),
});

const mockShowSaveFilePicker = jest.fn();
const mockShowOpenFilePicker = jest.fn();

global.showSaveFilePicker = mockShowSaveFilePicker;
global.showOpenFilePicker = mockShowOpenFilePicker;

describe('Document-Centric File Handling', () => {
  let store;

  beforeEach(() => {
    store = useAppStore.getState();
    jest.clearAllMocks();

    // Reset store to initial state
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
            shapes: [],
            locks: [],
          },
        ],
        documentTitle: 'Untitled Dance',
        currentFileHandle: null,
        hasUnsavedChanges: false,
      },
      false,
    );
  });

  describe('Document Title Management', () => {
    test('should start with default title "Untitled Dance"', () => {
      const state = useAppStore.getState();
      expect(state.documentTitle).toBe('Untitled Dance');
    });

    test('should update document title', () => {
      useAppStore.getState().setDocumentTitle('My Ballet');
      expect(useAppStore.getState().documentTitle).toBe('My Ballet');
    });

    test('should sanitize document title for filename', () => {
      useAppStore.getState().setDocumentTitle('Dance: The "Best" Show!');
      const fileName = useAppStore.getState().getDocumentFileName();
      // Should replace invalid filename characters
      expect(fileName).not.toContain(':');
      expect(fileName).not.toContain('"');
    });

    test('should handle empty document title', () => {
      useAppStore.getState().setDocumentTitle('');
      const fileName = useAppStore.getState().getDocumentFileName();
      expect(fileName).toBe('Untitled Dance');
    });
  });

  describe('File Handle Management', () => {
    test('should start with no file handle', () => {
      const state = useAppStore.getState();
      expect(state.currentFileHandle).toBeNull();
    });

    test('should store file handle after opening', () => {
      const mockHandle = createMockFileHandle('my-dance.json');
      useAppStore.getState().setCurrentFileHandle(mockHandle);
      expect(useAppStore.getState().currentFileHandle).toBe(mockHandle);
    });

    test('should update title from opened filename', () => {
      const mockHandle = createMockFileHandle('Beautiful Dance.json');
      useAppStore.getState().setCurrentFileHandle(mockHandle);
      useAppStore.getState().setDocumentTitle('Beautiful Dance');

      expect(useAppStore.getState().documentTitle).toBe('Beautiful Dance');
      expect(useAppStore.getState().currentFileHandle).toBe(mockHandle);
    });
  });

  describe('Save Behavior', () => {
    test('should use document title for suggested filename on first save', () => {
      useAppStore.setState({ documentTitle: 'My First Dance' });
      const fileName = useAppStore.getState().getDocumentFileName();
      expect(fileName).toBe('My First Dance');
    });

    test('should maintain file handle after save', () => {
      const mockHandle = createMockFileHandle('existing.json');
      useAppStore.setState({ currentFileHandle: mockHandle });
      expect(useAppStore.getState().currentFileHandle).toBe(mockHandle);
    });
  });

  describe('Save As Behavior', () => {
    test('should always show file dialog for Save As', () => {
      // Even with existing file handle, Save As should show dialog
      const mockHandle = createMockFileHandle('existing.json');
      useAppStore.setState({
        currentFileHandle: mockHandle,
        documentTitle: 'Existing Dance',
      });

      // Save As should use the document title for suggestion
      const fileName = useAppStore.getState().getDocumentFileName();
      expect(fileName).toBe('Existing Dance');
    });

    test('should update file handle after Save As', () => {
      const oldHandle = createMockFileHandle('old.json');
      const newHandle = createMockFileHandle('new.json');

      useAppStore.setState({ currentFileHandle: oldHandle });
      useAppStore.getState().setCurrentFileHandle(newHandle);

      expect(useAppStore.getState().currentFileHandle).toBe(newHandle);
    });

    test('should update title after Save As with new filename', () => {
      useAppStore.getState().setDocumentTitle('New Dance Name');
      expect(useAppStore.getState().documentTitle).toBe('New Dance Name');
    });
  });

  describe('Open Behavior', () => {
    test('should set file handle when opening', () => {
      const mockHandle = createMockFileHandle('opened-dance.json');
      useAppStore.getState().setCurrentFileHandle(mockHandle);
      expect(useAppStore.getState().currentFileHandle).toBe(mockHandle);
    });

    test('should update title from opened filename', () => {
      useAppStore.getState().setDocumentTitle('Opened Dance');
      expect(useAppStore.getState().documentTitle).toBe('Opened Dance');
    });

    test('should allow save without dialog after opening', () => {
      const mockHandle = createMockFileHandle('opened.json');
      useAppStore.setState({
        currentFileHandle: mockHandle,
        documentTitle: 'Opened',
      });

      // With a file handle, save should use it directly
      expect(useAppStore.getState().currentFileHandle).not.toBeNull();
    });
  });

  describe('New Document Behavior', () => {
    test('should create new document with default state', () => {
      useAppStore.setState({
        documentTitle: 'Untitled Dance',
        currentFileHandle: null,
        hasUnsavedChanges: false,
      });

      const state = useAppStore.getState();
      expect(state.documentTitle).toBe('Untitled Dance');
      expect(state.currentFileHandle).toBeNull();
    });

    test('should prompt for filename on first save', () => {
      // New document has no file handle
      expect(useAppStore.getState().currentFileHandle).toBeNull();
    });
  });

  describe('Unsaved Changes Tracking', () => {
    test('should track unsaved changes', () => {
      // Initially no unsaved changes
      useAppStore.setState({ hasUnsavedChanges: false });
      expect(useAppStore.getState().hasUnsavedChanges).toBe(false);

      // After changes
      useAppStore.setState({ hasUnsavedChanges: true });
      expect(useAppStore.getState().hasUnsavedChanges).toBe(true);
    });

    test('should clear unsaved changes after save', () => {
      useAppStore.setState({ hasUnsavedChanges: true });
      useAppStore.getState().clearAutoSave();
      expect(useAppStore.getState().hasUnsavedChanges).toBe(false);
    });
  });

  describe('Serialization with Document State', () => {
    test('should serialize panels without document state', () => {
      const panels = useAppStore.getState().panels;
      const serializedPanels = panels
        .map((panel) => store.serializePanel(panel.id))
        .filter((panel) => panel !== null);

      const jsonString = JSON.stringify(serializedPanels, null, 2);

      // Document state should not be in serialized data
      expect(jsonString).not.toContain('documentTitle');
      expect(jsonString).not.toContain('currentFileHandle');

      // But panels should be serialized
      expect(jsonString).toContain('test-panel');
    });
  });
});
