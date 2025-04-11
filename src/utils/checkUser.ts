import { DBType } from '../types/types';

export const checkUser = (db: DBType, userId: string) => {
  const ids = db.users.map((user) => user.id);
  const user = db.users.find((user) => user.id === String(userId));

  if (ids.includes(userId)) {
    return { userId, user };
  } else {
    return null;
  }
};
