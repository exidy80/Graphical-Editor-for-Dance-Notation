import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

// Auto-save utility functions
const AUTO_SAVE_KEY = 'dance-notation-autosave';

// Define which state properties are consequential (require saving)
const CONSEQUENTIAL_PROPERTIES = new Set(['panels', 'panelSize']);

// Define which state properties are non-consequential (UI state only)
// (Currently unused but kept for future reference)
// const NON_CONSEQUENTIAL_PROPERTIES = new Set([
//   'selectedPanel',
//   'selectedHand',
//   'selectedDancer',
//   'selectedShapeId',
//   'handFlash',
//   'lockUi',
//   'opacity',
//   'hasUnsavedChanges',
//   'lastSaveTime',
//   '_autoSaveTimer'
// ]);

// Auto-save middleware that detects consequential changes
const autoSaveMiddleware = (config) => (set, get, api) => {
  let isInternalUpdate = false;

  const originalSet = set;
  const wrappedSet = (partial, replace) => {
    if (isInternalUpdate) {
      return originalSet(partial, replace);
    }

    const prevState = get();
    const result = originalSet(partial, replace);
    const newState = get();

    // Check if any consequential properties changed
    const hasConsequentialChanges =
      (CONSEQUENTIAL_PROPERTIES.has('panels') &&
        JSON.stringify(prevState.panels) !== JSON.stringify(newState.panels)) ||
      (CONSEQUENTIAL_PROPERTIES.has('panelSize') &&
        JSON.stringify(prevState.panelSize) !==
          JSON.stringify(newState.panelSize));

    if (hasConsequentialChanges && !newState.hasUnsavedChanges) {
      // Use internal update to avoid infinite recursion
      isInternalUpdate = true;
      originalSet({ hasUnsavedChanges: true });

      // Schedule auto-save
      if (newState._autoSaveTimer) {
        clearTimeout(newState._autoSaveTimer);
      }
      const timer = setTimeout(() => {
        const currentState = get();
        if (currentState.hasUnsavedChanges) {
          const saveData = {
            panels: currentState.panels,
            panelSize: currentState.panelSize,
          };
          saveToLocalStorage(saveData);
          isInternalUpdate = true;
          originalSet({ hasUnsavedChanges: false, lastSaveTime: Date.now() });
          isInternalUpdate = false;
          console.log('Auto-saved to localStorage');
        }
      }, 2000);

      originalSet({ _autoSaveTimer: timer });
      isInternalUpdate = false;
    }

    return result;
  };

  return config(wrappedSet, get, api);
};

const saveToLocalStorage = (data) => {
  try {
    const saveData = {
      timestamp: Date.now(),
      data: data,
    };
    localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(saveData));
  } catch (error) {
    console.warn('Failed to auto-save to localStorage:', error);
  }
};

const loadFromLocalStorage = () => {
  try {
    const saved = localStorage.getItem(AUTO_SAVE_KEY);
    if (saved) {
      const { timestamp, data } = JSON.parse(saved);
      // Only restore if saved within last 24 hours
      if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
        return data;
      }
    }
  } catch (error) {
    console.warn('Failed to load auto-save from localStorage:', error);
  }
  return null;
};

const clearAutoSave = () => {
  try {
    localStorage.removeItem(AUTO_SAVE_KEY);
  } catch (error) {
    console.warn('Failed to clear auto-save:', error);
  }
};

