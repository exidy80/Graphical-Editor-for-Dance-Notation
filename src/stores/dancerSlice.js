// Dancer interaction slice - handles dancer selection, state updates, and hand interactions
import { adjustElbowsForProportionalArms } from './armAdjustment.js';

const createDancerSlice = (set, get) => ({
  // Actions
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

      // Store original dancer states before hand position changes for elbow adjustment
      const originalDancerStates = {};
      panel.dancers.forEach((d) => {
        originalDancerStates[d.id] = { ...d };
      });

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

      const affectedDancers = new Set([dancerId]);

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
          affectedDancers.add(member.dancerId);
        });
      });

      // After updating hand positions, adjust elbows to maintain arm proportions
      dancersAfter = dancersAfter.map((dancer) => {
        if (!affectedDancers.has(dancer.id)) return dancer;

        const originalDancer = originalDancerStates[dancer.id];
        if (!originalDancer) return dancer;

        // Find which sides were affected for this dancer
        const affectedSides = [];

        // Check if this dancer's hand was directly moved
        if (dancer.id === dancerId) {
          affectedSides.push(side);
        }

        // Check if this dancer's hands were affected by locks
        groups.forEach((group) => {
          group.members.forEach((member) => {
            if (
              member.dancerId === dancer.id &&
              !affectedSides.includes(member.side)
            ) {
              affectedSides.push(member.side);
            }
          });
        });

        if (affectedSides.length > 0) {
          return adjustElbowsForProportionalArms(
            dancer,
            originalDancer,
            affectedSides,
          );
        }

        return dancer;
      });

      const newPanels = curr.panels.map((p) =>
        p.id === panelId ? { ...p, dancers: dancersAfter } : p,
      );
      return { panels: newPanels };
    });
  },

  updateHandRotation: (panelId, dancerId, handSide, rotation) => {
    const rotationKey = `${handSide}HandRotation`;
    get().updateDancerState(panelId, dancerId, { [rotationKey]: rotation });
  },

  updateElbowPosition: (panelId, dancerId, elbowSide, position) => {
    const elbowKey = `${elbowSide}ElbowPos`;
    get().updateDancerState(panelId, dancerId, { [elbowKey]: position });
  },

  updateArmThickness: (panelId, dancerId, side, segment, thickness) => {
    const thicknessKey = `${side}${segment}ArmThickness`;
    get().updateDancerState(panelId, dancerId, { [thicknessKey]: thickness });
  },

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
});

export default createDancerSlice;
