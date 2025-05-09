import { act } from 'react';
import { useStore } from 'app-store';

const getCurrentState = () => JSON.parse(JSON.stringify(useStore.getState()));

describe('app-store integrity and edge cases', () => {
  beforeEach(() => {
    useStore.setState(useStore.getInitialState());
  });

  it('clonePanel creates independent dancer objects', () => {
    const state = getCurrentState();
    const panelId = state.panels.allIds[0];
    const originalDancerId = state.panels.byId[panelId].dancers[0];

    act(() => useStore.getState().clonePanel(panelId));

    const newState = useStore.getState();
    const newPanelId = newState.panels.allIds.find((id) => id !== panelId);
    const clonedDancerId = newState.panels.byId[newPanelId].dancers[0];

    expect(clonedDancerId).not.toBe(originalDancerId);

    // mutate one, ensure the other doesn't change
    act(() =>
      useStore.getState().updatePanelState(panelId, (panel) => {
        const dancer = newState.dancers.byId[originalDancerId];
        newState.dancers.byId[originalDancerId] = { ...dancer, x: 999 };
        return panel;
      }),
    );

    expect(newState.dancers.byId[clonedDancerId].x).not.toBe(999);
  });

  it('removePanel clears invalid selectedDancer/Shape references', () => {
    const state = getCurrentState();
    const panelId = state.panels.allIds[0];
    const dancerId = state.panels.byId[panelId].dancers[0];
    const shapeId = state.panels.byId[panelId].shapes[0];

    act(() =>
      useStore.setState({
        selectedPanelId: panelId,
        selectedDancer: { dancerId, panelId },
        selectedShape: { shapeId, panelId },
      }),
    );

    act(() => useStore.getState().removePanel(panelId));

    const newState = useStore.getState();
    expect(newState.selectedPanelId).toBe(null);
    expect(newState.selectedDancer).toBe(null);
    expect(newState.selectedShape).toBe(null);
  });

  it('removing malformed panel does not crash', () => {
    const malformedPanel = {
      id: 'malformed',
      dancers: ['nonexistent'],
      shapes: ['alsoFake'],
    };
    act(() =>
      useStore.setState((state) => ({
        panels: {
          byId: { ...state.panels.byId, malformed: malformedPanel },
          allIds: [...state.panels.allIds, 'malformed'],
        },
      })),
    );

    act(() => useStore.getState().removePanel('malformed'));

    const newState = useStore.getState();
    expect(newState.panels.byId['malformed']).toBeUndefined();
    expect(newState.panels.allIds.includes('malformed')).toBe(false);
  });

  it('clonePanel does not retain original object references', () => {
    const state = getCurrentState();
    const panelId = state.panels.allIds[0];
    const originalDancer = state.panels.byId[panelId].dancers[0];

    act(() => useStore.getState().clonePanel(panelId));
    const newState = useStore.getState();

    const clonedPanelId = newState.panels.allIds.find((id) => id !== panelId);
    const clonedDancerId = newState.panels.byId[clonedPanelId].dancers[0];

    expect(clonedDancerId).not.toBe(originalDancer);
    expect(newState.dancers.byId[clonedDancerId]).not.toBe(
      newState.dancers.byId[originalDancer],
    );
  });

  it('panels.allIds remains consistent after movePanel', () => {
    act(() => {
      useStore.getState().addPanel();
      useStore.getState().addPanel();
    });

    const state = getCurrentState();
    const ids = [...state.panels.allIds];
    act(() => useStore.getState().movePanel(ids[0], ids[2]));

    const newIds = useStore.getState().panels.allIds;
    const hasAll = ids.every((id) => newIds.includes(id));
    expect(hasAll).toBe(true);
    expect(newIds.length).toBe(ids.length);
  });
});
