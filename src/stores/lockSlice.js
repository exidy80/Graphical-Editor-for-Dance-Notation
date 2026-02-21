// Lock system slice - handles hand-locking mechanism for synchronized movement
import { adjustElbowsForProportionalArms } from './armAdjustment.js';

const createLockSlice = (set, get) => ({
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

  addLock: (panelId, lockData) => {
    set((state) => ({
      panels: state.panels.map((panel) =>
        panel.id === panelId
          ? { ...panel, locks: [...panel.locks, lockData] }
          : panel,
      ),
    }));
  },

  deleteLock: (panelId, lockId) => {
    set((state) => ({
      panels: state.panels.map((panel) =>
        panel.id === panelId
          ? {
              ...panel,
              locks: panel.locks.filter((lock) => lock.id !== lockId),
            }
          : panel,
      ),
    }));
  },

  removeLockById: (panelId, lockId) => {
    // Alias for deleteLock for compatibility
    get().deleteLock(panelId, lockId);
  },

  toggleLockSelection: (panelId, member) => {
    set((state) => {
      const current = state.lockUi.selected;
      const isSelected = current.some(
        (s) => s.dancerId === member.dancerId && s.side === member.side,
      );

      return {
        lockUi: {
          ...state.lockUi,
          selected: isSelected
            ? current.filter(
                (s) =>
                  !(s.dancerId === member.dancerId && s.side === member.side),
              )
            : [...current, { ...member, panelId }],
        },
      };
    });
  },

  createSelectedLock: () => {
    const { lockUi, selectedPanel } = get();
    if (!selectedPanel || lockUi.selected.length < 2) return;

    const { v4: uuidv4 } = require('uuid');
    const lockData = {
      id: uuidv4(),
      members: lockUi.selected.map((s) => ({
        dancerId: s.dancerId,
        side: s.side,
      })),
    };

    get().addLock(selectedPanel, lockData);
    get().queueHandFlash(selectedPanel, lockData.members);
    set((state) => ({ lockUi: { ...state.lockUi, selected: [] } }));
  },

  applySelectedLock: (panelId) => {
    const { lockUi } = get();
    if (!lockUi.selected || lockUi.selected.length < 2) return;

    const panel = get().panels.find((p) => p.id === panelId);
    if (!panel) return;

    const existingMemberKeys = new Set(
      (panel.locks || []).flatMap((lock) =>
        (lock.members || []).map((m) => `${m.dancerId}:${m.side}`),
      ),
    );
    const seen = new Set();
    const filtered = lockUi.selected.filter((member) => {
      const key = `${member.dancerId}:${member.side}`;
      if (seen.has(key) || existingMemberKeys.has(key)) return false;
      seen.add(key);
      return true;
    });
    if (filtered.length < 2) {
      set((state) => ({ lockUi: { ...state.lockUi, selected: [] } }));
      return;
    }

    const { v4: uuidv4 } = require('uuid');
    set((state) => ({
      panels: state.panels.map((p) =>
        p.id === panelId
          ? {
              ...p,
              locks: [
                ...(p.locks || []),
                { id: uuidv4(), members: [...filtered] },
              ],
            }
          : p,
      ),
      lockUi: { ...state.lockUi, selected: [] },
    }));
    get().queueHandFlash(panelId, lockUi.selected);
  },

  lockOverlappingHands: (panelId, tolerance = 12) => {
    const { v4: uuidv4 } = require('uuid');
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

      // Store original dancer states before hand position changes for elbow adjustment
      const originalDancerStates = {};
      p.dancers.forEach((d) => {
        originalDancerStates[d.id] = { ...d };
      });

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

      // After updating hand positions, adjust elbows to maintain arm proportions
      dancersUpdated = dancersUpdated.map((dancer) => {
        const originalDancer = originalDancerStates[dancer.id];
        if (!originalDancer) return dancer;

        // Check which hands were affected by locks
        const affectedSides = [];
        groups.forEach((group) => {
          group.members.forEach((member) => {
            if (member.dancerId === dancer.id) {
              affectedSides.push(member.side);
            }
          });
        });

        if (affectedSides.length > 0) {
          // Adjust elbows for the affected sides
          return adjustElbowsForProportionalArms(
            dancer,
            originalDancer,
            affectedSides,
          );
        }

        return dancer;
      });

      const newPanels = curr.panels.map((pp) =>
        pp.id === panelId ? { ...pp, dancers: dancersUpdated } : pp,
      );

      return { panels: newPanels };
    });
  },
});

export default createLockSlice;
