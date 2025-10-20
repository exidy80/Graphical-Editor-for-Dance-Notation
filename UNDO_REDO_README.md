# Undo/Redo Functionality

This document explains the drag-aware undo/redo functionality that has been added to the Dance Notation Editor.

## How It Works

The undo/redo system is implemented using Zustand with a custom temporal store that intelligently tracks state changes and treats drag operations as single undoable actions, providing an intuitive user experience.

## Features

### Drag-Aware State Tracking

- **Smart drag detection**: Complete drag operations (from drag start to drag end) are treated as single undoable actions
- **No intermediate states**: During dragging, intermediate position changes don't create undo states
- **Multiple drag types supported**:
  - Dancer movement (position, rotation, scale)
  - Hand position adjustments
  - Elbow position adjustments
  - Shape/symbol movement
- **Robust handling**: Undo during active drags automatically ends the drag operation
- **History management**: Maintains up to 50 previous states
- **Non-drag operations**: Instant actions like adding/removing panels, changing properties, etc. still create immediate undo states

### User Interface

- **Undo Button**: Located in the toolbar, allows undoing the last action
- **Redo Button**: Located in the toolbar, allows redoing a previously undone action
- Buttons are automatically enabled/disabled based on availability of undo/redo actions

### Keyboard Shortcuts

- **Undo**: `Cmd+Z` (Mac) or `Ctrl+Z` (Windows/Linux)
- **Redo**: `Cmd+Shift+Z` or `Cmd+Y` (Mac) or `Ctrl+Shift+Z` or `Ctrl+Y` (Windows/Linux)

## Implementation Details

### Files Modified/Added

1. **useAppStore.js**: Modified to use `subscribeWithSelector` middleware for state change tracking
2. **useTemporalStore.js**: New custom temporal store that manages undo/redo history
3. **useUndoRedo.js**: Hook that provides easy access to undo/redo functionality
4. **useKeyboardShortcuts.js**: Hook that handles keyboard shortcuts for undo/redo
5. **Toolbar.js**: Updated to include undo/redo buttons
6. **App.js**: Updated to enable keyboard shortcuts

### Technical Architecture

The system uses a separate temporal store (`useTemporalStore`) that:

- **Drag state tracking**: Maintains `dragState` with `isDragging`, `dragType`, and `preInteractionState`
- **Smart state saving**: Only saves states when not actively dragging
- **Drag boundary detection**: `startDragOperation()` and `endDragOperation()` mark drag boundaries
- **Pre-interaction state**: Captures state before drag starts, saves it when drag ends
- **Undo/redo safety**: Automatically ends active drags before performing undo/redo operations
- **Subscription filtering**: State changes during drags are ignored by the temporal store

## Usage Examples

### Programmatic Usage

```javascript
import { useUndoRedo } from './components/useUndoRedo';

function MyComponent() {
  const { undo, redo, canUndo, canRedo, clear } = useUndoRedo();

  return (
    <div>
      <button onClick={undo} disabled={!canUndo}>
        Undo
      </button>
      <button onClick={redo} disabled={!canRedo}>
        Redo
      </button>
      <button onClick={clear}>Clear History</button>
    </div>
  );
}
```

### State Information

```javascript
import { useUndoRedo } from './components/useUndoRedo';

function StatusComponent() {
  const { undoCount, redoCount } = useUndoRedo();

  return (
    <div>
      <span>Can undo {undoCount} actions</span>
      <span>Can redo {redoCount} actions</span>
    </div>
  );
}
```

## Performance Considerations

- History is limited to 50 states to prevent excessive memory usage
- State comparison is done by reference, so only actual changes trigger history saves
- Undo/redo operations are optimized to avoid triggering additional state saves

## Limitations

- History is lost when the page is refreshed (not persisted)
- Very large state changes might impact performance
- Some transient UI states (like selections) might not be perfectly restored

## Future Enhancements

Potential improvements could include:

- Persisting undo history to localStorage
- Selective undo (only undo specific types of changes)
- History visualization showing what each state change was
- Grouping related changes into single undo operations
