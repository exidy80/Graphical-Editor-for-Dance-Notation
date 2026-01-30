import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faLockOpen } from '@fortawesome/free-solid-svg-icons';
import bringToFrontImg from './images/bring-to-front.png';
import sendToBackImg from './images/send-to-back.png';

const LayerControl = () => (
  <div
    style={{
      backgroundColor: '#fff',
      borderTop: '2px solid #ddd',
      padding: '15px',
    }}
  >
    <h3
      style={{
        margin: '0 0 12px 0',
        fontSize: '16px',
        fontWeight: 'bold',
      }}
    >
      Layers
    </h3>
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '8px',
      }}
    >
      {/* Column headers */}
      {['Body', 'Movement', 'Signals', 'Feet', 'Location'].map((label) => (
        <div
          key={label}
          style={{
            fontSize: '14px',
            textAlign: 'center',
            fontWeight: '500',
            marginBottom: '4px',
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            transform: 'rotate(180deg)',
            height: '70px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {label}
        </div>
      ))}
      {/* Bring to front buttons */}
      {[...Array(5)].map((_, i) => (
        <button
          key={`front-${i}`}
          style={{
            padding: '5px',
            border: '2px solid #333',
            borderRadius: '4px',
            backgroundColor: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
          }}
          title="Bring to front"
        >
          <img
            src={bringToFrontImg}
            alt="Bring to front"
            style={{ width: 28, height: 28 }}
          />
        </button>
      ))}
      {/* Send to back buttons */}
      {[...Array(5)].map((_, i) => (
        <button
          key={`back-${i}`}
          style={{
            padding: '5px',
            border: '2px solid #333',
            borderRadius: '4px',
            backgroundColor: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
          }}
          title="Send to back"
        >
          <img
            src={sendToBackImg}
            alt="Send to back"
            style={{ width: 28, height: 28 }}
          />
        </button>
      ))}
      {/* Lock/Unlock toggles */}
      {[...Array(5)].map((_, i) => (
        <button
          key={`lock-${i}`}
          style={{
            width: '38px',
            height: '38px',
            border: '2px solid #333',
            borderRadius: '4px',
            backgroundColor: i >= 3 ? '#999' : '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            padding: 0,
          }}
          title={i >= 3 ? 'Locked' : 'Unlocked'}
        >
          <FontAwesomeIcon icon={i >= 3 ? faLock : faLockOpen} />
        </button>
      ))}
    </div>
  </div>
);

export default LayerControl;
