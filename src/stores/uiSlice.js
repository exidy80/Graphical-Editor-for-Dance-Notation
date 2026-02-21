// UI state slice - handles selection state, opacity, visual effects, and other UI concerns
import { UI_DIMENSIONS } from '../utils/dimensions.js';
import { LAYER_KEYS } from '../utils/layersConfig.js';

const CANVAS_SIZE_INCREMENT = 0.2;
const MIN_CANVAS_SIZE = 1.0;
const MAX_CANVAS_SIZE = 4.0;

const createUISlice = (set, get) => ({
  // State (some initial state set in index.js)
  handFlash: [], // transient effects for visual feedback on hands
  symbolFlash: [], // transient effects for visual feedback on symbols
  dancerFlash: [], // transient effects for visual feedback on dancers
  magnifyEnabled: false,
  contextMenu: { open: false, x: 0, y: 0, target: null, openedAt: 0 },
  // Generalized flash for symbols
  queueSymbolFlash: (panelId, symbolId, duration = 500) => {
    const entry = { panelId, symbolId };
    set((state) => ({ symbolFlash: [...state.symbolFlash, entry] }));

    setTimeout(() => {
      set((state) => ({
        symbolFlash: state.symbolFlash.filter(
          (f) => !(f.panelId === panelId && f.symbolId === symbolId),
        ),
      }));
    }, duration);
  },

  // Generalized flash for dancers
  queueDancerFlash: (panelId, dancerId, duration = 500) => {
    const entry = { panelId, dancerId };
    set((state) => ({ dancerFlash: [...state.dancerFlash, entry] }));

    setTimeout(() => {
      set((state) => ({
        dancerFlash: state.dancerFlash.filter(
          (f) => !(f.panelId === panelId && f.dancerId === dancerId),
        ),
      }));
    }, duration);
  },

  // Hand-locking UI state (group selection)
  lockUi: { active: false, selected: [] },

  // Layer order
  layerOrder: LAYER_KEYS,
  setLayerOrder: (updater) =>
    set((state) => ({
      layerOrder:
        typeof updater === 'function' ? updater(state.layerOrder) : updater,
    })),

  // Document state (for file handling)
  documentTitle: 'Untitled Dance',
  currentFileHandle: null,

  // Auto-save state (handled by middleware, some initial state set in index.js)
  _autoSaveTimer: null,

  // Actions
  setSelectedPanel: (selectedPanel) => set({ selectedPanel }),
  setSelectedHand: (selectedHand) => set({ selectedHand }),

  // Unified selection management
  setSelectedItems: (selectedItems) => set({ selectedItems }),

  // Helper to add/toggle item in selection
  toggleItemSelection: (type, panelId, id) => {
    set((state) => {
      const existingIndex = state.selectedItems.findIndex(
        (item) => item.id === id,
      );
      if (existingIndex >= 0) {
        return {
          selectedItems: state.selectedItems.filter(
            (_, idx) => idx !== existingIndex,
          ),
        };
      } else {
        return {
          selectedItems: [...state.selectedItems, { type, panelId, id }],
        };
      }
    });
  },

  // Clear selection
  clearSelection: () => set({ selectedItems: [] }),

  setOpacity: (updater) =>
    set((state) => ({
      opacity: typeof updater === 'function' ? updater(state.opacity) : updater,
    })),

  openContextMenu: ({ x, y, target }) =>
    set({ contextMenu: { open: true, x, y, target, openedAt: Date.now() } }),

  closeContextMenu: () =>
    set({
      contextMenu: { open: false, x: 0, y: 0, target: null, openedAt: 0 },
    }),

  toggleMagnify: () => {
    const { magnifyEnabled } = get();
    set({ magnifyEnabled: !magnifyEnabled });
  },

  queueHandFlash: (panelId, members, duration = 500) => {
    const entries = members.map((m) => ({
      panelId,
      dancerId: m.dancerId,
      side: m.side,
    }));
    set((state) => ({ handFlash: [...state.handFlash, ...entries] }));

    // schedule removal
    setTimeout(() => {
      set((state) => ({
        handFlash: state.handFlash.filter(
          (h) =>
            !entries.some(
              (e) =>
                e.panelId === h.panelId &&
                e.dancerId === h.dancerId &&
                e.side === h.side,
            ),
        ),
      }));
    }, duration);
  },

  setLockModeActive: (active) =>
    set((state) => ({
      lockUi: { active, selected: active ? state.lockUi.selected : [] },
    })),

  clearLockSelection: () =>
    set((state) => ({ lockUi: { ...state.lockUi, selected: [] } })),

  handleCanvasClick: () => {
    set({
      selectedItems: [],
      selectedHand: null,
    });
  },

  addToDisableList: (list) => {
    set((state) => ({
      opacity: {
        ...state.opacity,
        disabled: [...state.opacity.disabled, ...list],
      },
    }));
  },

  removeFromDisableList: (list) => {
    const removeSet = new Set(list);
    set((state) => ({
      opacity: {
        ...state.opacity,
        disabled: state.opacity.disabled.filter((item) => !removeSet.has(item)),
      },
    }));
  },

  addToHideList: (list) => {
    set((state) => ({
      hideList: [...new Set([...state.hideList, ...list])],
    }));
  },

  removeFromHideList: (list) => {
    const removeSet = new Set(list);
    set((state) => ({
      hideList: state.hideList.filter((item) => !removeSet.has(item)),
    }));
  },

  handleOpacityChange: (type) => {
    set((state) => ({
      opacity: {
        ...state.opacity,
        [type]: {
          value: state.opacity[type].value === 1 ? 0.5 : 1,
          disabled: state.opacity[type].value === 1,
        },
      },
    }));
  },

  handleHandClick: (panelId, dancerId, handSide) => {
    const { selectedHand: prevHand, lockUi } = get();
    set({ selectedPanel: panelId });

    // Lock mode: toggle hand membership in group selection (same panel only)
    if (lockUi.active) {
      set((state) => {
        if (state.selectedPanel !== panelId) {
          return state; // enforce same panel
        }
        const key = `${dancerId}:${handSide}`;
        const exists = state.lockUi.selected.some(
          (m) => `${m.dancerId}:${m.side}` === key,
        );
        return {
          lockUi: {
            ...state.lockUi,
            selected: exists
              ? state.lockUi.selected.filter(
                  (m) => `${m.dancerId}:${m.side}` !== key,
                )
              : [...state.lockUi.selected, { dancerId, side: handSide }],
          },
          selectedHand: { panelId, dancerId, handSide },
        };
      });
      return;
    }

    // Normal selection toggle
    if (
      prevHand &&
      prevHand.panelId === panelId &&
      prevHand.dancerId === dancerId &&
      prevHand.handSide === handSide
    ) {
      set({ selectedHand: null });
    } else {
      set({ selectedHand: { panelId, dancerId, handSide } });
    }
  },

  clearAutoSave: () => {
    const { clearAutoSaveData } = require('./autoSaveMiddleware.js');
    clearAutoSaveData();
    set({ hasUnsavedChanges: false, lastSaveTime: Date.now() });
  },

  // Document title and file handle management
  setDocumentTitle: (title) =>
    set({ documentTitle: title || 'Untitled Dance' }),

  setCurrentFileHandle: (handle) => set({ currentFileHandle: handle }),

  getDocumentFileName: () => {
    const state = get();
    // Sanitize title for filename - remove invalid characters
    const sanitized = state.documentTitle.replace(/[<>:"/\\|?*]/g, '-');
    return sanitized || 'Untitled Dance';
  },

  // File operation triggers (for keyboard shortcuts)
  triggerSave: null,
  triggerSaveAs: null,
  triggerOpen: null,

  setFileOperationTriggers: (triggers) => {
    set({
      triggerSave: triggers.save,
      triggerSaveAs: triggers.saveAs,
      triggerOpen: triggers.open,
    });
  },

  // Global canvas size functions
  // Canvas size is a viewport into fixed 600x600 canvas - positions don't change
  increaseCanvasSize: () => {
    const state = get();
    const oldSize = state.globalCanvasSize;
    const newSize = Math.min(MAX_CANVAS_SIZE, oldSize + CANVAS_SIZE_INCREMENT);
    if (oldSize === newSize) return; // Already at max
    set({
      globalCanvasSize: newSize,
      panelSize: {
        width: Math.round(UI_DIMENSIONS.DEFAULT_PANEL_SIZE.width * newSize),
        height: Math.round(UI_DIMENSIONS.DEFAULT_PANEL_SIZE.height * newSize),
      },
    });
  },

  decreaseCanvasSize: () => {
    const state = get();
    const oldSize = state.globalCanvasSize;
    const newSize = Math.max(MIN_CANVAS_SIZE, oldSize - CANVAS_SIZE_INCREMENT);
    if (oldSize === newSize) return; // Already at min
    set({
      globalCanvasSize: newSize,
      panelSize: {
        width: Math.round(UI_DIMENSIONS.DEFAULT_PANEL_SIZE.width * newSize),
        height: Math.round(UI_DIMENSIONS.DEFAULT_PANEL_SIZE.height * newSize),
      },
    });
  },

  resetCanvasSize: () => {
    set({
      globalCanvasSize: MIN_CANVAS_SIZE,
      panelSize: UI_DIMENSIONS.DEFAULT_PANEL_SIZE,
    });
  },

  canIncreaseCanvasSize: () => {
    const state = get();
    return state.globalCanvasSize < MAX_CANVAS_SIZE;
  },

  canDecreaseCanvasSize: () => {
    const state = get();
    return state.globalCanvasSize > MIN_CANVAS_SIZE;
  },
});

export default createUISlice;
