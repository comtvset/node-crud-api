import http from 'node:http';
import { cleanPath } from '../utils/cleanPath';
import { dataBase } from '../data/dataBase';
import { uuidValidateV4 } from '../utils/uuidValidate';
import {
  badRequest400,
  notFoundResource404,
  notFoundUser404,
  unprocessableEntity422,
  user204,
} from './responses';
import { loadBalancerArg } from '../server/server';
import { IPCMessage } from '../types/types';
export const methodDelete = async (req: http.IncomingMessage, res: http.ServerResponse) => {
  const url = req.url ?? '/';
  const cleanUrl = cleanPath(url);
  const userId = cleanUrl.split('/api/users/')[1];
  const indexUser = dataBase.users.findIndex((item) => item.id === userId);

  if (!uuidValidateV4(userId) && cleanUrl.startsWith('/api/users/')) {
    badRequest400(res);
    return;
  }

  if (!loadBalancerArg) {
    if (uuidValidateV4(userId) && cleanUrl.startsWith('/api/users/')) {
      if (indexUser === -1) {
        notFoundUser404(res);
        return;
      }

      dataBase.users.splice(indexUser, 1);

      user204(res);
      return;
    }
  } else {
    if (uuidValidateV4(userId) && cleanUrl.startsWith('/api/users/')) {
      if (!process.send) {
        throw new Error('IPC not available');
      }

      process.send({ type: 'deleteUser', userId });

      process.once('message', (msg: IPCMessage) => {
        if (msg.type === 'deleteUserResponse') {
          if (msg.success) {
            user204(res);
          } else {
            notFoundUser404(res);
          }
        }
      });

      return;
    }
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
