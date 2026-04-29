import {
  getCenterDeltaInParentSpace,
  getNodeVisualCenter,
  getStageDeltaInParentSpace,
  rotatePointAroundPivot,
} from './geometry.js';

const canvasNodeRegistry = new Map();

const makeRegistryKey = (panelId, itemType, itemId) =>
  `${panelId}:${itemType}:${itemId}`;

export const createKeystrokeActions = (get) => ({
  registerCanvasNode: (panelId, itemId, itemType, node) => {
    const key = makeRegistryKey(panelId, itemType, itemId);
    if (node) {
      canvasNodeRegistry.set(key, node);
    } else {
      canvasNodeRegistry.delete(key);
    }
  },

  getCanvasNode: (panelId, itemId, itemType) =>
    canvasNodeRegistry.get(makeRegistryKey(panelId, itemType, itemId)),

  _rotateItemToAbsoluteRotation: (item, targetRotation) => {
    const { updateDancerState, updateShapeState, panels, getCanvasNode } =
      get();

    const panel = panels.find((p) => p.id === item.panelId);
    if (!panel) return;

    const node = getCanvasNode(item.panelId, item.id, item.type);
    if (node) {
      // Get center before rotation change
      const beforeCenter = getNodeVisualCenter(node);
      // Set rotation to target value
      node.rotation(targetRotation);
      // Get center after rotation change
      const afterCenter = getNodeVisualCenter(node);
      // Calculate position delta to keep visual center in same place
      const parentSpaceDelta = getCenterDeltaInParentSpace(
        node,
        beforeCenter,
        afterCenter,
      );
      node.x(node.x() + parentSpaceDelta.x);
      node.y(node.y() + parentSpaceDelta.y);

      const nextState = {
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
      };

      if (item.type === 'dancer') {
        updateDancerState(item.panelId, item.id, nextState);
      } else if (item.type === 'shape') {
        updateShapeState(item.panelId, item.id, nextState);
      }
      return;
    }

    // No node, just update rotation directly
    if (item.type === 'dancer') {
      updateDancerState(item.panelId, item.id, {
        rotation: targetRotation,
      });
    } else if (item.type === 'shape') {
      updateShapeState(item.panelId, item.id, {
        rotation: targetRotation,
      });
    }
  },

  _rotateSelection: (degrees) => {
    const { selectedItems, panels } = get();
    if (!selectedItems.length) return;

    selectedItems.forEach((item) => {
      const panel = panels.find((p) => p.id === item.panelId);
      if (!panel) return;

      const object =
        item.type === 'dancer'
          ? panel.dancers.find((d) => d.id === item.id)
          : panel.shapes.find((s) => s.id === item.id);
      if (!object) return;

      const currentRotation = object.rotation || 0;
      const targetRotation = currentRotation + degrees;

      get()._rotateItemToAbsoluteRotation(item, targetRotation);
    });
  },

  _rotateSelectionAroundSharedCenter: (degrees) => {
    const {
      selectedItems,
      updateDancerState,
      updateShapeState,
      panels,
      getCanvasNode,
    } = get();
    if (!selectedItems.length) return;

    const selectionData = selectedItems
      .map((item) => {
        const panel = panels.find((p) => p.id === item.panelId);
        if (!panel) return null;

        const object =
          item.type === 'dancer'
            ? panel.dancers.find((d) => d.id === item.id)
            : panel.shapes.find((s) => s.id === item.id);
        if (!object) return null;

        const node = getCanvasNode(item.panelId, item.id, item.type);
        if (node) {
          const rect = node.getClientRect();
          return {
            item,
            object,
            node,
            center: {
              x: rect.x + rect.width / 2,
              y: rect.y + rect.height / 2,
            },
          };
        }

        const x = object.x || 0;
        const y = object.y || 0;
        return {
          item,
          object,
          node: null,
          center: { x, y },
        };
      })
      .filter(Boolean);

    if (!selectionData.length) return;

    const totalCenter = selectionData.reduce(
      (acc, entry) => ({
        x: acc.x + entry.center.x,
        y: acc.y + entry.center.y,
      }),
      { x: 0, y: 0 },
    );
    const pivot = {
      x: totalCenter.x / selectionData.length,
      y: totalCenter.y / selectionData.length,
    };

    selectionData.forEach(({ item, object, node, center }) => {
      const nextCenter = rotatePointAroundPivot(center, pivot, degrees);

      if (node) {
        const beforeCenter = getNodeVisualCenter(node);
        node.rotation((node.rotation() || 0) + degrees);
        const afterRotationCenter = getNodeVisualCenter(node);
        const centerPreserveDelta = getCenterDeltaInParentSpace(
          node,
          beforeCenter,
          afterRotationCenter,
        );
        node.x(node.x() + centerPreserveDelta.x);
        node.y(node.y() + centerPreserveDelta.y);

        const orbitDelta = getStageDeltaInParentSpace(
          node,
          beforeCenter,
          nextCenter,
        );
        node.x(node.x() + orbitDelta.x);
        node.y(node.y() + orbitDelta.y);

        const nextState = {
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
        };

        if (item.type === 'dancer') {
          updateDancerState(item.panelId, item.id, nextState);
        } else if (item.type === 'shape') {
          updateShapeState(item.panelId, item.id, nextState);
        }
        return;
      }

      const nextState = {
        x: (object.x || 0) + (nextCenter.x - center.x),
        y: (object.y || 0) + (nextCenter.y - center.y),
        rotation: (object.rotation || 0) + degrees,
      };

      if (item.type === 'dancer') {
        updateDancerState(item.panelId, item.id, nextState);
      } else if (item.type === 'shape') {
        updateShapeState(item.panelId, item.id, nextState);
      }
    });
  },

  _rotateSelectionToAbsoluteRotation: (targetRotation) => {
    const { selectedItems } = get();
    if (!selectedItems.length) return;

    selectedItems.forEach((item) => {
      get()._rotateItemToAbsoluteRotation(item, targetRotation);
    });
  },

  _nudgeSelection: (dx, dy) => {
    const { selectedItems, updateDancerState, updateShapeState, panels } =
      get();
    if (!selectedItems.length) return;

    selectedItems.forEach((item) => {
      const panel = panels.find((p) => p.id === item.panelId);
      if (!panel) return;

      if (item.type === 'dancer') {
        const dancer = panel.dancers.find((d) => d.id === item.id);
        if (!dancer) return;
        updateDancerState(item.panelId, item.id, {
          x: (dancer.x || 0) + dx,
          y: (dancer.y || 0) + dy,
        });
      } else if (item.type === 'shape') {
        const shape = panel.shapes.find((s) => s.id === item.id);
        if (!shape) return;
        updateShapeState(item.panelId, item.id, {
          x: (shape.x || 0) + dx,
          y: (shape.y || 0) + dy,
        });
      }
    });
  },
});
