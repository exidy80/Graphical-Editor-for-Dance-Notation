import { useEffect } from 'react';
import { useAppStore } from '../stores';

/**
 * KeystrokeHandler Component
 *
 * Manages global keyboard event handling for the application.
 * This component:
 * - Initializes default keystrokes when mounted
 * - Sets up global keyboard event listeners
 * - Filters out keystrokes from input elements
 * - Handles keystroke execution and context detection
 * - Cleans up event listeners when unmounted
 */
const KeystrokeHandler = () => {
  // Keystroke functionality from store
  const handleKeystroke = useAppStore((state) => state.handleKeystroke);
  const initializeDefaultKeystrokes = useAppStore(
    (state) => state.initializeDefaultKeystrokes,
  );

  // Initialize default keystrokes when component mounts
  useEffect(() => {
    initializeDefaultKeystrokes();
  }, [initializeDefaultKeystrokes]);

  // Handle keyboard events at app level
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Don't interfere with input elements
      if (
        event.target.tagName === 'INPUT' ||
        event.target.tagName === 'TEXTAREA' ||
        event.target.contentEditable === 'true'
      ) {
        return;
      }

      // Handle the keystroke
      handleKeystroke(event.key, event);
    };

    // Add event listener to the document for global key capture
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup on unmount
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeystroke]);

  // This component renders nothing - it's purely for side effects
  return null;
};

export default KeystrokeHandler;
