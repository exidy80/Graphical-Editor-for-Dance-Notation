import React from 'react';
import Toolbar from './components/Toolbar';
import PositionPanel from './components/PositionPanel';
import Sidebar from './components/Sidebar';
import AutoSaveManager from './components/AutoSaveManager';
import './App.css';
import { useAppStore } from './stores';
const AppContent = () => {
  const panelSize = useAppStore((state) => state.panelSize);

  /* Renders the components */
  return (
    <div className="App">
      <AutoSaveManager />
      <Sidebar />
      <div className="main-content">
        <Toolbar />
        <div
          className="position-panels"
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
