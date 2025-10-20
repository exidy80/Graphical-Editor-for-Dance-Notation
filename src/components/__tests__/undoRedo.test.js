import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useUndoRedo } from '../useUndoRedo';
import { useAppStore } from '../useAppStore';

// Simple test component to demonstrate undo/redo
const TestUndoRedoComponent = () => {
  const { undo, redo, canUndo, canRedo } = useUndoRedo();
  const { addPanel, panels } = useAppStore();

  return (
    <div>
      <button onClick={addPanel} data-testid="add-panel">
        Add Panel
      </button>
      <button onClick={undo} disabled={!canUndo} data-testid="undo">
        Undo
      </button>
      <button onClick={redo} disabled={!canRedo} data-testid="redo">
        Redo
      </button>
      <span data-testid="panel-count">{panels.length}</span>
      <span data-testid="can-undo">{canUndo.toString()}</span>
      <span data-testid="can-redo">{canRedo.toString()}</span>
    </div>
  );
};

// Test component for dancer state changes
const TestDancerUndoComponent = () => {
  const { undo, redo, canUndo, canRedo } = useUndoRedo();
  const { updateDancerState, panels } = useAppStore();

  const moveDancer = () => {
    if (panels.length > 0 && panels[0].dancers.length > 0) {
      const panel = panels[0];
      const dancer = panel.dancers[0];
      updateDancerState(panel.id, dancer.id, { x: dancer.x + 50 });
    }
  };

  const dancerX =
    panels.length > 0 && panels[0].dancers.length > 0
      ? panels[0].dancers[0].x
      : 0;

  return (
    <div>
      <button onClick={moveDancer} data-testid="move-dancer">
        Move Dancer
      </button>
      <button onClick={undo} disabled={!canUndo} data-testid="undo">
        Undo
      </button>
      <button onClick={redo} disabled={!canRedo} data-testid="redo">
        Redo
      </button>
      <span data-testid="dancer-x">{dancerX}</span>
      <span data-testid="can-undo">{canUndo.toString()}</span>
      <span data-testid="can-redo">{canRedo.toString()}</span>
    </div>
  );
};

