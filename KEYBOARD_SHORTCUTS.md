# Keystroke Framework - Keyboard Shortcuts

## Overview
The application now includes a flexible, extensible keystroke framework that provides context-aware keyboard shortcuts for efficient editing.

## Available Shortcuts

### Symbol (Shape) Context
*These shortcuts work when a symbol/shape is selected*

| Key | Action |
|-----|--------|
| ← → | Rotate symbol left/right by 15° |
| Shift + ← → | Fine rotate left/right by 1° |
| Delete / Backspace | Delete selected symbol |
| R | Reset rotation to 0° |

### Dancer Context  
*These shortcuts work when a dancer is selected*

| Key | Action |
|-----|--------|
| ← → | Rotate dancer left/right by 15° |
| Shift + ← → | Fine rotate left/right by 1° |
| R | Reset rotation to 0° |

### Global Context
*These shortcuts work regardless of what's selected*

| Key | Action |
|-----|--------|
| Escape | Deselect all objects |
| Spacebar | Toggle rotation center maintenance on/off |

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

## Technical Implementation

The framework uses:
- **Context detection**: Determines what type of object is selected
- **Priority system**: Higher priority handlers override lower ones
- **Modifier support**: Shift, Ctrl/Cmd, Alt combinations
- **Help system**: Built-in documentation of all registered shortcuts
- **Conflict detection**: Identifies and reports keystroke conflicts

This demonstrates the flexibility and extensibility of the keystroke framework architecture!