export const initializeDefaultKeystrokes = (get, api, set) => {
  const { registerKeystroke } = get();
  const objectContexts = ['dancer', 'shape'];

  const registerForObjectContexts = (key, configFactory) => {
    objectContexts.forEach((context) => {
      registerKeystroke(key, {
        ...configFactory(context),
        context,
      });
    });
  };

  const registerDancerColorShortcut = (key, colour, fallbackIndex) => {
    registerKeystroke(key, {
      description: `Select ${colour} dancer in current panel`,
      handler: () => {
        const { selectedPanel, panels, handleDancerSelection } = get();
        if (!selectedPanel) return;

        const panel = panels.find((p) => p.id === selectedPanel);
        if (!panel || panel.dancers.length <= fallbackIndex) return;

        const dancer =
          panel.dancers.find((d) => d.colour === colour) ||
          panel.dancers[fallbackIndex];
        if (!dancer) return;

        handleDancerSelection(selectedPanel, dancer.id);
      },
      context: 'global',
      priority: 1,
    });
  };

  registerForObjectContexts('ArrowLeft', () => ({
    description: 'Rotate selection counter-clockwise',
    handler: (event) => {
      const { rotationStep, fineRotationStep } = get();
      const step = event.shiftKey ? fineRotationStep : rotationStep;
      get()._rotateSelection(-step);
    },
    priority: 1,
  }));

  registerForObjectContexts('ArrowRight', () => ({
    description: 'Rotate selection clockwise',
    handler: (event) => {
      const { rotationStep, fineRotationStep } = get();
      const step = event.shiftKey ? fineRotationStep : rotationStep;
      get()._rotateSelection(step);
    },
    priority: 1,
  }));

  registerForObjectContexts('ArrowLeft', () => ({
    description:
      'Rotate multi-selection counter-clockwise around shared center',
    handler: () => {
      const { rotationStep } = get();
      get()._rotateSelectionAroundSharedCenter(-rotationStep);
    },
    modifiers: { alt: true },
    priority: 4,
  }));

  registerForObjectContexts('ArrowRight', () => ({
    description: 'Rotate multi-selection clockwise around shared center',
    handler: () => {
      const { rotationStep } = get();
      get()._rotateSelectionAroundSharedCenter(rotationStep);
    },
    modifiers: { alt: true },
    priority: 4,
  }));

  registerForObjectContexts('ArrowLeft', () => ({
    description:
      'Fine rotate multi-selection counter-clockwise around shared center',
    handler: () => {
      const { fineRotationStep } = get();
      get()._rotateSelectionAroundSharedCenter(-fineRotationStep);
    },
    modifiers: { alt: true, shift: true },
    priority: 5,
  }));

  registerForObjectContexts('ArrowRight', () => ({
    description: 'Fine rotate multi-selection clockwise around shared center',
    handler: () => {
      const { fineRotationStep } = get();
      get()._rotateSelectionAroundSharedCenter(fineRotationStep);
    },
    modifiers: { alt: true, shift: true },
    priority: 5,
  }));

  registerForObjectContexts('ArrowLeft', () => ({
    description: 'Fine rotate selection counter-clockwise',
    handler: () => {
      const { fineRotationStep } = get();
      get()._rotateSelection(-fineRotationStep);
    },
    modifiers: { shift: true },
    priority: 2,
  }));

  registerForObjectContexts('ArrowRight', () => ({
    description: 'Fine rotate selection clockwise',
    handler: () => {
      const { fineRotationStep } = get();
      get()._rotateSelection(fineRotationStep);
    },
    modifiers: { shift: true },
    priority: 2,
  }));

  registerForObjectContexts('ArrowLeft', () => ({
    description: 'Nudge selection left by 1px',
    handler: () => {
      get()._nudgeSelection(-1, 0);
    },
    modifiers: { ctrl: true },
    priority: 3,
  }));

  registerForObjectContexts('ArrowRight', () => ({
    description: 'Nudge selection right by 1px',
    handler: () => {
      get()._nudgeSelection(1, 0);
    },
    modifiers: { ctrl: true },
    priority: 3,
  }));

  registerForObjectContexts('ArrowUp', () => ({
    description: 'Nudge selection up by 1px',
    handler: () => {
      get()._nudgeSelection(0, -1);
    },
    modifiers: { ctrl: true },
    priority: 3,
  }));

  registerForObjectContexts('ArrowDown', () => ({
    description: 'Nudge selection down by 1px',
    handler: () => {
      get()._nudgeSelection(0, 1);
    },
    modifiers: { ctrl: true },
    priority: 3,
  }));

  const deleteKeyConfig = {
    description: 'Delete selected symbol(s)',
    handler: () => {
      console.log('Delete key pressed - deleting selected shapes');
      get().handleDeleteSelectedShapes();
    },
    context: 'global',
    priority: 1,
  };

  registerKeystroke('Delete', deleteKeyConfig);
  registerKeystroke('Backspace', deleteKeyConfig);

  registerKeystroke('Escape', {
    description: 'Deselect all objects',
    handler: () => {
      const { symbolPlacement, cancelSymbolPlacement } = get();
      if (symbolPlacement?.active) {
        cancelSymbolPlacement();
        return;
      }
      set({
        selectedItems: [],
        selectedHand: null,
      });
    },
    context: 'global',
    priority: 1,
  });

  registerKeystroke('r', {
    description: 'Reset rotation to starting position',
    handler: () => {
      const { selectedItems, panels, _rotateSelectionToAbsoluteRotation } =
        get();
      if (!selectedItems.length) return;

      selectedItems.forEach((item) => {
        const panel = panels.find((p) => p.id === item.panelId);
        if (!panel) return;

        if (item.type === 'dancer') {
          const dancer = panel.dancers.find((d) => d.id === item.id);
          if (!dancer) return;
          const originalRotation = dancer.colour === 'red' ? 180 : 0;
          // Use _rotateSelectionToAbsoluteRotation to preserve visual center
          _rotateSelectionToAbsoluteRotation(originalRotation);
        } else if (item.type === 'shape') {
          // Use _rotateSelectionToAbsoluteRotation to preserve visual center
          _rotateSelectionToAbsoluteRotation(0);
        }
      });
    },
    context: 'global',
    priority: 1,
  });

  registerKeystroke('z', {
    description: 'Undo last action',
    handler: () => {
      const temporalStore = api?.temporal;
      if (!temporalStore) {
        console.warn('Undo failed: temporal store not available');
        return;
      }
      const temporalState = temporalStore.getState();
      if (temporalState.pastStates.length > 0) {
        temporalState.undo();
        console.log('Undo performed');
      } else {
        console.log('Nothing to undo');
      }
    },
    context: 'global',
    modifiers: { ctrl: true },
    priority: 1,
  });

  registerKeystroke('y', {
    description: 'Redo last undone action',
    handler: () => {
      const temporalStore = api?.temporal;
      if (!temporalStore) {
        console.warn('Redo failed: temporal store not available');
        return;
      }
      const temporalState = temporalStore.getState();
      if (temporalState.futureStates.length > 0) {
        temporalState.redo();
        console.log('Redo performed');
      } else {
        console.log('Nothing to redo');
      }
    },
    context: 'global',
    modifiers: { ctrl: true },
    priority: 1,
  });

  registerKeystroke('s', {
    description: 'Save file',
    handler: () => {
      const { triggerSave } = get();
      if (triggerSave) {
        triggerSave();
      } else {
        console.warn('Save handler not available');
      }
    },
    context: 'global',
    modifiers: { ctrl: true },
    priority: 1,
  });

  registerKeystroke('s', {
    description: 'Save file as...',
    handler: () => {
      const { triggerSaveAs } = get();
      if (triggerSaveAs) {
        triggerSaveAs();
      } else {
        console.warn('Save As handler not available');
      }
    },
    context: 'global',
    modifiers: { ctrl: true, shift: true },
    priority: 2,
  });

  registerKeystroke('o', {
    description: 'Open file',
    handler: () => {
      const { triggerOpen } = get();
      if (triggerOpen) {
        triggerOpen();
      } else {
        console.warn('Open handler not available');
      }
    },
    context: 'global',
    modifiers: { ctrl: true },
    priority: 1,
  });

  registerDancerColorShortcut('w', 'red', 0);
  registerDancerColorShortcut('f', 'red', 0);
  registerDancerColorShortcut('m', 'blue', 1);

  registerKeystroke('c', {
    description: 'Copy selected objects',
    handler: () => {
      get().copySelection();
    },
    context: 'global',
    modifiers: { ctrl: true },
    priority: 1,
  });

  registerKeystroke('v', {
    description: 'Paste copied objects into current panel',
    handler: () => {
      get().pasteClipboard();
    },
    context: 'global',
    modifiers: { ctrl: true },
    priority: 1,
  });
  registerDancerColorShortcut('l', 'blue', 1);
};