// Creates the initial panel with default dancer positions and shapes
const createInitialPanel = () => ({
  id: uuidv4(),
  dancers: [
    {
      id: uuidv4(),
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
      id: uuidv4(),
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
  headShapes: ['Upright', 'Upright'],
  handShapes: [
    { left: 'Waist', right: 'Waist' },
    { left: 'Waist', right: 'Waist' },
  ],
  shapes: [
    {
      id: uuidv4(),
      type: 'stageX',
      x: 147,
      y: 127,
      width: 20,
      height: 20,
      draggable: true,
      text: 'O',
      fontSize: 20,
      fill: 'black',
    },
  ],
  locks: [],
});

// Create initial store with auto-save functionality
const initialState = () => {
  // Try to restore from auto-save first
  const savedData = loadFromLocalStorage();

  if (
    savedData &&
    savedData.panels &&
    Array.isArray(savedData.panels) &&
    savedData.panels.length > 0
  ) {
    console.log('Restoring from auto-save...');
    return {
      panelSize: savedData.panelSize || { width: 300, height: 300 },
      selectedPanel: null, // Reset UI state
      selectedHand: null,
      selectedDancer: null,
      selectedShapeId: null,
      panels: savedData.panels,
      hasUnsavedChanges: false,
      lastSaveTime: Date.now(),
    };
  }

  // Default initial state
  return {
    panelSize: { width: 300, height: 300 },
    selectedPanel: null,
    selectedHand: null,
    selectedDancer: null,
    selectedShapeId: null,
    panels: [createInitialPanel()],
    hasUnsavedChanges: false,
    lastSaveTime: Date.now(),
  };
};

export const useAppStore = create(
  autoSaveMiddleware((set, get) => ({
    // Utility: coordinate transforms
    _localToAbsolute: (dancer, point) => {
      const rotationDeg = dancer.rotation || 0;
      const r = (rotationDeg * Math.PI) / 180;
      const cos = Math.cos(r);
      const sin = Math.sin(r);
      const sx = dancer.scaleX || 1;
      const sy = dancer.scaleY || 1;
      const lx = (point?.x || 0) * sx;
      const ly = (point?.y || 0) * sy;
      const rx = lx * cos - ly * sin;
      const ry = lx * sin + ly * cos;
      return { x: (dancer.x || 0) + rx, y: (dancer.y || 0) + ry };
    },
    _absoluteToLocal: (dancer, absPoint) => {
      const dx = (absPoint?.x || 0) - (dancer.x || 0);
      const dy = (absPoint?.y || 0) - (dancer.y || 0);
      const rotationDeg = dancer.rotation || 0;
      const r = (rotationDeg * Math.PI) / 180;
      const cos = Math.cos(-r);
      const sin = Math.sin(-r);
      const rx = dx * cos - dy * sin;
      const ry = dx * sin + dy * cos;
      const sx = dancer.scaleX || 1;
      const sy = dancer.scaleY || 1;
      return { x: rx / sx, y: ry / sy };
    },

    // Initialize state with auto-save recovery
    ...initialState(),
    handFlash: [], // transient effects for visual feedback on hands
    // Hand-locking UI state (group selection)
    lockUi: { active: false, selected: [] },
    opacity: {
      dancers: { value: 1, disabled: false },
      symbols: { value: 1, disabled: false },
    },

    // Auto-save functionality (handled by middleware)
    _autoSaveTimer: null,

    clearAutoSave: () => {
      clearAutoSave();
      set({ hasUnsavedChanges: false, lastSaveTime: Date.now() });
    },

    // Basic setters (only those needed externally)
    setPanels: (panels) => set({ panels }),
    setSelectedPanel: (selectedPanel) => set({ selectedPanel }),
    setSelectedHand: (selectedHand) => set({ selectedHand }),
    setSelectedDancer: (selectedDancer) => set({ selectedDancer }),
    setSelectedShapeId: (selectedShapeId) => set({ selectedShapeId }),
    setOpacity: (updater) =>
      set((state) => ({
        opacity:
          typeof updater === 'function' ? updater(state.opacity) : updater,
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

    // Actions
    handleDancerSelection: (panelId, dancerId) => {
      const { selectedDancer: prevSelected } = get();
      set({ selectedPanel: panelId });
      if (
        prevSelected &&
        prevSelected.panelId === panelId &&
        prevSelected.dancerId === dancerId
      ) {
        set({ selectedDancer: null });
      } else {
        set({ selectedDancer: { panelId, dancerId } });
      }
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

    handleCanvasClick: () => {
      set({
        selectedPanel: null,
        selectedHand: null,
        selectedDancer: null,
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

    handleHeadSelection: (shape) => {
      const { selectedDancer } = get();
      if (!selectedDancer) return;
      set((state) => ({
        panels: state.panels.map((panel) => {
          if (panel.id === selectedDancer.panelId) {
            const dancerIndex = panel.dancers.findIndex(
              (d) => d.id === selectedDancer.dancerId,
            );
            if (dancerIndex !== -1) {
              const newHeadShapes = [...panel.headShapes];
              newHeadShapes[dancerIndex] = shape;
              return { ...panel, headShapes: newHeadShapes };
            }
          }
          return panel;
        }),
      }));
    },

    handleHandSelection: (shape) => {
      const { selectedHand } = get();
      if (!selectedHand) return;
      set((state) => ({
        panels: state.panels.map((panel) => {
          if (panel.id === selectedHand.panelId) {
            const dancerIndex = panel.dancers.findIndex(
              (d) => d.id === selectedHand.dancerId,
            );
            const newHandShapes = [...panel.handShapes];
            newHandShapes[dancerIndex] = {
              ...newHandShapes[dancerIndex],
              [selectedHand.handSide]: shape,
            };
            return { ...panel, handShapes: newHandShapes };
          }
          return panel;
        }),
      }));
    },

    handlePanelSelection: (panelId) => set({ selectedPanel: panelId }),

    handleShapeSelection: (panelId, shapeId) => {
      const { selectedShapeId: prevSelected } = get();
      set({ selectedPanel: panelId });
      if (
        prevSelected &&
        prevSelected.panelId === panelId &&
        prevSelected.shapeId === shapeId
      ) {
        set({ selectedShapeId: null });
      } else {
        set({ selectedShapeId: { panelId, shapeId } });
      }
    },

    handleShapeDraw: (shape) => {
      const { selectedPanel } = get();
      if (selectedPanel === null) return;
      set((state) => ({
        panels: state.panels.map((panel) =>
          panel.id === selectedPanel
            ? { ...panel, shapes: [...panel.shapes, shape] }
            : panel,
        ),
      }));
    },

    handleDelete: (selectedShape) => {
      if (!selectedShape) return;
      const { panelId, shapeId } = selectedShape;
      set((state) => ({
        panels: state.panels.map((panel) =>
          panel.id === panelId
            ? { ...panel, shapes: panel.shapes.filter((s) => s.id !== shapeId) }
            : panel,
        ),
        selectedShapeId: null,
      }));
    },

    addPanel: () =>
      set((state) => ({ panels: [...state.panels, createInitialPanel()] })),

    deleteSelectedPanel: (panelId) => {
      const { selectedPanel } = get();
      set((state) => {
        const newPanels = state.panels.filter((p) => p.id !== panelId);
        const deselect =
          selectedPanel === panelId
            ? {
                selectedPanel: null,
                selectedDancer: null,
                selectedHand: null,
                selectedShapeId: null,
              }
            : {};
        return { panels: newPanels, ...deselect };
      });
    },

    updateDancerState: (panelId, dancerId, newState) => {
      set((state) => ({
        panels: state.panels.map((panel) =>
          panel.id === panelId
            ? {
                ...panel,
                dancers: panel.dancers.map((d) =>
                  d.id === dancerId ? { ...d, ...newState } : d,
                ),
              }
            : panel,
        ),
      }));

      // Check if the update affects properties that require lock enforcement
      const transformProps = ['x', 'y', 'rotation', 'scaleX', 'scaleY'];
      const needsLockEnforcement = transformProps.some((prop) =>
        newState.hasOwnProperty(prop),
      );

      if (needsLockEnforcement) {
        get().enforceLocksForDancer(panelId, dancerId);
      }
    },

    // Hand-specific updates (position and rotation) with lock propagation
    updateHandPosition: (panelId, dancerId, side, newPos) => {
      set((curr) => {
        const panel = curr.panels.find((p) => p.id === panelId);
        if (!panel) return curr;
        const sourceDancer = panel.dancers.find((d) => d.id === dancerId);
        if (!sourceDancer) return curr;
        // Update source hand local
        let dancersAfter = panel.dancers.map((d) =>
          d.id === dancerId ? { ...d, [`${side}HandPos`]: newPos } : d,
        );
        // Compute source absolute position (using updated local)
        const srcHandAbs = get()._localToAbsolute(
          { ...sourceDancer, [`${side}HandPos`]: newPos },
          newPos,
        );
        // Find all locks that include this hand
        const groups = (panel.locks || []).filter((lock) =>
          (lock.members || []).some(
            (m) => m.dancerId === dancerId && m.side === side,
          ),
        );
        groups.forEach((group) => {
          (group.members || []).forEach((member) => {
            if (member.dancerId === dancerId && member.side === side) return;
            const other =
              dancersAfter.find((d) => d.id === member.dancerId) ||
              panel.dancers.find((d) => d.id === member.dancerId);
            if (!other) return;
            const newLocal = get()._absoluteToLocal(other, srcHandAbs);
            dancersAfter = dancersAfter.map((d) =>
              d.id === other.id
                ? { ...d, [`${member.side}HandPos`]: newLocal }
                : d,
            );
          });
        });
        const newPanels = curr.panels.map((p) =>
          p.id === panelId ? { ...p, dancers: dancersAfter } : p,
        );
        return { panels: newPanels };
      });
    },

    updateHandRotation: (panelId, dancerId, side, rotation) => {
      set((state) => ({
        panels: state.panels.map((panel) =>
          panel.id === panelId
            ? {
                ...panel,
                dancers: panel.dancers.map((d) =>
                  d.id === dancerId
                    ? { ...d, [`${side}HandRotation`]: rotation }
                    : d,
                ),
              }
            : panel,
        ),
      }));
    },

    // Lock management (group locks)
    getLockForHand: (panelId, dancerId, side) => {
      const panel = get().panels.find((p) => p.id === panelId);
      if (!panel) return null;
      const locks = panel.locks || [];
      return (
        locks.find((lock) =>
          (lock.members || []).some(
            (m) => m.dancerId === dancerId && m.side === side,
          ),
        ) || null
      );
    },
    removeLockById: (panelId, lockId) => {
      set((state) => ({
        panels: state.panels.map((p) =>
          p.id === panelId
            ? { ...p, locks: (p.locks || []).filter((l) => l.id !== lockId) }
            : p,
        ),
      }));
    },
    applySelectedLock: (panelId) => {
      const { lockUi } = get();
      if (!lockUi.selected || lockUi.selected.length < 2) return;
      set((state) => ({
        panels: state.panels.map((p) =>
          p.id === panelId
            ? {
                ...p,
                locks: [
                  ...(p.locks || []),
                  { id: uuidv4(), members: [...lockUi.selected] },
                ],
              }
            : p,
        ),
        lockUi: { ...state.lockUi, selected: [] },
      }));
      get().queueHandFlash(panelId, lockUi.selected);
    },
    lockOverlappingHands: (panelId, tolerance = 12) => {
      const state = get();
      const panel = state.panels.find((p) => p.id === panelId);
      if (!panel) return;
      const hands = [];
      panel.dancers.forEach((d) => {
        const left = d.leftHandPos || { x: 0, y: 0 };
        const right = d.rightHandPos || { x: 0, y: 0 };
        const leftAbs = get()._localToAbsolute(d, left);
        const rightAbs = get()._localToAbsolute(d, right);
        hands.push({ dancerId: d.id, side: 'left', abs: leftAbs });
        hands.push({ dancerId: d.id, side: 'right', abs: rightAbs });
      });
      const tol2 = tolerance * tolerance;
      // Build connectivity graph by proximity
      const n = hands.length;
      const visited = new Array(n).fill(false);
      const adj = Array.from({ length: n }, () => []);
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const dx = hands[i].abs.x - hands[j].abs.x;
          const dy = hands[i].abs.y - hands[j].abs.y;
          if (dx * dx + dy * dy <= tol2) {
            adj[i].push(j);
            adj[j].push(i);
          }
        }
      }
      const components = [];
      for (let i = 0; i < n; i++) {
        if (visited[i]) continue;
        const stack = [i];
        const comp = [];
        visited[i] = true;
        while (stack.length) {
          const v = stack.pop();
          comp.push(v);
          adj[v].forEach((u) => {
            if (!visited[u]) {
              visited[u] = true;
              stack.push(u);
            }
          });
        }
        if (comp.length >= 2) components.push(comp);
      }
      if (!components.length) return;
      set((curr) => {
        const newPanels = curr.panels.map((p) => {
          if (p.id !== panelId) return p;
          const existing = p.locks || [];
          const newLocks = [...existing];
          const flashGroups = [];
          components.forEach((indices) => {
            const members = indices.map((idx) => ({
              dancerId: hands[idx].dancerId,
              side: hands[idx].side,
            }));
            // Skip if a lock with the same members already exists
            const key = (arr) =>
              arr
                .map((m) => `${m.dancerId}:${m.side}`)
                .sort()
                .join('|');
            const membersKey = key(members);
            const exists = existing.some(
              (l) => key(l.members || []) === membersKey,
            );
            if (!exists) {
              newLocks.push({ id: uuidv4(), members });
              flashGroups.push(members);
            }
          });
          // Trigger flashes after state update
          setTimeout(() => {
            flashGroups.forEach((members) =>
              get().queueHandFlash(panelId, members),
            );
          }, 0);
          return { ...p, locks: newLocks };
        });
        return { panels: newPanels };
      });
    },

    enforceLocksForDancer: (panelId, dancerId) => {
      const state = get();
      const panel = state.panels.find((p) => p.id === panelId);
      if (!panel) return;
      const groups = (panel.locks || []).filter((lock) =>
        (lock.members || []).some((m) => m.dancerId === dancerId),
      );
      if (!groups.length) return;
      set((curr) => {
        const p = curr.panels.find((pp) => pp.id === panelId);
        if (!p) return curr;
        let dancersUpdated = p.dancers;
        groups.forEach((group) => {
          // Compute current absolute positions of each member hand based on current transforms
          const memberAbs = (group.members || [])
            .map((member) => {
              const d =
                dancersUpdated.find((dd) => dd.id === member.dancerId) ||
                p.dancers.find((dd) => dd.id === member.dancerId);
              if (!d) return null;
              const local = d[`${member.side}HandPos`];
              return state._localToAbsolute(d, local);
            })
            .filter(Boolean);
          if (!memberAbs.length) return;
          // Target as centroid (keeps roughly halfway between bodies)
          const centroid = memberAbs.reduce(
            (acc, pt) => ({ x: acc.x + pt.x, y: acc.y + pt.y }),
            { x: 0, y: 0 },
          );
          centroid.x /= memberAbs.length;
          centroid.y /= memberAbs.length;
          // Set each member's local position to match centroid
          (group.members || []).forEach((member) => {
            const d =
              dancersUpdated.find((dd) => dd.id === member.dancerId) ||
              p.dancers.find((dd) => dd.id === member.dancerId);
            if (!d) return;
            const newLocal = state._absoluteToLocal(d, centroid);
            dancersUpdated = dancersUpdated.map((dd) =>
              dd.id === d.id
                ? { ...dd, [`${member.side}HandPos`]: newLocal }
                : dd,
            );
          });
        });
        const newPanels = curr.panels.map((pp) =>
          pp.id === panelId ? { ...pp, dancers: dancersUpdated } : pp,
        );
        return { panels: newPanels };
      });
    },

    updateShapeState: (panelId, shapeId, newProps) => {
      set((state) => ({
        panels: state.panels.map((panel) =>
          panel.id === panelId
            ? {
                ...panel,
                shapes: panel.shapes.map((s) =>
                  s.id === shapeId ? { ...s, ...newProps } : s,
                ),
              }
            : panel,
        ),
      }));
    },

    serializePanel: (panelId) => {
      const panel = get().panels.find((p) => p.id === panelId);
      if (!panel) return null;

      // Ensure essential arrays exist
      const dancers = panel.dancers || [];
      const shapes = panel.shapes || [];
      const headShapes = panel.headShapes || [];
      const handShapes = panel.handShapes || [];

      return {
        ...panel,
        dancers: dancers.map((dancer, index) => ({
          id: dancer.id,
          x: dancer.x || 0,
          y: dancer.y || 0,
          rotation: dancer.rotation || 0,
          scaleX: dancer.scaleX || 1,
          scaleY: dancer.scaleY || 1,
          colour: dancer.colour || 'red',
          headShape: headShapes[index] || 'Upright',
          handShapes: handShapes[index] || { left: 'Waist', right: 'Waist' },
          leftHandPos: dancer.leftHandPos || { x: -30, y: -40 },
          rightHandPos: dancer.rightHandPos || { x: 30, y: -40 },
          leftElbowPos: dancer.leftElbowPos || { x: -45, y: -12 },
          rightElbowPos: dancer.rightElbowPos || { x: 45, y: -12 },
          leftHandRotation: dancer.leftHandRotation || 0,
          rightHandRotation: dancer.rightHandRotation || 0,
          leftLowerArmThickness: dancer.leftLowerArmThickness || 'thick',
          leftUpperArmThickness: dancer.leftUpperArmThickness || 'thick',
          rightLowerArmThickness: dancer.rightLowerArmThickness || 'thick',
          rightUpperArmThickness: dancer.rightUpperArmThickness || 'thick',
        })),
        shapes: shapes.map((shape) => ({
          id: shape.id,
          type: shape.type,
          x: shape.x || 0,
          y: shape.y || 0,
          width: shape.width,
          height: shape.height,
          draggable: shape.draggable !== false, // Default to true unless explicitly false
          rotation: shape.rotation || 0,
          scaleX: shape.scaleX || 1,
          scaleY: shape.scaleY || 1,
          opacity: shape.opacity !== undefined ? shape.opacity : 1,
          stroke: shape.stroke,
          fill: shape.fill,
          imageKey: shape.imageKey,
        })),
        locks: (panel.locks || []).map((lock) => ({
          id: lock.id,
          members: (lock.members || []).map((m) => ({
            dancerId: m.dancerId,
            side: m.side,
          })),
        })),
        // Preserve the original arrays for proper deserialization
        headShapes: headShapes,
        handShapes: handShapes,
      };
    },

    deserializePanel: (serializedPanel) => {
      if (!serializedPanel) {
        return null;
      }

      const oldToNew = new Map();

      // Handle dancers array - provide default empty array if null/undefined or not an array
      const dancers = Array.isArray(serializedPanel.dancers)
        ? serializedPanel.dancers
        : [];
      const newDancers = dancers.map((dancer) => {
        const newId = uuidv4();
        oldToNew.set(dancer.id, newId);
        return { ...dancer, id: newId };
      });

      // Handle shapes array - provide default empty array if null/undefined or not an array
      const shapes = Array.isArray(serializedPanel.shapes)
        ? serializedPanel.shapes
        : [];
      const newShapes = shapes.map((shape) => ({
        ...shape,
        id: uuidv4(),
      }));

      // Handle locks array - provide default empty array if null/undefined or not an array
      const locks = Array.isArray(serializedPanel.locks)
        ? serializedPanel.locks
        : [];
      const newLocks = locks.map((lock) => ({
        id: uuidv4(),
        members: (lock.members || []).map((m) => ({
          dancerId: oldToNew.get(m.dancerId) || m.dancerId,
          side: m.side,
        })),
      }));

      return {
        ...serializedPanel,
        id: uuidv4(),
        dancers: newDancers,
        shapes: newShapes,
        locks: newLocks,
        // Ensure essential arrays exist with defaults
        headShapes: serializedPanel.headShapes || [],
        handShapes: serializedPanel.handShapes || [],
      };
    },

    clonePanel: (panelId) => {
      const serializedPanel = get().serializePanel(panelId);
      if (!serializedPanel) return;
      const clonedPanel = get().deserializePanel(serializedPanel);
      set((state) => {
        const index = state.panels.findIndex((p) => p.id === panelId);
        const newPanels = [...state.panels];
        newPanels.splice(index + 1, 0, clonedPanel);
        return { panels: newPanels };
      });
    },

    movePanel: (draggedId, targetId) => {
      set((state) => {
        if (draggedId === targetId) return {};
        const ids = state.panels.map((p) => p.id);
        const fromIndex = ids.indexOf(draggedId);
        const toIndex = ids.indexOf(targetId);
        if (fromIndex === -1 || toIndex === -1) return {};
        ids.splice(fromIndex, 1);
        ids.splice(toIndex, 0, draggedId);
        const reordered = ids.map((id) =>
          state.panels.find((p) => p.id === id),
        );
        return { panels: reordered };
      });
    },
  })),
);
