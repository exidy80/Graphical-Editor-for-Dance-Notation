import React from 'react';
import Toolbar from './components/Toolbar';
import PositionPanel from './components/PositionPanel';
import Sidebar from './components/Sidebar';
import './App.css';
import { AppProvider } from './components/AppContext';
import { useGlobalSettings } from 'app-store';
const App = () => {
  const { panelSize } = useGlobalSettings();

  /* Renders the components.
  The AppProvider will go once I convert all the components
  to use the app-store.
  */
  return (
    <AppProvider>
      <div className="App">
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
    </AppProvider>
  );
};

export default App;
