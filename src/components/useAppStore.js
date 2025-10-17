import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

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
      text: 'X',
      fontSize: 20,
      fill: 'black',
    },
  ],
  locks: [],
});

export const useAppStore = create((set, get) => ({
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
  // State
  panelSize: { width: 300, height: 300 },
  selectedPanel: null,
  selectedHand: null,
  selectedDancer: null,
  selectedShapeId: null,
  panels: [createInitialPanel()],
  handFlash: [], // transient effects for visual feedback on hands
  // Hand-locking UI state (group selection)
  lockUi: { active: false, selected: [] },
  opacity: {
    dancers: { value: 1, disabled: false },
    symbols: { value: 1, disabled: false },
  },

  // Basic setters (only those needed externally)
  setPanels: panels => set({ panels }),
  setSelectedPanel: selectedPanel => set({ selectedPanel }),
  setSelectedHand: selectedHand => set({ selectedHand }),
  setSelectedDancer: selectedDancer => set({ selectedDancer }),
  setSelectedShapeId: selectedShapeId => set({ selectedShapeId }),
  setOpacity: updater =>
    set(state => ({ opacity: typeof updater === 'function' ? updater(state.opacity) : updater })),
  queueHandFlash: (panelId, members, duration = 500) => {
    const entries = members.map(m => ({ panelId, dancerId: m.dancerId, side: m.side }));
    set(state => ({ handFlash: [...state.handFlash, ...entries] }));
    // schedule removal
    setTimeout(() => {
      set(state => ({ handFlash: state.handFlash.filter(h => !entries.some(e => e.panelId === h.panelId && e.dancerId === h.dancerId && e.side === h.side)) }));
    }, duration);
  },
  setLockModeActive: active => set(state => ({ lockUi: { active, selected: active ? state.lockUi.selected : [] } })),
  clearLockSelection: () => set(state => ({ lockUi: { ...state.lockUi, selected: [] } })),

  // Actions
  handleDancerSelection: (panelId, dancerId) => {
    const { selectedDancer: prevSelected } = get();
    set({ selectedPanel: panelId });
    if (prevSelected && prevSelected.panelId === panelId && prevSelected.dancerId === dancerId) {
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
      set(state => {
        if (state.selectedPanel !== panelId) {
          return state; // enforce same panel
        }
        const key = `${dancerId}:${handSide}`;
        const exists = state.lockUi.selected.some(m => `${m.dancerId}:${m.side}` === key);
        return {
          lockUi: {
            ...state.lockUi,
            selected: exists
              ? state.lockUi.selected.filter(m => `${m.dancerId}:${m.side}` !== key)
              : [...state.lockUi.selected, { dancerId, side: handSide }],
          },
          selectedHand: { panelId, dancerId, handSide },
        };
      });
      return;
    }
    // Normal selection toggle
    if (prevHand && prevHand.panelId === panelId && prevHand.dancerId === dancerId && prevHand.handSide === handSide) {
      set({ selectedHand: null });
    } else {
      set({ selectedHand: { panelId, dancerId, handSide } });
    }
  },

  handleCanvasClick: () => {
    set({ selectedPanel: null, selectedHand: null, selectedDancer: null, selectedShapeId: null });
  },

  handleOpacityChange: type => {
    set(state => ({
      opacity: {
        ...state.opacity,
        [type]: {
          value: state.opacity[type].value === 1 ? 0.5 : 1,
          disabled: state.opacity[type].value === 1,
        },
      },
    }));
  },

  handleHeadSelection: shape => {
    const { selectedDancer } = get();
    if (!selectedDancer) return;
    set(state => ({
      panels: state.panels.map(panel => {
        if (panel.id === selectedDancer.panelId) {
          const dancerIndex = panel.dancers.findIndex(d => d.id === selectedDancer.dancerId);
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

  handleHandSelection: shape => {
    const { selectedHand } = get();
    if (!selectedHand) return;
    set(state => ({
      panels: state.panels.map(panel => {
        if (panel.id === selectedHand.panelId) {
          const dancerIndex = panel.dancers.findIndex(d => d.id === selectedHand.dancerId);
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

  handlePanelSelection: panelId => set({ selectedPanel: panelId }),

  handleShapeSelection: (panelId, shapeId) => {
    const { selectedShapeId: prevSelected } = get();
    set({ selectedPanel: panelId });
    if (prevSelected && prevSelected.panelId === panelId && prevSelected.shapeId === shapeId) {
      set({ selectedShapeId: null });
    } else {
      set({ selectedShapeId: { panelId, shapeId } });
    }
  },

  handleShapeDraw: shape => {
    const { selectedPanel } = get();
    if (selectedPanel === null) return;
    set(state => ({
      panels: state.panels.map(panel =>
        panel.id === selectedPanel ? { ...panel, shapes: [...panel.shapes, shape] } : panel
      ),
    }));
  },

  handleDelete: selectedShape => {
    if (!selectedShape) return;
    const { panelId, shapeId } = selectedShape;
    set(state => ({
      panels: state.panels.map(panel =>
        panel.id === panelId ? { ...panel, shapes: panel.shapes.filter(s => s.id !== shapeId) } : panel
      ),
      selectedShapeId: null,
    }));
  },

  addPanel: () => set(state => ({ panels: [...state.panels, createInitialPanel()] })),

  deleteSelectedPanel: panelId => {
    const { selectedPanel } = get();
    set(state => {
      const newPanels = state.panels.filter(p => p.id !== panelId);
      const deselect = selectedPanel === panelId
        ? { selectedPanel: null, selectedDancer: null, selectedHand: null, selectedShapeId: null }
        : {};
      return { panels: newPanels, ...deselect };
    });
  },

  updateDancerState: (panelId, dancerId, newState) => {
    set(state => ({
      panels: state.panels.map(panel =>
        panel.id === panelId
          ? {
              ...panel,
              dancers: panel.dancers.map(d => (d.id === dancerId ? { ...d, ...newState } : d)),
            }
          : panel
      ),
    }));
  },

  // Hand-specific updates (position and rotation) with lock propagation
  updateHandPosition: (panelId, dancerId, side, newPos) => {
    set(curr => {
      const panel = curr.panels.find(p => p.id === panelId);
      if (!panel) return curr;
      const sourceDancer = panel.dancers.find(d => d.id === dancerId);
      if (!sourceDancer) return curr;
      // Update source hand local
      let dancersAfter = panel.dancers.map(d => d.id === dancerId ? { ...d, [`${side}HandPos`]: newPos } : d);
      // Compute source absolute position (using updated local)
      const srcHandAbs = get()._localToAbsolute(
        { ...sourceDancer, [`${side}HandPos`]: newPos },
        newPos
      );
      // Find all locks that include this hand
      const groups = (panel.locks || []).filter(lock => (lock.members || []).some(m => m.dancerId === dancerId && m.side === side));
      groups.forEach(group => {
        (group.members || []).forEach(member => {
          if (member.dancerId === dancerId && member.side === side) return;
          const other = dancersAfter.find(d => d.id === member.dancerId) || panel.dancers.find(d => d.id === member.dancerId);
          if (!other) return;
          const newLocal = get()._absoluteToLocal(other, srcHandAbs);
          dancersAfter = dancersAfter.map(d => d.id === other.id ? { ...d, [`${member.side}HandPos`]: newLocal } : d);
        });
      });
      const newPanels = curr.panels.map(p => p.id === panelId ? { ...p, dancers: dancersAfter } : p);
      return { panels: newPanels };
    });
  },

  updateHandRotation: (panelId, dancerId, side, rotation) => {
    set(state => ({
      panels: state.panels.map(panel =>
        panel.id === panelId
          ? {
              ...panel,
              dancers: panel.dancers.map(d =>
                d.id === dancerId ? { ...d, [`${side}HandRotation`]: rotation } : d
              ),
            }
          : panel
      ),
    }));
  },

  // Lock management (group locks)
  getLockForHand: (panelId, dancerId, side) => {
    const panel = get().panels.find(p => p.id === panelId);
    if (!panel) return null;
    const locks = panel.locks || [];
    return locks.find(lock => (lock.members || []).some(m => m.dancerId === dancerId && m.side === side)) || null;
  },
  removeLockById: (panelId, lockId) => {
    set(state => ({
      panels: state.panels.map(p =>
        p.id === panelId ? { ...p, locks: (p.locks || []).filter(l => l.id !== lockId) } : p
      ),
    }));
  },
  applySelectedLock: panelId => {
    const { lockUi } = get();
    if (!lockUi.selected || lockUi.selected.length < 2) return;
    set(state => ({
      panels: state.panels.map(p =>
        p.id === panelId
          ? { ...p, locks: [...(p.locks || []), { id: uuidv4(), members: [...lockUi.selected] }] }
          : p
      ),
      lockUi: { ...state.lockUi, selected: [] },
    }));
    get().queueHandFlash(panelId, lockUi.selected);
  },
  lockOverlappingHands: (panelId, tolerance = 12) => {
    const state = get();
    const panel = state.panels.find(p => p.id === panelId);
    if (!panel) return;
    const hands = [];
    panel.dancers.forEach(d => {
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
        adj[v].forEach(u => {
          if (!visited[u]) {
            visited[u] = true;
            stack.push(u);
          }
        });
      }
      if (comp.length >= 2) components.push(comp);
    }
    if (!components.length) return;
    set(curr => {
      const newPanels = curr.panels.map(p => {
        if (p.id !== panelId) return p;
        const existing = p.locks || [];
        const newLocks = [...existing];
        const flashGroups = [];
        components.forEach(indices => {
          const members = indices.map(idx => ({ dancerId: hands[idx].dancerId, side: hands[idx].side }));
          // Skip if a lock with the same members already exists
          const key = (arr) => arr.map(m => `${m.dancerId}:${m.side}`).sort().join('|');
          const membersKey = key(members);
          const exists = existing.some(l => key(l.members || []) === membersKey);
          if (!exists) {
            newLocks.push({ id: uuidv4(), members });
            flashGroups.push(members);
          }
        });
        // Trigger flashes after state update
        setTimeout(() => {
          flashGroups.forEach(members => get().queueHandFlash(panelId, members));
        }, 0);
        return { ...p, locks: newLocks };
      });
      return { panels: newPanels };
    });
  },

  // Enforce coincident locks after dancer movement by aligning counterpart hands to the moved hand's absolute position
  enforceLocksForHand: (panelId, dancerId, side) => {
    const state = get();
    const panel = state.panels.find(p => p.id === panelId);
    if (!panel) return;
    const dancer = panel.dancers.find(d => d.id === dancerId);
    if (!dancer) return;
    const handLocal = dancer[`${side}HandPos`];
    const handAbs = get()._localToAbsolute(dancer, handLocal);
    const groups = (panel.locks || []).filter(lock => (lock.members || []).some(m => m.dancerId === dancerId && m.side === side));
    if (!groups.length) return;
    set(curr => {
      const newPanels = curr.panels.map(p => {
        if (p.id !== panelId) return p;
        let dancersUpdated = p.dancers;
        groups.forEach(g => {
          (g.members || []).forEach(member => {
            if (member.dancerId === dancerId && member.side === side) return;
            const other = dancersUpdated.find(d => d.id === member.dancerId) || p.dancers.find(d => d.id === member.dancerId);
            if (!other) return;
            const newLocal = get()._absoluteToLocal(other, handAbs);
            dancersUpdated = dancersUpdated.map(d => d.id === other.id ? { ...d, [`${member.side}HandPos`]: newLocal } : d);
          });
        });
        return { ...p, dancers: dancersUpdated };
      });
      return { panels: newPanels };
    });
  },
  enforceLocksForDancer: (panelId, dancerId) => {
    const state = get();
    const panel = state.panels.find(p => p.id === panelId);
    if (!panel) return;
    const groups = (panel.locks || []).filter(lock => (lock.members || []).some(m => m.dancerId === dancerId));
    if (!groups.length) return;
    set(curr => {
      const p = curr.panels.find(pp => pp.id === panelId);
      if (!p) return curr;
      let dancersUpdated = p.dancers;
      groups.forEach(group => {
        // Compute current absolute positions of each member hand based on current transforms
        const memberAbs = (group.members || []).map(member => {
          const d = dancersUpdated.find(dd => dd.id === member.dancerId) || p.dancers.find(dd => dd.id === member.dancerId);
          if (!d) return null;
          const local = d[`${member.side}HandPos`];
          return state._localToAbsolute(d, local);
        }).filter(Boolean);
        if (!memberAbs.length) return;
        // Target as centroid (keeps roughly halfway between bodies)
        const centroid = memberAbs.reduce((acc, pt) => ({ x: acc.x + pt.x, y: acc.y + pt.y }), { x: 0, y: 0 });
        centroid.x /= memberAbs.length;
        centroid.y /= memberAbs.length;
        // Set each member's local position to match centroid
        (group.members || []).forEach(member => {
          const d = dancersUpdated.find(dd => dd.id === member.dancerId) || p.dancers.find(dd => dd.id === member.dancerId);
          if (!d) return;
          const newLocal = state._absoluteToLocal(d, centroid);
          dancersUpdated = dancersUpdated.map(dd => dd.id === d.id ? { ...dd, [`${member.side}HandPos`]: newLocal } : dd);
        });
      });
      const newPanels = curr.panels.map(pp => pp.id === panelId ? { ...pp, dancers: dancersUpdated } : pp);
      return { panels: newPanels };
    });
  },

  updateShapeState: (panelId, shapeId, newProps) => {
    set(state => ({
      panels: state.panels.map(panel =>
        panel.id === panelId
          ? {
              ...panel,
              shapes: panel.shapes.map(s => (s.id === shapeId ? { ...s, ...newProps } : s)),
            }
          : panel
      ),
    }));
  },

  serializePanel: panelId => {
    const panel = get().panels.find(p => p.id === panelId);
    if (!panel) return null;
    return {
      ...panel,
      dancers: panel.dancers.map(dancer => ({
        id: dancer.id,
        x: dancer.x,
        y: dancer.y,
        rotation: dancer.rotation,
        scaleX: dancer.scaleX,
        scaleY: dancer.scaleY,
        colour: dancer.colour,
        headShape: panel.headShapes[panel.dancers.indexOf(dancer)],
        handShapes: panel.handShapes[panel.dancers.indexOf(dancer)],
        leftHandPos: dancer.leftHandPos,
        rightHandPos: dancer.rightHandPos,
        leftElbowPos: dancer.leftElbowPos,
        rightElbowPos: dancer.rightElbowPos,
        leftHandRotation: dancer.leftHandRotation,
        rightHandRotation: dancer.rightHandRotation,
        leftLowerArmThickness: dancer.leftLowerArmThickness,
        leftUpperArmThickness: dancer.leftUpperArmThickness,
        rightLowerArmThickness: dancer.rightLowerArmThickness,
        rightUpperArmThickness: dancer.rightUpperArmThickness,
      })),
      shapes: panel.shapes.map(shape => ({
        id: shape.id,
        type: shape.type,
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
        draggable: shape.draggable,
        rotation: shape.rotation,
        scaleX: shape.scaleX,
        scaleY: shape.scaleY,
        opacity: shape.opacity,
        stroke: shape.stroke,
        fill: shape.fill,
        imageKey: shape.imageKey,
      })),
      locks: (panel.locks || []).map(lock => ({
        id: lock.id,
        members: (lock.members || []).map(m => ({ dancerId: m.dancerId, side: m.side })),
      })),
    };
  },

  deserializePanel: serializedPanel => {
    const oldToNew = new Map();
    const newDancers = serializedPanel.dancers.map(dancer => {
      const newId = uuidv4();
      oldToNew.set(dancer.id, newId);
      return { ...dancer, id: newId };
    });
    const newShapes = serializedPanel.shapes.map(shape => ({ ...shape, id: uuidv4() }));
    const newLocks = (serializedPanel.locks || []).map(lock => ({
      id: uuidv4(),
      members: (lock.members || []).map(m => ({ dancerId: oldToNew.get(m.dancerId) || m.dancerId, side: m.side })),
    }));
    return {
      ...serializedPanel,
      id: uuidv4(),
      dancers: newDancers,
      shapes: newShapes,
      locks: newLocks,
    };
  },

  clonePanel: panelId => {
    const serializedPanel = get().serializePanel(panelId);
    if (!serializedPanel) return;
    const clonedPanel = get().deserializePanel(serializedPanel);
    set(state => {
      const index = state.panels.findIndex(p => p.id === panelId);
      const newPanels = [...state.panels];
      newPanels.splice(index + 1, 0, clonedPanel);
      return { panels: newPanels };
    });
  },

  movePanel: (panelId, direction) => {
    set(state => {
      const panelIndex = state.panels.findIndex(p => p.id === panelId);
      if (panelIndex === -1) return state;
      const newPanels = [...state.panels];
      const panel = newPanels[panelIndex];
      if (direction === 'right' && panelIndex < newPanels.length - 1) {
        newPanels.splice(panelIndex, 1);
        newPanels.splice(panelIndex + 1, 0, panel);
      } else if (direction === 'left' && panelIndex > 0) {
        newPanels.splice(panelIndex, 1);
        newPanels.splice(panelIndex - 1, 0, panel);
      }
      return { panels: newPanels };
    });
  },
}));


