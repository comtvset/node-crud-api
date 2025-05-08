import http from 'node:http';
import { cleanPath } from '../utils/cleanPath';
import { dateBase } from '../data/dataBase';
import { uuidValidateV4 } from '../utils/uuidValidate';
import {
  badRequest400,
  notFoundResource404,
  notFoundUser404,
  unprocessableEntity422,
  user204,
} from './responses';
export const methodDelete = async (req: http.IncomingMessage, res: http.ServerResponse) => {
  const url = req.url ?? '/';
  const cleanUrl = cleanPath(url);
  const userId = cleanUrl.split('/api/users/')[1];
  const indexUser = dateBase.users.findIndex((item) => item.id === userId);

  if (!uuidValidateV4(userId) && cleanUrl.startsWith('/api/users/')) {
    badRequest400(res);
    return;
  }

  if (uuidValidateV4(userId) && cleanUrl.startsWith('/api/users/')) {
    if (indexUser === -1) {
      notFoundUser404(res);
      return;
    }

    dateBase.users.splice(indexUser, 1);

    user204(res);
    return;
  }

  if (cleanUrl === `/api/users`) {
    unprocessableEntity422(res);
    return;
  }

  if (cleanUrl !== `/api/users/${userId}`) {
    notFoundResource404(res);
    return;
  }
};
