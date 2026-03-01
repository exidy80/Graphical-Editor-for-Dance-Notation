// Dancer interaction slice - handles dancer selection, state updates, and hand interactions
import { adjustElbowsForProportionalArms } from './armAdjustment.js';

const createDancerSlice = (set, get, api) => ({
  // Actions
  updateDancerState: (panelId, dancerId, newState) => {
    set((state) => {
      const newPanels = state.panels.map((panel) =>
        panel.id === panelId
          ? {
              ...panel,
              dancers: panel.dancers.map((d) =>
                d.id === dancerId ? { ...d, ...newState } : d,
              ),
            }
          : panel,
      );
      return {
        ...state,
        panels: newPanels,
      };
    });

    // Check if the update affects properties that require lock enforcement
    const transformProps = ['x', 'y', 'rotation', 'scaleX', 'scaleY'];
    const needsLockEnforcement = transformProps.some((prop) =>
      newState.hasOwnProperty(prop),
    );

    if (needsLockEnforcement) {
      get().enforceLocksForDancer(panelId, dancerId);
    }
  },

  // Drag mode functions - actual pause/resume happens in index.js wrapper
  // These are no-ops to avoid state changes and batching issues
  startDragMode: () => {},
  endDragMode: () => {},

  // Hand-specific updates (position and rotation) with lock propagation
  updateHandPosition: (panelId, dancerId, side, newPos) => {
    const { syncLockedHandsFromSource, _localToAbsolute, _absoluteToLocal } =
      get();

    syncLockedHandsFromSource(panelId, dancerId, side, (panel, memberSet) => {
      const dancers = panel.dancers;

      // Snapshot original states for elbow adjustment
      const originalDancerStates = {};
      dancers.forEach((d) => {
        originalDancerStates[d.id] = { ...d };
      });

      const sourceDancer = dancers.find((d) => d.id === dancerId);
      if (!sourceDancer) return panel;

      // Compute the absolute position of the source hand using the new local pos
      const srcHandAbs = _localToAbsolute(
        { ...sourceDancer, [`${side}HandPos`]: newPos },
        newPos,
      );

      // 1) Apply the new local position to the source hand
      let dancersAfter = dancers.map((d) =>
        d.id === dancerId ? { ...d, [`${side}HandPos`]: newPos } : d,
      );

      const affectedDancers = new Set();
      affectedDancers.add(dancerId);

      // 2) Propagate to all other members in the lock group (if any)
      memberSet.forEach((key) => {
        const [idStr, memberSide] = key.split(':');
        const memberId = idStr;

        // We already updated this exact hand above
        if (memberId === dancerId && memberSide === side) return;

        const d =
          dancersAfter.find((dd) => dd.id === memberId) ||
          dancers.find((dd) => dd.id === memberId);
        if (!d) return;

        const newLocal = _absoluteToLocal(d, srcHandAbs);
        dancersAfter = dancersAfter.map((dd) =>
          dd.id === memberId
            ? { ...dd, [`${memberSide}HandPos`]: newLocal }
            : dd,
        );
        affectedDancers.add(memberId);
      });

      // 3) Adjust elbows for proportional arms on affected dancers
      dancersAfter = dancersAfter.map((dancer) => {
        if (!affectedDancers.has(dancer.id)) return dancer;

        const originalDancer = originalDancerStates[dancer.id];
        if (!originalDancer) return dancer;

        // Determine which sides for this dancer were affected
        const affectedSides = [];
        memberSet.forEach((key) => {
          const [idStr, memberSide] = key.split(':');
          if (idStr === dancer.id && !affectedSides.includes(memberSide)) {
            affectedSides.push(memberSide);
          }
        });

        if (!affectedSides.length) return dancer;

        return adjustElbowsForProportionalArms(
          dancer,
          originalDancer,
          affectedSides,
        );
      });

      return { ...panel, dancers: dancersAfter };
    });
  },

  updateHandRotation: (panelId, dancerId, handSide, rotation) => {
    const { syncLockedHandsFromSource } = get();

    syncLockedHandsFromSource(
      panelId,
      dancerId,
      handSide,
      (panel, memberSet) => {
        const newDancers = panel.dancers.map((d) => {
          let updated = d;

          // For this dancer, check both left/right hands against the member set
          ['left', 'right'].forEach((side) => {
            const key = `${d.id}:${side}`;
            if (memberSet.has(key)) {
              const rotationKey = `${side}HandRotation`;
              updated = { ...updated, [rotationKey]: rotation };
            }
          });

          return updated;
        });

        return { ...panel, dancers: newDancers };
      },
    );
  },

  updateElbowPosition: (panelId, dancerId, elbowSide, position) => {
    const elbowKey = `${elbowSide}ElbowPos`;
    get().updateDancerState(panelId, dancerId, { [elbowKey]: position });
  },

  updateArmThickness: (panelId, dancerId, side, segment, thickness) => {
    const thicknessKey = `${side}${segment}ArmThickness`;
    get().updateDancerState(panelId, dancerId, { [thicknessKey]: thickness });
  },

  handleDancerSelection: (panelId, dancerId, multiSelect = false) => {
    const { selectedItems } = get();
    set({ selectedPanel: panelId });
    if (multiSelect) {
      // Ctrl/Cmd-click: toggle this dancer in the selection
      const existingIndex = selectedItems.findIndex(
        (item) => item.id === dancerId,
      );
      set({
        selectedItems:
          existingIndex >= 0
            ? selectedItems.filter((_, idx) => idx !== existingIndex)
            : [...selectedItems, { type: 'dancer', panelId, id: dancerId }],
      });
    } else {
      // Single click: select only this dancer, deselect all others
      set({
        selectedItems: [{ type: 'dancer', panelId, id: dancerId }],
      });
    }
  },

  handleHeadSelection: (shape) => {
    const { selectedItems } = get();
    const selectedDancer = selectedItems.find((item) => item.type === 'dancer');
    if (!selectedDancer) return;
    set((state) => ({
      panels: state.panels.map((panel) => {
        if (panel.id !== selectedDancer.panelId) return panel;
        const dancerIndex = panel.dancers.findIndex(
          (d) => d.id === selectedDancer.id,
        );
        if (dancerIndex === -1) return panel;
        const newHeadShapes = [...panel.headShapes];
        newHeadShapes[dancerIndex] = shape;
        return { ...panel, headShapes: newHeadShapes };
      }),
    }));
  },

  handleHandSelection: (shape) => {
    const { selectedHand, syncLockedHandsFromSource } = get();
    if (!selectedHand) return;

    const { panelId, dancerId, handSide } = selectedHand;

    syncLockedHandsFromSource(
      panelId,
      dancerId,
      handSide,
      (panel, memberSet) => {
        // Copy handShapes shallowly so we can mutate per-dancer entries
        const newHandShapes = panel.handShapes.map((hs) => ({ ...hs }));

        panel.dancers.forEach((dancer, index) => {
          ['left', 'right'].forEach((side) => {
            const key = `${dancer.id}:${side}`;
            if (memberSet.has(key)) {
              newHandShapes[index] = {
                ...newHandShapes[index],
                [side]: shape,
              };
            }
          });
        });

        return { ...panel, handShapes: newHandShapes };
      },
    );
  },
});

export default createDancerSlice;
