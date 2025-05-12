import http from 'node:http';
import { checkUser } from '../utils/checkUser';
import { cleanPath } from '../utils/cleanPath';
import { dataBase } from '../data/dataBase';
import gretting from '../data/greeting.json';
import { uuidValidateV4 } from '../utils/uuidValidate';
import {
  badRequest400,
  greeting200,
  notFoundResource404,
  notFoundUser404,
  user200,
  users200,
} from './responses';
import { IPCMessage } from '../types/types';
import { loadBalancerArg } from '../server/server';

export const methodGet = async (req: http.IncomingMessage, res: http.ServerResponse) => {
  const url = req.url ?? '/';
  const cleanUrl = cleanPath(url);

  const userId = cleanUrl.split('/api/users/')[1];
  const result = checkUser(dataBase, userId);
  try {
    if (cleanUrl === '/api/error') {
      throw new Error('Simulated server failure');
    }

    if (cleanUrl === '/api') {
      greeting200(res, gretting);
      return;
    }

    if (cleanUrl === '/api/users') {
      if (!loadBalancerArg) {
        users200(res, dataBase);
        return;
      } else {
        if (!process.send) throw new Error('IPC not available');

        process.send({ type: 'getUsers' });

        process.once('message', (msg: IPCMessage) => {
          if (msg.type === 'getUsersResponse') {
            users200(res, { users: msg.data });
          }
        });
        return;
      }
    }

    if (result && result.user && cleanUrl === `/api/users/${result.userId}`) {
      user200(res, result);
      return;
    }

    if (uuidValidateV4(userId) && cleanUrl.startsWith('/api/users/')) {
      if (!process.send) throw new Error('IPC not available');

      process.send({ type: 'getUsers' });

      process.once('message', (msg: IPCMessage) => {
        if (msg.type === 'getUsersResponse') {
          const user = msg.data.find((u) => u.id === userId);
          if (user) {
            user200(res, { user, userId });
          } else {
            notFoundUser404(res);
          }
        }
      });
      return;
    }

    if (uuidValidateV4(userId) && cleanUrl.startsWith('/api/users/')) {
      notFoundUser404(res);
      return;
    }

    if (!uuidValidateV4(userId) && cleanUrl.startsWith('/api/users/')) {
      badRequest400(res);
      return;
    }

    if (cleanUrl !== '/api/users') {
      notFoundResource404(res);
      return;
    }
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        error: 'Server error',
        message: (err as Error).message,
      }),
    );
  }
};
