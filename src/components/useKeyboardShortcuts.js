import { useEffect } from 'react';
import { useUndoRedo } from './useUndoRedo';

export const useKeyboardShortcuts = () => {
  const { undo, redo, canUndo, canRedo } = useUndoRedo();

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Check if Cmd (Mac) or Ctrl (Windows/Linux) is pressed
      const isCtrlOrCmd = event.metaKey || event.ctrlKey;

      if (!isCtrlOrCmd) return;

      // Prevent default browser behavior for these shortcuts
      if (event.key === 'z' || event.key === 'y') {
        event.preventDefault();
      }

      // Undo: Cmd/Ctrl + Z (without Shift)
      if (event.key === 'z' && !event.shiftKey && canUndo) {
        undo();
        return;
      }

      // Redo: Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y
      if (
        ((event.key === 'z' && event.shiftKey) || event.key === 'y') &&
        canRedo
      ) {
        redo();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo, canUndo, canRedo]);
};
