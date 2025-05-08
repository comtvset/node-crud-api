import { DBType } from '../types/types';
import userExample from '../data/userExample.json';

// NOTE: To initialize the database with sample users, uncomment the line below 👇
export const dateBase: DBType = {
  users: userExample,
};

// export const dateBase: DBType = {
//   users: [],
// };
