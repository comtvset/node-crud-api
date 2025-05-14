import http from 'node:http';
import { cleanPath } from '../utils/cleanPath';
import { dataBase } from '../data/dataBase';
import { uuidValidateV4 } from '../utils/uuidValidate';
import { ExtendedUser, IPCMessage } from '../types/types';
import { cleanObject } from '../utils/cleanObject';
import {
  badRequest400,
  notFoundResource404,
  notFoundUser404,
  unprocessableEntity422,
} from './responses';
import { loadBalancerArg } from '../server/server';

export const methodPut = async (req: http.IncomingMessage, res: http.ServerResponse) => {
  const url = req.url ?? '/';
  const cleanUrl = cleanPath(url);

  const userId = cleanUrl.split('/api/users/')[1];
  const indexUser = dataBase.users.findIndex((item) => item.id === userId);

  let body = '';

  if (!loadBalancerArg) {
    if (!uuidValidateV4(userId) && cleanUrl.startsWith('/api/users/')) {
      badRequest400(res);
      return;
    }

    if (uuidValidateV4(userId) && cleanUrl.startsWith('/api/users/')) {
      const indexUser = dataBase.users.findIndex((item) => item.id === userId);

      if (indexUser === -1) {
        notFoundUser404(res);
        return;
      }
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

  req.on('data', (chunk) => {
    body += chunk;
  });

  req.on('end', () => {
    try {
      const parsed = JSON.parse(body);

      if (parsed.id) {
        throw new Error('Cannot modify ID');
      }

      if (!loadBalancerArg) {
        const protectedFields = ['id', 'username', 'age', 'hobbies'];
        delete parsed.id;

        const originalUser = dataBase.users[indexUser];
        const updatedUser: ExtendedUser = { ...originalUser };

        for (const key of Object.keys(parsed)) {
          const value = parsed[key];

          if (value === '--remove_field' && key === 'username') {
            throw new Error('Cannot remove name');
          }

          if (value === '--remove_field' && key === 'age') {
            throw new Error('Cannot remove age');
          }

          if (value === '--remove_field' && key === 'hobbies') {
            throw new Error('Cannot remove hobbies');
          }

          if (key === 'hobbies') {
            if (!Array.isArray(value)) {
              throw new Error('Hobbies must be an array');
            }
            updatedUser[key] = Array.isArray(value) ? value : [value];
          } else if (value === '--remove_field') {
            if (!protectedFields.includes(key)) {
              delete updatedUser[key];
            }
          } else {
            updatedUser[key] = value;
          }
        }

        updatedUser.id = originalUser.id;

        dataBase.users[indexUser] = cleanObject(updatedUser);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(cleanObject(updatedUser)));
      } else {
        if (!process.send) {
          throw new Error('IPC not available');
        }

        process.send({ type: 'updateUser', userId, data: parsed });

        process.once('message', (msg: IPCMessage) => {
          if (msg.type === 'updateUserResponse') {
            if (!msg.success) {
              if (msg.error === 'User not found') {
                notFoundUser404(res);
              } else {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(
                  JSON.stringify({
                    error: 'Bad Request',
                    message: msg.error,
                  }),
                );
              }
            } else {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(msg.updatedUser));
            }
          }
        });
      }
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: 'Bad Request',
          message: err instanceof Error ? err.message : 'Unknown error',
        }),
      );
    }
  });
};
