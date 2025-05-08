import { User } from '../types/types';

export const cleanObject = (obj: Partial<User> & Record<string, unknown>): User => {
  const cleanObj: Record<string, unknown> = {};

  for (const rawKey in obj) {
    const key = rawKey.trim();
    const value = obj[rawKey];

    if (key === 'id' || key === 'username') {
      if (typeof value === 'string') {
        cleanObj[key] = value.trim();
      }
    } else if (key === 'age') {
      if (typeof value === 'number') {
        cleanObj[key] = value;
      }
    } else if (key === 'hobbies') {
      if (Array.isArray(value)) {
        cleanObj[key] = value.map((hobby) => (typeof hobby === 'string' ? hobby.trim() : hobby));
      }
    } else {
      if (typeof value === 'string') {
        cleanObj[key] = value.trim();
      } else if (Array.isArray(value)) {
        cleanObj[key] = value.map((item) => (typeof item === 'string' ? item.trim() : item));
      } else if (typeof value === 'object' && value !== null) {
        cleanObj[key] = cleanObject(value as Record<string, unknown>);
      } else {
        cleanObj[key] = value;
      }
    }
  }

  return cleanObj as User;
};
