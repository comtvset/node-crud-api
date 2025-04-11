import http from 'node:http';
import 'dotenv/config';
import { CYAN, RESET_COLOR, YELLOW } from '../constants';
import { cleanPath } from '../utils/cleanPath';
import { checkUser } from '../utils/checkUser';
import { DBType } from '../types/types';

export const createServer = () => {
  const port = process.env.PORT || 4000;

  const dateBase: DBType = {
    users: [
      {
        id: '1',
        username: 'David',
        age: '20',
        hobbies: ['snowboarding', 'cycling', 'making music'],
      },
      {
        id: '2',
        username: 'Alex',
        age: '30',
        hobbies: ['hiking', 'drawing', 'kayaking'],
      },
      {
        id: '3',
        username: 'Sarah',
        age: '40',
        hobbies: ['skiing', 'running', 'surfing'],
      },
      {
        id: '4',
        username: 'Barbara',
        age: '50',
        hobbies: ['rock climbing', 'motor sports', 'mountain biking'],
      },
    ],
  };

  const methodGet = async (req: http.IncomingMessage, res: http.ServerResponse) => {
    const url = req.url ?? '/';
    const cleanUrl = cleanPath(url);

    const userId = cleanUrl.split('/api/users/')[1];
    const result = checkUser(dateBase, userId);

    if (cleanUrl === '/api/users') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(dateBase.users));
    } else if (cleanUrl === `/api/users/${result?.userId}`) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result?.user));
    } else if (!result && cleanUrl.startsWith('/api/users/')) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'user ID not found' }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: http.STATUS_CODES[404] }));
    }
  };

  const server = http.createServer((req, res) => {
    try {
      if (req.method === 'GET') {
        methodGet(req, res);
      }
    } catch (error) {
      console.error(error);
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
