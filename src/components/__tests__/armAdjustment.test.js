import { act } from '@testing-library/react';
import { useAppStore } from '../../stores';
import { getSegmentLength, getArmRatio, getElbowAngleFromStraight, getShoulderPosition } from '../../stores/armAdjustment.js';

describe('Arm Adjustment with Locked Hands', () => {
  beforeEach(() => {
    const { getState, setState } = useAppStore;
    // Reset to a clean state with normalized dancer positions
    const panels = getState().panels.map((p) => ({
      ...p,
      locks: [],
      dancers: p.dancers.map((d) => ({
        ...d,
        x: 0,
        y: 0,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        leftHandPos: { x: -60, y: 0 }, // Default hand positions
        rightHandPos: { x: 60, y: 0 },
        leftElbowPos: { x: -45, y: -12 }, // Default elbow positions
        rightElbowPos: { x: 45, y: -12 },
        leftHandRotation: 0,
        rightHandRotation: 0,
      })),
      shapes: p.shapes,
    }));
    setState(
      {
        panelSize: { width: 300, height: 300 },
        selectedPanel: null,
        selectedHand: null,
        selectedDancer: null,
        selectedShapeId: null,
        panels,
        lockUi: { active: false, selected: [] },
        opacity: {
          dancers: { value: 1, disabled: false },
          symbols: { value: 1, disabled: false },
        },
      },
      false,
    );
  });

  // Helper function for arm segment length calculation
  const getArmSegmentLength = (dancer, side, segment) => {
    const shoulder = getShoulderPosition(side);
    const elbow = dancer[`${side}ElbowPos`];
    const hand = dancer[`${side}HandPos`];

    if (segment === 'upper') {
      return getSegmentLength(shoulder, elbow);
    } else if (segment === 'lower') {
      return getSegmentLength(elbow, hand);
    }
    return 0;
  };

  const expectArmProportionsPreserved = (
    originalDancer,
    updatedDancer,
    side,
    ratioTolerance = 0.15,
    angleTolerance = 1.5,
  ) => {
    const originalRatio = getArmRatio(originalDancer, side);
    const updatedRatio = getArmRatio(updatedDancer, side);
    const originalAngle = getElbowAngleFromStraight(originalDancer, side);
    const updatedAngle = getElbowAngleFromStraight(updatedDancer, side);

    // Allow more tolerance for reasonable geometric constraints
    // Ratio preservation is the primary goal, angle preservation is secondary
    expect(Math.abs(updatedRatio - originalRatio)).toBeLessThan(ratioTolerance);
    expect(Math.abs(updatedAngle - originalAngle)).toBeLessThan(angleTolerance);
  };

  test('when locked hands move, elbow adjusts to maintain arm segment ratio', () => {
    const { getState } = useAppStore;
    const panel = getState().panels[0];
    const d0 = panel.dancers[0];
    const d1 = panel.dancers[1];

    // Set up two dancers at different positions
    act(() => getState().updateDancerState(panel.id, d0.id, { x: 0, y: 0 }));
    act(() => getState().updateDancerState(panel.id, d1.id, { x: 200, y: 0 }));

    // Set specific arm configurations with different elbow positions
    act(() =>
      getState().updateDancerState(panel.id, d0.id, {
        leftElbowPos: { x: -50, y: -20 },
        leftHandPos: { x: -80, y: -30 },
      }),
    );
    act(() =>
      getState().updateDancerState(panel.id, d1.id, {
        rightElbowPos: { x: 40, y: -15 },
        rightHandPos: { x: 70, y: -25 },
      }),
    );

    // Store original arm configurations
    const originalD0 = getState().panels[0].dancers.find((d) => d.id === d0.id);
    const originalD1 = getState().panels[0].dancers.find((d) => d.id === d1.id);

    // Lock the hands
    act(() => getState().setSelectedPanel(panel.id));
    act(() => getState().setLockModeActive(true));
    act(() => getState().handleHandClick(panel.id, d0.id, 'left'));
    act(() => getState().handleHandClick(panel.id, d1.id, 'right'));
    act(() => getState().applySelectedLock(panel.id));

    // Move one hand directly
    act(() =>
      getState().updateHandPosition(panel.id, d0.id, 'left', {
        x: -60,
        y: -40,
      }),
    );

    const updatedState = getState().panels[0];
    const updatedD0 = updatedState.dancers.find((d) => d.id === d0.id);
    const updatedD1 = updatedState.dancers.find((d) => d.id === d1.id);

    // The moved dancer's arm should maintain its proportions
    expectArmProportionsPreserved(originalD0, updatedD0, 'left');

    // The other dancer's arm should also maintain its proportions
    expectArmProportionsPreserved(originalD1, updatedD1, 'right');
  });

  test('when locked hands move due to body movement, elbow adjusts proportionally', () => {
    const { getState } = useAppStore;
    const panel = getState().panels[0];
    const d0 = panel.dancers[0];
    const d1 = panel.dancers[1];

    // Set up dancers with specific arm configurations
    act(() =>
      getState().updateDancerState(panel.id, d0.id, {
        x: 50,
        y: 50,
        leftElbowPos: { x: -35, y: -25 },
        leftHandPos: { x: -55, y: -45 },
      }),
    );
    act(() =>
      getState().updateDancerState(panel.id, d1.id, {
        x: 150,
        y: 50,
        rightElbowPos: { x: 35, y: -25 },
        rightHandPos: { x: 55, y: -45 },
      }),
    );

    // Store original configurations
    const originalD0 = getState().panels[0].dancers.find((d) => d.id === d0.id);
    const originalD1 = getState().panels[0].dancers.find((d) => d.id === d1.id);

    // Lock the hands
    act(() => getState().setSelectedPanel(panel.id));
    act(() => getState().setLockModeActive(true));
    act(() => getState().handleHandClick(panel.id, d0.id, 'left'));
    act(() => getState().handleHandClick(panel.id, d1.id, 'right'));
    act(() => getState().applySelectedLock(panel.id));

    // Move dancer body, which should trigger lock enforcement
    act(() => getState().updateDancerState(panel.id, d0.id, { x: 75, y: 75 }));

    const updatedState = getState().panels[0];
    const updatedD0 = updatedState.dancers.find((d) => d.id === d0.id);
    const updatedD1 = updatedState.dancers.find((d) => d.id === d1.id);

    // Both dancers' arms should maintain their proportions
    expectArmProportionsPreserved(originalD0, updatedD0, 'left');
    expectArmProportionsPreserved(originalD1, updatedD1, 'right');
  });

  test('arm adjustment preserves elbow bend angle when hand position changes', () => {
    const { getState } = useAppStore;
    const panel = getState().panels[0];
    const d0 = panel.dancers[0];

    // Set up dancer with bent arm (elbow not on straight line from shoulder to hand)
    act(() =>
      getState().updateDancerState(panel.id, d0.id, {
        x: 0,
        y: 0,
        rightElbowPos: { x: 20, y: -30 }, // Elbow above straight line
        rightHandPos: { x: 60, y: 0 },
      }),
    );

    const originalDancer = getState().panels[0].dancers.find(
      (d) => d.id === d0.id,
    );
    const originalAngle = getElbowAngleFromStraight(originalDancer, 'right');

    // Create a lock with another dancer
    const d1 = panel.dancers[1];
    act(() => getState().updateDancerState(panel.id, d1.id, { x: 200, y: 0 }));

    act(() => getState().setSelectedPanel(panel.id));
    act(() => getState().setLockModeActive(true));
    act(() => getState().handleHandClick(panel.id, d0.id, 'right'));
    act(() => getState().handleHandClick(panel.id, d1.id, 'left'));
    act(() => getState().applySelectedLock(panel.id));

    // Move the hand to a different position
    act(() =>
      getState().updateHandPosition(panel.id, d0.id, 'right', { x: 80, y: 20 }),
    );

    const updatedDancer = getState().panels[0].dancers.find(
      (d) => d.id === d0.id,
    );
    const updatedAngle = getElbowAngleFromStraight(updatedDancer, 'right');

    // The elbow angle should be preserved (with reasonable tolerance)
    expect(Math.abs(updatedAngle - originalAngle)).toBeLessThan(0.5);
  });

  test('multiple locked hand groups maintain independent arm proportions', () => {
    const { getState } = useAppStore;
    const panel = getState().panels[0];

    // Assuming we have at least 4 dancers
    if (panel.dancers.length < 2) {
      // Add more dancers if needed
      act(() => getState().addDancer(panel.id));
      act(() => getState().addDancer(panel.id));
    }

    const dancers = getState().panels[0].dancers.slice(0, 2);
    const [d0, d1] = dancers;

    // Set up different arm configurations for each pair
    act(() =>
      getState().updateDancerState(panel.id, d0.id, {
        x: 0,
        y: 0,
        leftElbowPos: { x: -40, y: -10 },
        leftHandPos: { x: -70, y: -5 },
        rightElbowPos: { x: 50, y: -30 },
        rightHandPos: { x: 90, y: -20 },
      }),
    );
    act(() =>
      getState().updateDancerState(panel.id, d1.id, {
        x: 200,
        y: 0,
        leftElbowPos: { x: -50, y: -20 },
        leftHandPos: { x: -80, y: -35 },
        rightElbowPos: { x: 40, y: -15 },
        rightHandPos: { x: 65, y: -25 },
      }),
    );

    const originalD0 = getState().panels[0].dancers.find((d) => d.id === d0.id);
    const originalD1 = getState().panels[0].dancers.find((d) => d.id === d1.id);

    // Create first lock: d0.left with d1.left
    act(() => getState().setSelectedPanel(panel.id));
    act(() => getState().setLockModeActive(true));
    act(() => getState().handleHandClick(panel.id, d0.id, 'left'));
    act(() => getState().handleHandClick(panel.id, d1.id, 'left'));
    act(() => getState().applySelectedLock(panel.id));

    // Create second lock: d0.right with d1.right
    act(() => getState().setLockModeActive(true));
    act(() => getState().handleHandClick(panel.id, d0.id, 'right'));
    act(() => getState().handleHandClick(panel.id, d1.id, 'right'));
    act(() => getState().applySelectedLock(panel.id));

    // Move d0's body
    act(() => getState().updateDancerState(panel.id, d0.id, { x: 50, y: 25 }));

    const updatedState = getState().panels[0];
    const updatedD0 = updatedState.dancers.find((d) => d.id === d0.id);
    const updatedD1 = updatedState.dancers.find((d) => d.id === d1.id);

    // All arms should maintain their original proportions (with more tolerance for complex multi-lock scenarios)
    expectArmProportionsPreserved(originalD0, updatedD0, 'left', 0.3, 1.5);
    expectArmProportionsPreserved(originalD0, updatedD0, 'right', 0.3, 1.5);
    expectArmProportionsPreserved(originalD1, updatedD1, 'left', 0.3, 1.5);
    expectArmProportionsPreserved(originalD1, updatedD1, 'right', 0.3, 1.5);
  });

  test('extreme arm configurations are handled gracefully', () => {
    const { getState } = useAppStore;
    const panel = getState().panels[0];
    const d0 = panel.dancers[0];
    const d1 = panel.dancers[1];

    // Set up extreme configuration: very short upper arm, long lower arm
    act(() =>
      getState().updateDancerState(panel.id, d0.id, {
        x: 0,
        y: 0,
        leftElbowPos: { x: -32, y: 6 }, // Very close to shoulder
        leftHandPos: { x: -100, y: 50 }, // Far from elbow
      }),
    );
    act(() => getState().updateDancerState(panel.id, d1.id, { x: 300, y: 0 }));

    const originalDancer = getState().panels[0].dancers.find(
      (d) => d.id === d0.id,
    );

    // Lock hands
    act(() => getState().setSelectedPanel(panel.id));
    act(() => getState().setLockModeActive(true));
    act(() => getState().handleHandClick(panel.id, d0.id, 'left'));
    act(() => getState().handleHandClick(panel.id, d1.id, 'right'));
    act(() => getState().applySelectedLock(panel.id));

    // Move hand to trigger adjustment
    act(() =>
      getState().updateHandPosition(panel.id, d0.id, 'left', { x: -80, y: 30 }),
    );

    const updatedDancer = getState().panels[0].dancers.find(
      (d) => d.id === d0.id,
    );

    // Should handle extreme ratios without error
    expect(updatedDancer.leftElbowPos).toBeDefined();
    expect(typeof updatedDancer.leftElbowPos.x).toBe('number');
    expect(typeof updatedDancer.leftElbowPos.y).toBe('number');
    expect(isFinite(updatedDancer.leftElbowPos.x)).toBe(true);
    expect(isFinite(updatedDancer.leftElbowPos.y)).toBe(true);
  });
});
