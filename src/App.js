import React, { useEffect } from 'react';
import Toolbar from './components/Toolbar';
import PositionPanel from './components/PositionPanel';
import Sidebar from './components/Sidebar';
import AutoSaveManager from './components/AutoSaveManager';
import KeystrokeHandler from './components/KeystrokeHandler';
import './App.css';
import { useAppStore } from './stores';
const AppContent = () => {
  const panelSize = useAppStore((state) => state.panelSize);
  const panels = useAppStore((state) => state.panels);
  const selectedPanel = useAppStore((state) => state.selectedPanel);
  const setSelectedPanel = useAppStore((state) => state.setSelectedPanel);

  useEffect(() => {
    document.title = 'DanceMarks';
  }, []);

  // Auto-select first panel on startup if no panel is selected
  useEffect(() => {
    if (panels.length > 0 && selectedPanel === null) {
      setSelectedPanel(panels[0].id);
    }
  }, [panels, selectedPanel, setSelectedPanel]);

  /* Renders the components */
  return (
    <div className="App">
      <KeystrokeHandler />
      <AutoSaveManager />
      <Sidebar />
      <div className="main-content">
        <Toolbar />
        <div
          className="position-panel-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fill, minmax(${panelSize.width}px, 1fr))`, // Responsive grid
            gap: '10px',
            padding: '10px',
            overflowY: 'auto', // Makes new panels render underneath if there is no space
          }}
        >
          <PositionPanel />
        </div>
      </div>
    </div>
  );
};

function App() {
  return <AppContent />;
}

export default App;
