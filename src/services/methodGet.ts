import http from 'node:http';
import { checkUser } from '../utils/checkUser';
import { cleanPath } from '../utils/cleanPath';
import { dateBase } from '../data/dataBase';
import gretting from '../data/greeting.json';
import { uuidValidateV4 } from '../utils/uuidValidate';

export const methodGet = async (req: http.IncomingMessage, res: http.ServerResponse) => {
  const url = req.url ?? '/';
  const cleanUrl = cleanPath(url);

  const userId = cleanUrl.split('/api/users/')[1];
  const result = checkUser(dateBase, userId);
  try {
    if (cleanUrl === '/api/error') {
      throw new Error('Simulated server failure');
    }

    if (cleanUrl === '/api') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(gretting));
      return;
    }

    if (cleanUrl === '/api/users') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(dateBase.users));
      return;
    }

    if (cleanUrl === `/api/users/${result?.userId}`) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result?.user));
      return;
    }

    if (uuidValidateV4(userId) && cleanUrl.startsWith('/api/users/')) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not Found', message: 'User ID not found' }));
      return;
    }

    if (!uuidValidateV4(userId) && cleanUrl.startsWith('/api/users/')) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Bad Request', message: 'Invalid user ID format' }));
      return;
    }

    if (cleanUrl !== '/api/users') {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not Found', message: 'Resource does not exist' }));
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: http.STATUS_CODES[404] }));
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
