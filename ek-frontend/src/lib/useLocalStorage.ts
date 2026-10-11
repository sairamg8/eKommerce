export const useLocalStorage = {
  get: <T = string>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : null;
    } catch (err) {
      return null;
    }
  },

  insert: <T>(key: string, value: T): void => {
    console.log(key, value, "For insertion");
    localStorage.setItem(key, JSON.stringify(value));
  },

  delete: (key: string): boolean => {
    const is_key_exists = useLocalStorage.get(key);

    if (is_key_exists) {
      localStorage.removeItem(key);
      return true;
    } else {
      return false;
    }
  },
};
