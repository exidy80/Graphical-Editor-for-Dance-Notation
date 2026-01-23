// Comprehensive Save/Restore functionality tests
import { useAppStore } from '../../stores';

// Mock file download/upload functionality for tests
global.URL = {
  createObjectURL: jest.fn(() => 'mock-url'),
  revokeObjectURL: jest.fn(),
};

// Mock file reader
global.FileReader = jest.fn(() => ({
  readAsText: jest.fn(),
  onload: jest.fn(),
}));

// Mock DOM methods
document.createElement = jest.fn((tagName) => {
  if (tagName === 'a') {
    return {
      href: '',
      download: '',
      click: jest.fn(),
    };
  }
  return {};
});

document.body.appendChild = jest.fn();
document.body.removeChild = jest.fn();

describe('Save/Restore Functionality', () => {
  let store;

  beforeEach(() => {
    store = useAppStore.getState();
    // Reset store to initial state
    useAppStore.setState(
      {
        panelSize: { width: 300, height: 300 },
        selectedPanel: null,
        selectedHand: null,
        selectedDancer: null,
        selectedShapeId: null,
        panels: [
          {
            id: 'test-panel-1',
            dancers: [
              {
                id: 'dancer-1',
                x: 150,
                y: 40,
                colour: 'red',
                rotation: 180,
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
              {
                id: 'dancer-2',
                x: 150,
                y: 220,
                colour: 'blue',
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
            headShapes: ['Upright', 'Bow'],
            handShapes: [
              { left: 'Waist', right: 'Shoulder' },
              { left: 'Knee', right: 'Overhead' },
            ],
            shapes: [
              {
                id: 'shape-1',
                type: 'signal',
                x: 100,
                y: 100,
                stroke: 'red',
                fill: 'red',
                draggable: true,
              },
              {
                id: 'shape-2',
                type: 'spinOne',
                x: 200,
                y: 150,
                stroke: 'blue',
                fill: 'blue',
                rotation: 45,
                scaleX: 1.5,
                scaleY: 0.8,
                draggable: true,
              },
            ],
            locks: [
              {
                id: 'lock-1',
                members: [
                  { dancerId: 'dancer-1', side: 'left' },
                  { dancerId: 'dancer-2', side: 'right' },
                ],
              },
            ],
          },
        ],
        handFlash: [],
        lockUi: { active: false, selected: [] },
        opacity: {
          dancers: { value: 1, disabled: false },
          symbols: { value: 1, disabled: false },
        },
      },
      false,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Serialization (serializePanel)', () => {
    test('should serialize panel with all dancer properties', () => {
      const panelId = 'test-panel-1';
      const serialized = store.serializePanel(panelId);

      expect(serialized).toBeDefined();
      expect(serialized.id).toBe(panelId);
      expect(serialized.dancers).toHaveLength(2);

      // Check first dancer serialization
      const dancer1 = serialized.dancers[0];
      expect(dancer1.id).toBe('dancer-1');
      expect(dancer1.x).toBe(150);
      expect(dancer1.y).toBe(40);
      expect(dancer1.colour).toBe('red');
      expect(dancer1.rotation).toBe(180);
      expect(dancer1.scaleX).toBe(1);
      expect(dancer1.scaleY).toBe(1);
      expect(dancer1.leftHandPos).toEqual({ x: -30, y: -40 });
      expect(dancer1.rightHandPos).toEqual({ x: 30, y: -40 });
      expect(dancer1.leftElbowPos).toEqual({ x: -45, y: -12 });
      expect(dancer1.rightElbowPos).toEqual({ x: 45, y: -12 });
      expect(dancer1.headShape).toBe('Upright');
      expect(dancer1.handShapes).toEqual({ left: 'Waist', right: 'Shoulder' });
      expect(dancer1.leftUpperArmThickness).toBe('thick');
      expect(dancer1.leftLowerArmThickness).toBe('thick');
      expect(dancer1.rightUpperArmThickness).toBe('thick');
      expect(dancer1.rightLowerArmThickness).toBe('thick');
    });

    test('should serialize panel with all shape properties', () => {
      const panelId = 'test-panel-1';
      const serialized = store.serializePanel(panelId);

      expect(serialized.shapes).toHaveLength(2);

      // Check first shape serialization
      const shape1 = serialized.shapes[0];
      expect(shape1.id).toBe('shape-1');
      expect(shape1.type).toBe('signal');
      expect(shape1.x).toBe(100);
      expect(shape1.y).toBe(100);
      expect(shape1.stroke).toBe('red');
      expect(shape1.fill).toBe('red');
      expect(shape1.draggable).toBe(true);

      // Check second shape with transform properties
      const shape2 = serialized.shapes[1];
      expect(shape2.id).toBe('shape-2');
      expect(shape2.type).toBe('spinOne');
      expect(shape2.rotation).toBe(45);
      expect(shape2.scaleX).toBe(1.5);
      expect(shape2.scaleY).toBe(0.8);
    });

    test('should serialize panel with locks', () => {
      const panelId = 'test-panel-1';
      const serialized = store.serializePanel(panelId);

      expect(serialized.locks).toHaveLength(1);

      const lock = serialized.locks[0];
      expect(lock.id).toBe('lock-1');
      expect(lock.members).toHaveLength(2);
      expect(lock.members[0]).toEqual({ dancerId: 'dancer-1', side: 'left' });
      expect(lock.members[1]).toEqual({ dancerId: 'dancer-2', side: 'right' });
    });

    test('should return null for non-existent panel', () => {
      const serialized = store.serializePanel('non-existent-panel');
      expect(serialized).toBeNull();
    });
  });

  describe('Deserialization (deserializePanel)', () => {
    test('should deserialize panel and generate new IDs', () => {
      const panelId = 'test-panel-1';
      const originalSerialized = store.serializePanel(panelId);
      const deserialized = store.deserializePanel(originalSerialized);

      // Panel should have new ID
      expect(deserialized.id).not.toBe(originalSerialized.id);
      expect(deserialized.id).toBeDefined();

      // Dancers should have new IDs but preserve data
      expect(deserialized.dancers).toHaveLength(2);
      deserialized.dancers.forEach((dancer, index) => {
        const original = originalSerialized.dancers[index];
        expect(dancer.id).not.toBe(original.id);
        expect(dancer.id).toBeDefined();

        // All other properties should be preserved
        expect(dancer.x).toBe(original.x);
        expect(dancer.y).toBe(original.y);
        expect(dancer.colour).toBe(original.colour);
        expect(dancer.rotation).toBe(original.rotation);
        expect(dancer.leftHandPos).toEqual(original.leftHandPos);
        expect(dancer.rightHandPos).toEqual(original.rightHandPos);
        expect(dancer.headShape).toBe(original.headShape);
        expect(dancer.handShapes).toEqual(original.handShapes);
      });

      // Shapes should have new IDs but preserve data
      expect(deserialized.shapes).toHaveLength(2);
      deserialized.shapes.forEach((shape, index) => {
        const original = originalSerialized.shapes[index];
        expect(shape.id).not.toBe(original.id);
        expect(shape.id).toBeDefined();

        // All other properties should be preserved
        expect(shape.type).toBe(original.type);
        expect(shape.x).toBe(original.x);
        expect(shape.y).toBe(original.y);
        expect(shape.stroke).toBe(original.stroke);
        expect(shape.fill).toBe(original.fill);
      });

      // Locks should be remapped to new dancer IDs
      expect(deserialized.locks).toHaveLength(1);
      const lock = deserialized.locks[0];
      expect(lock.id).not.toBe(originalSerialized.locks[0].id);
      expect(lock.members).toHaveLength(2);

      // Lock members should reference new dancer IDs
      const newDancerIds = deserialized.dancers.map((d) => d.id);
      lock.members.forEach((member) => {
        expect(newDancerIds).toContain(member.dancerId);
      });
    });

    test('should preserve head and hand shapes arrays structure', () => {
      const panelId = 'test-panel-1';
      const originalSerialized = store.serializePanel(panelId);
      const deserialized = store.deserializePanel(originalSerialized);

      expect(deserialized.headShapes).toEqual(['Upright', 'Bow']);
      expect(deserialized.handShapes).toEqual([
        { left: 'Waist', right: 'Shoulder' },
        { left: 'Knee', right: 'Overhead' },
      ]);
    });
  });

  describe('Complete Save/Import Round-trip', () => {
    test('should maintain data integrity after save and import cycle', () => {
      const originalPanels = store.panels;
      const originalPanel = originalPanels[0];

      // Simulate saving: serialize all panels
      const serializedPanels = originalPanels.map((panel) =>
        store.serializePanel(panel.id),
      );

      // Verify serialization worked
      expect(serializedPanels).toHaveLength(1);
      expect(serializedPanels[0]).toBeDefined();

      // Simulate importing: deserialize panels and set them
      const importedPanels = serializedPanels.map((panelData) =>
        store.deserializePanel(panelData),
      );
      store.setPanels(importedPanels);

      const newPanels = useAppStore.getState().panels;
      expect(newPanels).toHaveLength(1);

      const importedPanel = newPanels[0];

      // Verify panel structure is preserved (but with new IDs)
      expect(importedPanel.id).not.toBe(originalPanel.id);
      expect(importedPanel.dancers).toHaveLength(originalPanel.dancers.length);
      expect(importedPanel.shapes).toHaveLength(originalPanel.shapes.length);
      expect(importedPanel.locks).toHaveLength(originalPanel.locks.length);

      // Verify dancer data integrity
      importedPanel.dancers.forEach((dancer, index) => {
        const originalDancer = originalPanel.dancers[index];
        expect(dancer.x).toBe(originalDancer.x);
        expect(dancer.y).toBe(originalDancer.y);
        expect(dancer.colour).toBe(originalDancer.colour);
        expect(dancer.rotation).toBe(originalDancer.rotation);
        expect(dancer.leftHandPos).toEqual(originalDancer.leftHandPos);
        expect(dancer.rightHandPos).toEqual(originalDancer.rightHandPos);
      });

      // Verify shape data integrity
      importedPanel.shapes.forEach((shape, index) => {
        const originalShape = originalPanel.shapes[index];
        expect(shape.type).toBe(originalShape.type);
        expect(shape.x).toBe(originalShape.x);
        expect(shape.y).toBe(originalShape.y);
        expect(shape.stroke).toBe(originalShape.stroke);
        expect(shape.fill).toBe(originalShape.fill);
      });

      // Verify lock relationships are maintained
      expect(importedPanel.locks[0].members).toHaveLength(2);
      const newDancerIds = importedPanel.dancers.map((d) => d.id);
      importedPanel.locks[0].members.forEach((member) => {
        expect(newDancerIds).toContain(member.dancerId);
      });
    });

    test('should handle multiple panels correctly', () => {
      // Add a second panel to test multiple panels
      store.addPanel();
      const panels = useAppStore.getState().panels;
      expect(panels).toHaveLength(2);

      // Modify second panel to have different data
      const secondPanelId = panels[1].id;
      store.updateDancerState(secondPanelId, panels[1].dancers[0].id, {
        x: 200,
        colour: 'green',
      });

      // Serialize and deserialize all panels
      const serializedPanels = panels.map((panel) =>
        store.serializePanel(panel.id),
      );
      const importedPanels = serializedPanels.map((panelData) =>
        store.deserializePanel(panelData),
      );
      store.setPanels(importedPanels);

      const newPanels = useAppStore.getState().panels;
      expect(newPanels).toHaveLength(2);

      // Verify second panel maintained its modifications
      const importedSecondPanel = newPanels[1];
      expect(importedSecondPanel.dancers[0].x).toBe(200);
      expect(importedSecondPanel.dancers[0].colour).toBe('green');
    });

    test('should handle empty panels array', () => {
      store.setPanels([]);
      const panels = useAppStore.getState().panels;
      expect(panels).toHaveLength(0);

      // Serialize empty array
      const serializedPanels = panels.map((panel) =>
        store.serializePanel(panel.id),
      );
      expect(serializedPanels).toHaveLength(0);

      // Import empty array
      const importedPanels = serializedPanels.map((panelData) =>
        store.deserializePanel(panelData),
      );
      store.setPanels(importedPanels);

      const newPanels = useAppStore.getState().panels;
      expect(newPanels).toHaveLength(0);
    });
  });

  describe('Error handling and robustness', () => {
    test('should handle malformed data gracefully', () => {
      const malformedData = {
        id: 'test',
        dancers: null, // This could cause issues
        shapes: undefined,
        locks: 'not-an-array',
      };

      // This should not throw an error
      expect(() => {
        const result = store.deserializePanel(malformedData);
        expect(result).toBeDefined();
      }).not.toThrow();
    });

    test('should handle missing properties in serialized data', () => {
      const incompleteData = {
        id: 'test',
        dancers: [
          {
            id: 'dancer-1',
            x: 100,
            // Missing many properties
          },
        ],
        // Missing shapes, locks, headShapes, handShapes
      };

      expect(() => {
        const result = store.deserializePanel(incompleteData);
        expect(result).toBeDefined();
        expect(result.dancers).toHaveLength(1);
      }).not.toThrow();
    });

    test('handles null dancers array', () => {
      const malformedData = {
        id: 'test-panel',
        dancers: null,
        shapes: [{ id: 'shape-1', type: 'signal' }],
        locks: [],
        headShapes: [],
        handShapes: [],
      };

      const result = store.deserializePanel(malformedData);
      expect(result).toBeDefined();
      expect(result.dancers).toEqual([]);
      expect(result.shapes).toHaveLength(1);
    });

    test('handles undefined shapes array', () => {
      const malformedData = {
        id: 'test-panel',
        dancers: [{ id: 'dancer-1', x: 0, y: 0 }],
        shapes: undefined,
        locks: [],
      };

      const result = store.deserializePanel(malformedData);
      expect(result).toBeDefined();
      expect(result.dancers).toHaveLength(1);
      expect(result.shapes).toEqual([]);
    });

    test('handles non-array locks property', () => {
      const malformedData = {
        id: 'test-panel',
        dancers: [],
        shapes: [],
        locks: 'not-an-array',
      };

      const result = store.deserializePanel(malformedData);
      expect(result).toBeDefined();
      expect(result.locks).toEqual([]);
    });

    test('handles completely empty object', () => {
      const malformedData = {};

      const result = store.deserializePanel(malformedData);
      expect(result).toBeDefined();
      expect(result.dancers).toEqual([]);
      expect(result.shapes).toEqual([]);
      expect(result.locks).toEqual([]);
      expect(result.headShapes).toEqual([]);
      expect(result.handShapes).toEqual([]);
    });

    test('handles null input', () => {
      const result = store.deserializePanel(null);
      expect(result).toBeNull();
    });

    test('handles undefined input', () => {
      const result = store.deserializePanel(undefined);
      expect(result).toBeNull();
    });

    test('handles missing properties in serialization gracefully', () => {
      // Create a panel with some missing properties
      const incompletePanel = {
        id: 'incomplete-panel',
        dancers: [
          {
            id: 'dancer-1',
            // Missing many properties like x, y, colour, etc.
          },
        ],
        shapes: [
          {
            id: 'shape-1',
            type: 'signal',
            // Missing x, y, stroke, fill, etc.
          },
        ],
        // Missing headShapes, handShapes
      };

      useAppStore.setState({ panels: [incompletePanel] }, false);

      const serialized = store.serializePanel('incomplete-panel');
      expect(serialized).toBeDefined();
      expect(serialized.dancers).toHaveLength(1);
      expect(serialized.shapes).toHaveLength(1);

      // Check that defaults are applied
      const dancer = serialized.dancers[0];
      expect(dancer.x).toBe(0);
      expect(dancer.y).toBe(0);
      expect(dancer.colour).toBe('red');
      expect(dancer.headShape).toBe('Upright');

      const shape = serialized.shapes[0];
      expect(shape.x).toBe(0);
      expect(shape.y).toBe(0);
      expect(shape.draggable).toBe(true);
    });

    test('importing corrupted file data fails gracefully', () => {
      const corruptedData = [
        {
          // Missing essential id
          dancers: null, // This should be handled
          shapes: 'not-an-array', // This should be handled
          locks: undefined, // This should be handled
        },
        null, // This entire panel is null
        {
          id: 'valid-panel',
          dancers: [{ id: 'valid-dancer', x: 0, y: 0 }],
          shapes: [],
          locks: [],
        },
      ];

      // Process each panel (simulating the import process)
      const importedPanels = [];
      corruptedData.forEach((panelData) => {
        const result = store.deserializePanel(panelData);
        if (result) {
          importedPanels.push(result);
        }
      });

      // Should have imported only the valid panels
      expect(importedPanels).toHaveLength(2); // First corrupted panel + valid panel
      expect(importedPanels[0].dancers).toEqual([]);
      expect(importedPanels[0].shapes).toEqual([]);
      expect(importedPanels[1].dancers).toHaveLength(1);
    });
  });

  describe('File Handler Component Integration', () => {
    test('should create downloadable blob with correct data', async () => {
      const mockBlob = jest.fn();
      global.Blob = mockBlob;

      // Mock the download function behavior
      const panels = store.panels;
      const serializedPanels = panels.map((panel) =>
        store.serializePanel(panel.id),
      );
      const jsonString = JSON.stringify(serializedPanels);

      // Verify JSON string contains expected data
      const parsedData = JSON.parse(jsonString);
      expect(parsedData).toHaveLength(1);
      expect(parsedData[0].dancers).toHaveLength(2);
      expect(parsedData[0].shapes).toHaveLength(2);
      expect(parsedData[0].locks).toHaveLength(1);
    });

    test('should handle file upload parsing', () => {
      const mockFileContent = JSON.stringify([
        {
          id: 'imported-panel',
          dancers: [
            {
              id: 'imported-dancer',
              x: 100,
              y: 200,
              colour: 'purple',
              rotation: 90,
              headShape: 'Duck',
              handShapes: { left: 'Overhead', right: 'Knee' },
              leftHandPos: { x: -20, y: -30 },
              rightHandPos: { x: 20, y: -30 },
              leftElbowPos: { x: -40, y: -10 },
              rightElbowPos: { x: 40, y: -10 },
            },
          ],
          shapes: [],
          locks: [],
          headShapes: ['Duck'],
          handShapes: [{ left: 'Overhead', right: 'Knee' }],
        },
      ]);

      // Parse the JSON and deserialize
      const parsedData = JSON.parse(mockFileContent);
      const loadedPanels = parsedData.map((panelData) =>
        store.deserializePanel(panelData),
      );

      expect(loadedPanels).toHaveLength(1);
      expect(loadedPanels[0].dancers).toHaveLength(1);
      expect(loadedPanels[0].dancers[0].colour).toBe('purple');
      expect(loadedPanels[0].dancers[0].x).toBe(100);
      expect(loadedPanels[0].dancers[0].y).toBe(200);
    });
  });

  describe('Complex scenario tests', () => {
    test('complete save and restore cycle with complex data', () => {
      // Create a complex panel with multiple dancers, shapes, and locks
      const complexPanelId = 'complex-panel';
      store.addPanel();
      const panels = useAppStore.getState().panels;
      const newPanel = panels[panels.length - 1];

      // Modify the new panel to have complex data
      useAppStore.setState(
        (state) => ({
          panels: state.panels.map((p) =>
            p.id === newPanel.id
              ? {
                  ...p,
                  id: complexPanelId,
                  dancers: [
                    {
                      ...p.dancers[0],
                      x: 100,
                      y: 50,
                      rotation: 45,
                      scaleX: 1.5,
                      scaleY: 0.8,
                      colour: 'purple',
                    },
                    {
                      ...p.dancers[1],
                      x: 200,
                      y: 150,
                      rotation: -30,
                      colour: 'green',
                    },
                  ],
                  shapes: [
                    {
                      id: 'complex-shape-1',
                      type: 'spinOne',
                      x: 150,
                      y: 100,
                      rotation: 90,
                      scaleX: 2,
                      scaleY: 1.5,
                      stroke: 'orange',
                      fill: 'orange',
                    },
                    {
                      id: 'complex-shape-2',
                      type: 'quarterCurvedLine',
                      x: 75,
                      y: 200,
                      stroke: 'cyan',
                      fill: 'cyan',
                    },
                  ],
                  locks: [
                    {
                      id: 'complex-lock-1',
                      members: [
                        { dancerId: p.dancers[0].id, side: 'left' },
                        { dancerId: p.dancers[1].id, side: 'right' },
                      ],
                    },
                  ],
                  headShapes: ['Bow', 'Duck'],
                  handShapes: [
                    { left: 'Shoulder', right: 'Overhead' },
                    { left: 'Knee', right: 'Waist' },
                  ],
                }
              : p,
          ),
        }),
        false,
      );

      // Save the complex panel
      const serialized = store.serializePanel(complexPanelId);
      expect(serialized).toBeDefined();

      // Import it back
      const deserialized = store.deserializePanel(serialized);
      expect(deserialized).toBeDefined();

      // Verify all complex data is preserved
      expect(deserialized.dancers).toHaveLength(2);
      expect(deserialized.shapes).toHaveLength(2);
      expect(deserialized.locks).toHaveLength(1);

      // Check specific dancer properties
      const dancer1 = deserialized.dancers[0];
      expect(dancer1.x).toBe(100);
      expect(dancer1.y).toBe(50);
      expect(dancer1.rotation).toBe(45);
      expect(dancer1.scaleX).toBe(1.5);
      expect(dancer1.scaleY).toBe(0.8);
      expect(dancer1.colour).toBe('purple');
      expect(dancer1.headShape).toBe('Bow');

      // Check shape properties
      const shape1 = deserialized.shapes[0];
      expect(shape1.type).toBe('spinOne');
      expect(shape1.x).toBe(150);
      expect(shape1.y).toBe(100);
      expect(shape1.rotation).toBe(90);
      expect(shape1.scaleX).toBe(2);
      expect(shape1.scaleY).toBe(1.5);
      expect(shape1.stroke).toBe('orange');

      // Check that locks are properly remapped
      const lock = deserialized.locks[0];
      expect(lock.members).toHaveLength(2);
      const newDancerIds = deserialized.dancers.map((d) => d.id);
      lock.members.forEach((member) => {
        expect(newDancerIds).toContain(member.dancerId);
      });
    });
  });
});
