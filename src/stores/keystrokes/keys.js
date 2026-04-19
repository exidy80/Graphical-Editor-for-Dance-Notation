export const createKeystrokeKey = (key, modifiers = {}, context = null) => {
  const modifierParts = [];
  if (modifiers.ctrl) modifierParts.push('Ctrl');
  if (modifiers.shift) modifierParts.push('Shift');
  if (modifiers.alt) modifierParts.push('Alt');

  let keyString =
    modifierParts.length > 0 ? `${modifierParts.join('+')}+${key}` : key;

  if (context) {
    keyString += `:${context}`;
  }

  return keyString;
};

export const formatKeystrokeDisplay = (key, modifiers = {}) => {
  const modifierParts = [];
  if (modifiers.ctrl) modifierParts.push('Ctrl');
  if (modifiers.shift) modifierParts.push('Shift');
  if (modifiers.alt) modifierParts.push('Alt');

  const displayKey = key.replace('Arrow', '').replace('Key', '');
  return modifierParts.length > 0
    ? `${modifierParts.join('+')}+${displayKey}`
    : displayKey;
};
