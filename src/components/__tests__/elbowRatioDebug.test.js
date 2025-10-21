import { act } from '@testing-library/react';
import { useAppStore } from '../../stores';
import {
  getSegmentLength,
  getShoulderPosition,
} from '../../stores/armAdjustment.js';

describe('Elbow Position Ratio Preservation', () => {
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
        leftHandPos: { x: -60, y: 0 },
        rightHandPos: { x: 60, y: 0 },
        leftElbowPos: { x: -45, y: -12 },
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

  // Helper function for calculating elbow position ratio along arm
  const getElbowRatioAlongArm = (dancer, side) => {
    const shoulder = getShoulderPosition(side);
    const elbow = dancer[`${side}ElbowPos`];
    const hand = dancer[`${side}HandPos`];

    const upperLength = getSegmentLength(shoulder, elbow);
    const totalLength = getSegmentLength(shoulder, hand);

    return upperLength / totalLength;
  };

  test('elbow maintains its position ratio along the arm when hands are locked and moved', () => {
    const { getState } = useAppStore;
    const panel = getState().panels[0];
    const d0 = panel.dancers[0];
    const d1 = panel.dancers[1];

    // Set up specific arm configuration with clear ratios
    act(() =>
      getState().updateDancerState(panel.id, d0.id, {
        x: 0,
        y: 0,
        leftElbowPos: { x: -20, y: -10 }, // Upper arm length ≈ 22.4
        leftHandPos: { x: -60, y: -30 }, // Total arm length ≈ 67.1, so ratio should be ~0.33
      }),
    );

    act(() =>
      getState().updateDancerState(panel.id, d1.id, {
        x: 100,
        y: 0,
        rightElbowPos: { x: 40, y: -5 }, // Different configuration
        rightHandPos: { x: 80, y: -15 },
      }),
    );

    // Calculate original elbow ratios
    const originalD0 = getState().panels[0].dancers.find((d) => d.id === d0.id);
    const originalD1 = getState().panels[0].dancers.find((d) => d.id === d1.id);

    const originalRatioD0 = getElbowRatioAlongArm(originalD0, 'left');
    const originalRatioD1 = getElbowRatioAlongArm(originalD1, 'right');

    console.log('Original d0 left arm:');
    console.log('  Shoulder:', getShoulderPosition('left'));
    console.log('  Elbow:', originalD0.leftElbowPos);
    console.log('  Hand:', originalD0.leftHandPos);
    console.log('  Elbow ratio along arm:', originalRatioD0);

    console.log('Original d1 right arm:');
    console.log('  Shoulder:', getShoulderPosition('right'));
    console.log('  Elbow:', originalD1.rightElbowPos);
    console.log('  Hand:', originalD1.rightHandPos);
    console.log('  Elbow ratio along arm:', originalRatioD1);

    // Lock the hands
    act(() => getState().setSelectedPanel(panel.id));
    act(() => getState().setLockModeActive(true));
    act(() => getState().handleHandClick(panel.id, d0.id, 'left'));
    act(() => getState().handleHandClick(panel.id, d1.id, 'right'));
    act(() => getState().applySelectedLock(panel.id));

    // Move one hand to a significantly different position
    act(() =>
      getState().updateHandPosition(panel.id, d0.id, 'left', {
        x: -40,
        y: -50,
      }),
    );

    const updatedState = getState().panels[0];
    const updatedD0 = updatedState.dancers.find((d) => d.id === d0.id);
    const updatedD1 = updatedState.dancers.find((d) => d.id === d1.id);

    const updatedRatioD0 = getElbowRatioAlongArm(updatedD0, 'left');
    const updatedRatioD1 = getElbowRatioAlongArm(updatedD1, 'right');

    console.log('Updated d0 left arm:');
    console.log('  Shoulder:', getShoulderPosition('left'));
    console.log('  Elbow:', updatedD0.leftElbowPos);
    console.log('  Hand:', updatedD0.leftHandPos);
    console.log('  Elbow ratio along arm:', updatedRatioD0);

    console.log('Updated d1 right arm:');
    console.log('  Shoulder:', getShoulderPosition('right'));
    console.log('  Elbow:', updatedD1.rightElbowPos);
    console.log('  Hand:', updatedD1.rightHandPos);
    console.log('  Elbow ratio along arm:', updatedRatioD1);

    // The elbow should maintain its relative position along the arm
    expect(Math.abs(updatedRatioD0 - originalRatioD0)).toBeLessThan(0.1);
    expect(Math.abs(updatedRatioD1 - originalRatioD1)).toBeLessThan(0.1);

    // Additional check: make sure elbows actually moved (not just staying in place)
    const elbowMovedD0 =
      Math.sqrt(
        Math.pow(updatedD0.leftElbowPos.x - originalD0.leftElbowPos.x, 2) +
          Math.pow(updatedD0.leftElbowPos.y - originalD0.leftElbowPos.y, 2),
      ) > 1;

    const elbowMovedD1 =
      Math.sqrt(
        Math.pow(updatedD1.rightElbowPos.x - originalD1.rightElbowPos.x, 2) +
          Math.pow(updatedD1.rightElbowPos.y - originalD1.rightElbowPos.y, 2),
      ) > 1;

    expect(elbowMovedD0).toBe(true);
    expect(elbowMovedD1).toBe(true);
  });

  test('visual debug: examine what actually happens to arm segments', () => {
    const { getState } = useAppStore;
    const panel = getState().panels[0];
    const d0 = panel.dancers[0];

    // Set up a simple, clear configuration
    act(() =>
      getState().updateDancerState(panel.id, d0.id, {
        x: 0,
        y: 0,
        leftElbowPos: { x: -40, y: -20 },
        leftHandPos: { x: -80, y: -40 },
      }),
    );

    const originalDancer = getState().panels[0].dancers.find(
      (d) => d.id === d0.id,
    );
    const shoulder = getShoulderPosition('left');

    const originalUpperLength = getSegmentLength(
      shoulder,
      originalDancer.leftElbowPos,
    );
    const originalLowerLength = getSegmentLength(
      originalDancer.leftElbowPos,
      originalDancer.leftHandPos,
    );
    const originalTotalLength = getSegmentLength(
      shoulder,
      originalDancer.leftHandPos,
    );

    console.log('=== BEFORE HAND MOVEMENT ===');
    console.log('Shoulder:', shoulder);
    console.log('Elbow:', originalDancer.leftElbowPos);
    console.log('Hand:', originalDancer.leftHandPos);
    console.log('Upper arm length:', originalUpperLength);
    console.log('Lower arm length:', originalLowerLength);
    console.log('Total arm length (straight):', originalTotalLength);
    console.log(
      'Elbow ratio along arm:',
      originalUpperLength / originalTotalLength,
    );

    // Create a simple lock with another dancer
    const d1 = panel.dancers[1];
    act(() => getState().updateDancerState(panel.id, d1.id, { x: 200, y: 0 }));

    act(() => getState().setSelectedPanel(panel.id));
    act(() => getState().setLockModeActive(true));
    act(() => getState().handleHandClick(panel.id, d0.id, 'left'));
    act(() => getState().handleHandClick(panel.id, d1.id, 'right'));
    act(() => getState().applySelectedLock(panel.id));

    // Move the hand to a new position
    act(() =>
      getState().updateHandPosition(panel.id, d0.id, 'left', {
        x: -60,
        y: -60,
      }),
    );

    const updatedDancer = getState().panels[0].dancers.find(
      (d) => d.id === d0.id,
    );

    const updatedUpperLength = getSegmentLength(
      shoulder,
      updatedDancer.leftElbowPos,
    );
    const updatedLowerLength = getSegmentLength(
      updatedDancer.leftElbowPos,
      updatedDancer.leftHandPos,
    );
    const updatedTotalLength = getSegmentLength(
      shoulder,
      updatedDancer.leftHandPos,
    );

    console.log('=== AFTER HAND MOVEMENT ===');
    console.log('Shoulder:', shoulder);
    console.log('Elbow:', updatedDancer.leftElbowPos);
    console.log('Hand:', updatedDancer.leftHandPos);
    console.log('Upper arm length:', updatedUpperLength);
    console.log('Lower arm length:', updatedLowerLength);
    console.log('Total arm length (straight):', updatedTotalLength);
    console.log(
      'Elbow ratio along arm:',
      updatedUpperLength / updatedTotalLength,
    );

    console.log('=== CHANGES ===');
    console.log(
      'Upper arm length change:',
      updatedUpperLength - originalUpperLength,
    );
    console.log(
      'Lower arm length change:',
      updatedLowerLength - originalLowerLength,
    );
    console.log(
      'Total arm length change:',
      updatedTotalLength - originalTotalLength,
    );
    console.log(
      'Elbow ratio change:',
      updatedUpperLength / updatedTotalLength -
        originalUpperLength / originalTotalLength,
    );

    // This test is just for debugging - we expect it to show the problem
    expect(true).toBe(true);
  });
});
