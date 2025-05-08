import http from 'node:http';
import { cleanPath } from '../utils/cleanPath';
import { dateBase } from '../data/dataBase';
import { v4 as uuidv4 } from 'uuid';
import { cleanObject } from '../utils/cleanObject';
import { notFoundResource404 } from './responses';

export const methodPost = async (req: http.IncomingMessage, res: http.ServerResponse) => {
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
          !parsed.hobbies.every((hobby: string) => typeof hobby === 'string' && hobby.trim() !== '')
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
    notFoundResource404(res);
  }
};
