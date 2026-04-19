// Keystroke management slice - handles keyboard shortcuts and key bindings

import { createKeystrokeActions } from './keystrokes/actions.js';
import { initializeDefaultKeystrokes } from './keystrokes/defaults.js';
import {
  createKeystrokeKey,
  formatKeystrokeDisplay,
} from './keystrokes/keys.js';

const createKeystrokeSlice = (set, get, api) => ({
  // State
  keystrokes: {},

  ...createKeystrokeActions(get),

  // Core keystroke management
  registerKeystroke: (key, config) => {
    const {
      description,
      handler,
      context,
      modifiers = {},
      priority = 0,
    } = config;

    // Validate required fields
    if (!description || typeof handler !== 'function' || !context) {
      throw new Error(
        'Keystroke registration requires description, handler function, and context',
      );
    }

    // Create unique key including modifiers AND context
    const keystrokeKey = createKeystrokeKey(key, modifiers, context);

    set((state) => ({
      keystrokes: {
        ...state.keystrokes,
        [keystrokeKey]: {
          originalKey: key,
          description,
          handler,
          context,
          modifiers,
          priority,
        },
      },
    }));
  },

  unregisterKeystroke: (key, modifiers = {}, context = null) => {
    if (context) {
      const keystrokeKey = createKeystrokeKey(key, modifiers, context);
      set((state) => {
        const { [keystrokeKey]: removed, ...remainingKeystrokes } =
          state.keystrokes;
        return { keystrokes: remainingKeystrokes };
      });
    } else {
      // Remove all registrations for this key+modifiers across all contexts
      set((state) => {
        const remainingKeystrokes = {};
        const targetKeyBase = createKeystrokeKey(key, modifiers);
        Object.entries(state.keystrokes).forEach(([k, config]) => {
          if (!k.startsWith(targetKeyBase + ':')) {
            remainingKeystrokes[k] = config;
          }
        });
        return { keystrokes: remainingKeystrokes };
      });
    }
  },

  getRegisteredKeystrokes: () => {
    return get().keystrokes;
  },

  clearAllKeystrokes: () => {
    set({ keystrokes: {} });
  },

  // Context detection
  getCurrentKeystrokeContext: () => {
    const { selectedItems, selectedHand } = get();
    if (selectedHand) return 'hand';
    return selectedItems[0]?.type ?? 'none';
  },

  // Keystroke execution
  handleKeystroke: (key, event) => {
    if (!key || !event) return;

    const { keystrokes } = get();
    const currentContext = get().getCurrentKeystrokeContext();

    // Create keystroke key with modifiers
    const modifiers = {
      ctrl: event.ctrlKey || event.metaKey, // Support both Ctrl and Cmd
      shift: event.shiftKey,
      alt: event.altKey,
    };

    // Look for context-specific handler first, then global handler
    const contextKey = createKeystrokeKey(key, modifiers, currentContext);
    const globalKey = createKeystrokeKey(key, modifiers, 'global');

    // Find matching keystrokes
    const matchingKeystrokes = Object.entries(keystrokes)
      .filter(([k, config]) => {
        return k === contextKey || k === globalKey;
      })
      .map(([k, config]) => config)
      .sort((a, b) => b.priority - a.priority); // Sort by priority (highest first)

    // Execute the highest priority handler
    if (matchingKeystrokes.length > 0) {
      const handler = matchingKeystrokes[0];
      try {
        handler.handler(event, currentContext);
        // Prevent default browser behavior for handled keystrokes
        if (event.preventDefault) {
          event.preventDefault();
        }
      } catch (error) {
        console.warn('Error executing keystroke handler:', error);
      }
    }
  },

  // Configuration
  rotationStep: 45, // Default rotation step in degrees
  fineRotationStep: 5, // Fine rotation step with modifier keys

  setRotationStep: (step) => {
    set({ rotationStep: step });
  },

  setFineRotationStep: (step) => {
    set({ fineRotationStep: step });
  },

  initializeDefaultKeystrokes: () => {
    initializeDefaultKeystrokes(get, api, set);
  },

  // Help and documentation
  getKeystrokeHelp: () => {
    const { keystrokes } = get();
    return Object.entries(keystrokes)
      .map(([key, config]) => ({
        key: formatKeystrokeDisplay(config.originalKey, config.modifiers),
        description: config.description,
        context: config.context,
        priority: config.priority,
      }))
      .sort(
        (a, b) => a.context.localeCompare(b.context) || b.priority - a.priority,
      );
  },

  // Conflict detection
  detectKeystrokeConflicts: () => {
    const { keystrokes } = get();
    const conflicts = [];
    const contextGroups = {};

    // Group keystrokes by context and key combination
    Object.entries(keystrokes).forEach(([key, config]) => {
      const groupKey = `${config.context}:${config.originalKey}`;
      if (!contextGroups[groupKey]) {
        contextGroups[groupKey] = [];
      }
      contextGroups[groupKey].push({ key, config });
    });

    // Find conflicts (multiple handlers for same key+context)
    Object.entries(contextGroups).forEach(([groupKey, handlers]) => {
      if (handlers.length > 1) {
        const [context, originalKey] = groupKey.split(':');
        conflicts.push({
          key: originalKey,
          context,
          handlers: handlers.map((h) => h.config),
        });
      }
    });

    return conflicts;
  },
});

export default createKeystrokeSlice;
