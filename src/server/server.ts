import http from 'node:http';
import 'dotenv/config';
import { CYAN, RESET_COLOR, YELLOW } from '../constants';
import { cleanPath } from '../utils/cleanPath';
import { checkUser } from '../utils/checkUser';
import { DBType } from '../types/types';
import { v4 as uuidv4 } from 'uuid';
import { uuidValidateV4 } from '../utils/uuidValidate';
import { cleanObject } from '../utils/cleanObject';
import gretting from '../data/greeting.json';
import userExample from '../data/userExample.json';

export const createServer = () => {
  const port = process.env.PORT || 4000;

  // NOTE: To initialize the database with sample users, uncomment the line below 👇
  // const dateBase: DBType = {
  //   users: userExample,
  // };

  const dateBase: DBType = {
    users: [],
  };

  const methodGet = async (req: http.IncomingMessage, res: http.ServerResponse) => {
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

  const methodPost = async (req: http.IncomingMessage, res: http.ServerResponse) => {
    const url = req.url ?? '/';
    const cleanUrl = cleanPath(url);

    if (cleanUrl === '/api/users') {
      let body = '';
      const errorsArray: string[] = [];

      req.on('data', (chunk) => {
        body += chunk;
      });

      req.on('end', () => {
        try {
          const parsed = JSON.parse(body);

          parsed.id = uuidv4();

          if (!parsed.username) {
            errorsArray.push('Username is required');
          } else if (typeof parsed.username !== 'string') {
            errorsArray.push('Age must be a string');
          }

          if (!parsed.age && parsed.age !== 0) {
            errorsArray.push('Age is required');
          } else if (typeof parsed.age !== 'number') {
            errorsArray.push('Age must be a number');
          } else if (parsed.age <= 0) {
            errorsArray.push('Age must be greater than 0');
          }

          if (!Array.isArray(parsed.hobbies)) {
            errorsArray.push('Hobbies are required array of strings or empty array');
          } else if (
            !parsed.hobbies.every(
              (hobby: string) => typeof hobby === 'string' && hobby.trim() !== '',
            )
          ) {
            errorsArray.push('Hobbies must be ONLY array of strings or empty array');
          }

          if (errorsArray.length != 0) {
            const errors = errorsArray.join(', ');
            throw new Error(errors);
          }

          dateBase.users.push(cleanObject(parsed));

          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(parsed));
        } catch (err) {
          let errorResponse;
          if (err instanceof SyntaxError) {
            errorResponse = {
              error: 'Invalid JSON',
              message: err.message,
            };
          } else if (err instanceof Error) {
            errorResponse = {
              error: 'Bad Request',
              message: err instanceof Error ? err.message : 'Unknown error',
            };
          } else {
            errorResponse = {
              error: 'Server Error',
              message: err instanceof Error ? err.message : 'Unknown server error',
            };
          }

          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(errorResponse));
        }
      });
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Not found' }));
    }
  };

  const server = http.createServer((req, res) => {
    try {
      if (req.method === 'GET') {
        methodGet(req, res);
      }
      if (req.method === 'POST') {
        methodPost(req, res);
      }
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: 'Server Error',
          message: err instanceof Error ? err.message : 'Unknown server error',
        }),
      );
    }
  });

  server.listen(port, () => {
    console.log(`
      ${CYAN}
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━►
┃ Server is running on port ${YELLOW}${port}${CYAN}
┃ http://localhost:${port}
┗━━━━━━━━━━━━━━━━━━━━━━━━►
      ${RESET_COLOR}
      `);
  });
};
