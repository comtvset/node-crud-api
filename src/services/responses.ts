import http from 'node:http';
import { DBType, Greeting, ResultWithUser } from '../types/types';

export const greeting200 = (res: http.ServerResponse, greeting: Greeting) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(greeting));
};

export const user200 = (res: http.ServerResponse, result: ResultWithUser) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(result?.user));
};

export const users200 = (res: http.ServerResponse, dateBase: DBType) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(dateBase.users));
};

export const user204 = (res: http.ServerResponse) => {
  res.writeHead(204);
  res.end();
};

export const badRequest400 = (res: http.ServerResponse) => {
  res.writeHead(400, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Bad Request', message: 'Invalid user ID format' }));
};

export const notFoundUser404 = (res: http.ServerResponse) => {
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found', message: 'User ID not found' }));
};

export const notFoundResource404 = (res: http.ServerResponse) => {
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found', message: 'Resource does not exist' }));
};

export const methodNotAllowed405 = (res: http.ServerResponse) => {
  res.writeHead(405, { 'Content-Type': 'application/json' });
  res.end(
    JSON.stringify({
      error: 'Method Not Allowed',
      message: 'Allowed methods: GET, POST, PUT, DELETE',
    }),
  );
};

export const unprocessableEntity422 = (res: http.ServerResponse) => {
  res.writeHead(422, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Unprocessable Entity', message: 'ID is required' }));
};
