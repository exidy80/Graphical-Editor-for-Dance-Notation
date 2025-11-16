# Keystroke Framework - Keyboard Shortcuts

## Overview

The application now includes a flexible, extensible keystroke framework that provides context-aware keyboard shortcuts for efficient editing.

## Available Shortcuts

### Symbol (Shape) Context

_These shortcuts work when a symbol/shape is selected_

| Key                | Action                          |
| ------------------ | ------------------------------- |
| ← →                | Rotate symbol left/right by 45° |
| Shift + ← →        | Fine rotate left/right by 5°    |
| Delete / Backspace | Delete selected symbol          |
| R                  | Reset rotation to 0°            |

### Dancer Context

_These shortcuts work when a dancer is selected_

| Key         | Action                          |
| ----------- | ------------------------------- |
| ← →         | Rotate dancer left/right by 45° |
| Shift + ← → | Fine rotate left/right by 5°    |
| R           | Reset rotation to 0°            |

### Global Context

_These shortcuts work regardless of what's selected_

| Key            | Action                                    |
| -------------- | ----------------------------------------- |
| Escape         | Deselect all objects                      |
| Spacebar       | Toggle rotation center maintenance on/off |
| Cmd+Z / Ctrl+Z | Undo last action                          |
| Cmd+Y / Ctrl+Y | Redo last undone action                   |

## Framework Features

### Context Awareness

- Keystrokes only execute in the appropriate context
- No accidental deletions of dancers (must always have exactly 2)
- Same keys can have different behaviors for different object types

### Extensibility

- Easy to add new keyboard shortcuts at runtime
- Priority system for handling conflicts
- Modifier key support (Shift, Ctrl/Cmd, Alt)

### Safety

- Dancers cannot be deleted (maintaining the rule of exactly 2 dancers)
- Symbols can be safely deleted when selected
- No action when shortcuts are pressed with wrong selections

### Undo/Redo System

The application includes a comprehensive undo/redo system that tracks:

**Undoable Actions:**

- Adding/removing symbols
- Moving dancers and symbols (start/end positions)
- Rotating dancers and symbols
- Scaling dancers and symbols
- Hand position changes
- Adding/removing panels

**Smart Batching:**

- Drag operations are automatically grouped so only start/end positions are saved
- Rapid changes are batched to prevent history pollution
- Up to 50 undo states are maintained for performance

**Non-Undoable Actions:**

- UI state changes (selections, opacity, view settings)
- Per-pixel drag movements (only final position is saved)
- Head and hand shape changes (cosmetic changes)

Use **Cmd+Z** (Mac) or **Ctrl+Z** (Windows/Linux) to undo, and **Cmd+Y** or **Ctrl+Y** to redo.

## Technical Implementation

The framework uses:

- **Context detection**: Determines what type of object is selected
- **Priority system**: Higher priority handlers override lower ones
- **Modifier support**: Shift, Ctrl/Cmd, Alt combinations
- **Help system**: Built-in documentation of all registered shortcuts
- **Conflict detection**: Identifies and reports keystroke conflicts

This demonstrates the flexibility and extensibility of the keystroke framework architecture!
