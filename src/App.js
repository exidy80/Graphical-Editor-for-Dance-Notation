import React from 'react';
import Toolbar from './components/Toolbar';
import PositionPanel from './components/PositionPanel';
import Sidebar from './components/Sidebar';
import './App.css';
import { AppProvider } from './components/AppContext';
const App = () => {
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
          <div className="position-panels">
            <PositionPanel />
          </div>
        </div>
      </div>
    </AppProvider>
  );
};

export default App;
