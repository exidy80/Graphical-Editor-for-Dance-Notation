import { v4 as uuidv4 } from 'uuid';

export const addEntities = (existing, newEntities) => {
  const byId = { ...existing.byId };
  const allIds = [...existing.allIds];

  for (const entity of newEntities) {
    byId[entity.id] = entity;
    allIds.push(entity.id);
  }

  return { byId, allIds };
};

export const removeEntities = (existing, idsToRemove) => {
  const byId = { ...existing.byId };
  const allIds = existing.allIds.filter((id) => !idsToRemove.includes(id));

  for (const id of idsToRemove) {
    delete byId[id];
  }

  return { byId, allIds };
};

export const cloneEntities = (entities, sourceIds) => {
  const clones = [];
  const idMap = {};

  for (const id of sourceIds) {
    const newId = uuidv4();
    clones.push({ ...entities[id], id: newId });
    idMap[id] = newId;
  }

  return { clones, idMap };
};