describe('Undo/Redo functionality', () => {
  it('should undo and redo panel additions', async () => {
    render(<TestUndoRedoComponent />);

    // Get initial panel count
    const initialCount = parseInt(
      screen.getByTestId('panel-count').textContent,
    );

    // Add a panel
    fireEvent.click(screen.getByTestId('add-panel'));

    // Wait for state updates
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should have one more panel and be able to undo
    expect(screen.getByTestId('panel-count')).toHaveTextContent(
      (initialCount + 1).toString(),
    );
    expect(screen.getByTestId('can-undo')).toHaveTextContent('true');

    // Undo the action
    fireEvent.click(screen.getByTestId('undo'));

    // Wait for state updates
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should be back to original count and be able to redo
    expect(screen.getByTestId('panel-count')).toHaveTextContent(
      initialCount.toString(),
    );
    expect(screen.getByTestId('can-redo')).toHaveTextContent('true');

    // Redo the action
    fireEvent.click(screen.getByTestId('redo'));

    // Wait for state updates
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should have added panel again
    expect(screen.getByTestId('panel-count')).toHaveTextContent(
      (initialCount + 1).toString(),
    );
  });

  it('should undo and redo dancer movements', async () => {
    render(<TestDancerUndoComponent />);

    // Get initial dancer position
    const initialX = parseInt(screen.getByTestId('dancer-x').textContent);

    // Move dancer
    fireEvent.click(screen.getByTestId('move-dancer'));

    // Wait for state updates
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should have moved and be able to undo
    expect(parseInt(screen.getByTestId('dancer-x').textContent)).toBe(
      initialX + 50,
    );
    expect(screen.getByTestId('can-undo')).toHaveTextContent('true');

    // Undo the movement
    fireEvent.click(screen.getByTestId('undo'));

    // Wait for state updates
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should be back to original position
    expect(parseInt(screen.getByTestId('dancer-x').textContent)).toBe(initialX);
    expect(screen.getByTestId('can-redo')).toHaveTextContent('true');

    // Redo the movement
    fireEvent.click(screen.getByTestId('redo'));

    // Wait for state updates
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should be moved again
    expect(parseInt(screen.getByTestId('dancer-x').textContent)).toBe(
      initialX + 50,
    );
  });

  it('should handle dragging operations as single undo states', async () => {
    // This test verifies that dragging creates only one undo state per drag operation
    const TestDragOperation = () => {
      const { updateDancerState, panels } = useAppStore();
      const { undoCount, startDragOperation, endDragOperation } = useUndoRedo();

      const simulateDrag = () => {
        if (panels.length > 0 && panels[0].dancers.length > 0) {
          const panel = panels[0];
          const dancer = panel.dancers[0];
          const baseX = dancer.x;

          // Simulate drag start
          startDragOperation('dancer');

          // Make multiple changes during drag (simulating mouse movements)
          for (let i = 1; i <= 5; i++) {
            updateDancerState(panel.id, dancer.id, { x: baseX + i * 10 });
          }

          // Simulate drag end
          endDragOperation();
        }
      };

      return (
        <div>
          <button onClick={simulateDrag} data-testid="simulate-drag">
            Simulate Drag
          </button>
          <span data-testid="undo-count">{undoCount}</span>
        </div>
      );
    };

    render(<TestDragOperation />);

    const initialUndoCount = parseInt(
      screen.getByTestId('undo-count').textContent,
    );

    // Simulate a complete drag operation
    fireEvent.click(screen.getByTestId('simulate-drag'));

    // Wait for state updates
    await new Promise((resolve) => setTimeout(resolve, 100));

    const finalUndoCount = parseInt(
      screen.getByTestId('undo-count').textContent,
    );
    const undoStatesAdded = finalUndoCount - initialUndoCount;

    // Should have added exactly one undo state for the entire drag operation
    expect(undoStatesAdded).toBe(1);
  });

  it('should handle undo during drag operations', async () => {
    // This test verifies that undo during drag ends the drag and performs undo
    const TestUndoDuringDrag = () => {
      const { updateDancerState, panels } = useAppStore();
      const { undoCount, startDragOperation, undo, isDragging } = useUndoRedo();

      const startDragAndUndo = () => {
        if (panels.length > 0 && panels[0].dancers.length > 0) {
          const panel = panels[0];
          const dancer = panel.dancers[0];

          // Start drag
          startDragOperation('dancer');

          // Make some changes during drag
          updateDancerState(panel.id, dancer.id, { x: dancer.x + 50 });

          // Undo while dragging
          undo();
        }
      };

      return (
        <div>
          <button onClick={startDragAndUndo} data-testid="drag-and-undo">
            Start Drag and Undo
          </button>
          <span data-testid="is-dragging">{isDragging.toString()}</span>
          <span data-testid="undo-count">{undoCount}</span>
        </div>
      );
    };

    render(<TestUndoDuringDrag />);

    // Trigger drag and undo
    fireEvent.click(screen.getByTestId('drag-and-undo'));

    // Wait for state updates
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should not be dragging anymore after undo
    expect(screen.getByTestId('is-dragging')).toHaveTextContent('false');
  });

  it('should allow live updates during drag while preventing undo state saves', async () => {
    // This test verifies that state updates happen during drag (for visual feedback)
    // but don't get saved to undo history until drag ends
    const TestLiveDragUpdates = () => {
      const { updateDancerState, panels } = useAppStore();
      const { undoCount, startDragOperation, endDragOperation } = useUndoRedo();

      const simulateLiveDrag = () => {
        if (panels.length > 0 && panels[0].dancers.length > 0) {
          const panel = panels[0];
          const dancer = panel.dancers[0];
          const baseX = dancer.x;

          // Start drag
          startDragOperation('dancer');

          // Make intermediate updates (these should update the UI but not create undo states)
          updateDancerState(panel.id, dancer.id, { x: baseX + 25 });
          updateDancerState(panel.id, dancer.id, { x: baseX + 50 });

          // End drag
          endDragOperation();
        }
      };

      const dancerX =
        panels.length > 0 && panels[0].dancers.length > 0
          ? panels[0].dancers[0].x
          : 0;

      return (
        <div>
          <button onClick={simulateLiveDrag} data-testid="live-drag">
            Simulate Live Drag
          </button>
          <span data-testid="dancer-x">{dancerX}</span>
          <span data-testid="undo-count">{undoCount}</span>
        </div>
      );
    };

    render(<TestLiveDragUpdates />);

    const initialX = parseInt(screen.getByTestId('dancer-x').textContent);
    const initialUndoCount = parseInt(
      screen.getByTestId('undo-count').textContent,
    );

    // Simulate live drag
    fireEvent.click(screen.getByTestId('live-drag'));

    // Wait for state updates
    await new Promise((resolve) => setTimeout(resolve, 100));

    const finalX = parseInt(screen.getByTestId('dancer-x').textContent);
    const finalUndoCount = parseInt(
      screen.getByTestId('undo-count').textContent,
    );

    // Dancer position should have updated (live feedback worked)
    expect(finalX).toBe(initialX + 50);

    // Should have added exactly one undo state despite multiple intermediate updates
    expect(finalUndoCount - initialUndoCount).toBe(1);
  });
});
