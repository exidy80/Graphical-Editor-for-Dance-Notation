import { useEffect } from 'react';
import { useAppStore } from '../stores';

const AutoSaveManager = () => {
  const hasUnsavedChanges = useAppStore((state) => state.hasUnsavedChanges);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue =
          'You have unsaved changes. Are you sure you want to leave?';
        return 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && hasUnsavedChanges) {
        // Force an immediate auto-save when the user navigates away or minimizes
        const state = useAppStore.getState();
        const saveData = {
          panels: state.panels,
          panelSize: state.panelSize,
        };

        try {
          const saveDataJson = JSON.stringify({
            timestamp: Date.now(),
            data: saveData,
          });
          localStorage.setItem('dance-notation-autosave', saveDataJson);
          console.log('Emergency auto-save completed');
        } catch (error) {
          console.warn('Emergency auto-save failed:', error);
        }
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Show recovery notification if we restored from auto-save
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.has('restored')) {
      const savedData = localStorage.getItem('dance-notation-autosave');
      if (savedData) {
        try {
          const { timestamp } = JSON.parse(savedData);
          const hoursSince = (Date.now() - timestamp) / (1000 * 60 * 60);

          if (hoursSince < 24) {
            // Show a subtle notification that work was restored
            const notification = document.createElement('div');
            notification.innerHTML = `
              <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: #4CAF50;
                color: white;
                padding: 12px 20px;
                border-radius: 4px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                z-index: 1000;
                font-family: Arial, sans-serif;
                font-size: 14px;
              ">
                ✓ Work restored from auto-save (${Math.round(
                  hoursSince * 60,
                )} minutes ago)
                <button 
                  onclick="this.parentElement.parentElement.remove(); localStorage.removeItem('dance-notation-autosave');"
                  style="
                    background: none;
                    border: none;
                    color: white;
                    margin-left: 10px;
                    cursor: pointer;
                    font-size: 16px;
                  "
                >×</button>
              </div>
            `;
            document.body.appendChild(notification);

            // Auto-remove after 5 seconds
            setTimeout(() => {
              if (notification.parentElement) {
                notification.remove();
              }
            }, 5000);

            // Update URL to prevent showing again on refresh
            const newUrl = new URL(window.location);
            newUrl.searchParams.set('restored', 'true');
            window.history.replaceState({}, '', newUrl);
          }
        } catch (error) {
          console.warn('Failed to check auto-save notification:', error);
        }
      }
    }

    // Cleanup function
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [hasUnsavedChanges]);

  // This component doesn't render anything
  return null;
};

export default AutoSaveManager;
