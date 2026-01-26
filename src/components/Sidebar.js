import React, { useState } from 'react';
import { useAppStore } from '../stores';
import { footworkTabConfig } from './FootworkTab';
import { movementTabConfig } from './MovementTab';
import { signalsTabConfig } from './SignalsTab';

const Sidebar = () => {
  // Get state and handlers from store
  const handleShapeDraw = useAppStore((state) => state.handleShapeDraw);
  const selectedPanel = useAppStore((state) => state.selectedPanel);

  // Local state for active tab
  const [activeTab, setActiveTab] = useState(movementTabConfig.key);

  // Tab configurations - each tab is now self-contained
  const tabs = [movementTabConfig, signalsTabConfig, footworkTabConfig];

  // Find the active tab config
  const activeTabConfig = tabs.find((tab) => tab.key === activeTab);

  return (
    <div
      style={{
        width: '280px',
        height: '100vh',
        backgroundColor: '#f5f5f5',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #ddd',
      }}
    >
      {/* Tab Headers */}
      <div
        style={{
          display: 'flex',
          borderBottom: '2px solid #ddd',
          backgroundColor: '#fff',
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1,
              padding: '15px 10px',
              backgroundColor: activeTab === tab.key ? '#fff' : '#e9ecef',
              border: 'none',
              borderBottom:
                activeTab === tab.key
                  ? '3px solid #007bff'
                  : '3px solid transparent',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === tab.key ? 'bold' : 'normal',
              color: activeTab === tab.key ? '#007bff' : '#666',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.2s',
            }}
          >
            <span style={{ fontSize: '18px' }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div
        style={{
          flex: 1,
          padding: '20px',
          overflowY: 'auto',
          backgroundColor: '#E2E2E2',
        }}
      >
        {activeTabConfig && (
          <activeTabConfig.component
            selectedPanel={selectedPanel}
            handleShapeDraw={handleShapeDraw}
          />
        )}
      </div>
    </div>
  );
};

export default Sidebar;
