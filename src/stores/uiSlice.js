// UI state slice - handles selection state, opacity, visual effects, and other UI concerns
const createUISlice = (set, get) => ({
  // State (some initial state set in index.js)
  handFlash: [], // transient effects for visual feedback on hands

  // Hand-locking UI state (group selection)
  lockUi: { active: false, selected: [] },

  opacity: {
    dancers: { value: 1, disabled: false },
    symbols: { value: 1, disabled: false },
  },

  // Auto-save state (handled by middleware, some initial state set in index.js)
  _autoSaveTimer: null,

  // Actions
  setSelectedPanel: (selectedPanel) => set({ selectedPanel }),
  setSelectedHand: (selectedHand) => set({ selectedHand }),
  setSelectedDancer: (selectedDancer) => set({ selectedDancer }),
  setSelectedShapeId: (selectedShapeId) => set({ selectedShapeId }),

  setOpacity: (updater) =>
    set((state) => ({
      opacity: typeof updater === 'function' ? updater(state.opacity) : updater,
    })),

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
      selectedPanel: null,
      selectedDancer: null,
      selectedHand: null,
      selectedShapeId: null,
    });
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
});

export default createUISlice;
