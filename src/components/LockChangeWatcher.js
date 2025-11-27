import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../stores';

// Minimal watcher: compare lock arrays per panel, flash added/removed locks.
// Assumes undo/redo affects only the panels array; we diff shallowly.
const LockChangeWatcher = () => {
  const panels = useAppStore((s) => s.panels);
  const queueHandFlash = useAppStore((s) => s.queueHandFlash);
  const prevRef = useRef(null);

  useEffect(() => {
    if (!panels) return;
    if (!prevRef.current) {
      prevRef.current = panels.map((p) => ({
        id: p.id,
        locks: (p.locks || []).map((l) => ({
          id: l.id,
          members: l.members || [],
        })),
      }));
      return;
    }

    const prevPanels = prevRef.current;
    panels.forEach((panel) => {
      const prevPanel = prevPanels.find((pp) => pp.id === panel.id);
      if (!prevPanel) return;
      const currLocks = panel.locks || [];
      const prevLocks = prevPanel.locks || [];
      // Fast path: same reference and same length—skip
      if (prevLocks === currLocks && prevLocks.length === currLocks.length) {
        return;
      }
      const prevById = new Map(prevLocks.map((l) => [l.id, l]));
      const currById = new Map(currLocks.map((l) => [l.id, l]));

      // Added locks
      currById.forEach((lock, id) => {
        if (!prevById.has(id)) {
          queueHandFlash(panel.id, lock.members || []);
        } else {
          const prevLock = prevById.get(id);
          // Membership change
          if (
            JSON.stringify(prevLock.members) !== JSON.stringify(lock.members)
          ) {
            queueHandFlash(panel.id, lock.members || []);
          }
        }
      });
      // Removed locks
      prevById.forEach((lock, id) => {
        if (!currById.has(id)) {
          queueHandFlash(panel.id, lock.members || []);
        }
      });
    });

    // Store new snapshot
    prevRef.current = panels.map((p) => ({
      id: p.id,
      locks: (p.locks || []).map((l) => ({
        id: l.id,
        members: l.members || [],
      })),
    }));
  }, [panels, queueHandFlash]);

  return null;
};

export default LockChangeWatcher;
