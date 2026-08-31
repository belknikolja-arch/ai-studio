import { useCallback, useState } from 'react';
import { getSet, saveSet } from '../config.js';

export function useSettings() {
  const [settings, setSettings] = useState(() => getSet());
  const update = useCallback((key, value) => {
    setSettings(prev => {
      const next = Object.assign({}, prev, { [key]: value });
      saveSet(next);
      return next;
    });
  }, []);
  return [settings, update];
}
