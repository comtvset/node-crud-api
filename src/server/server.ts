import http from 'node:http';
import 'dotenv/config';
import { CYAN, RESET_COLOR, YELLOW } from '../constants';
import { methodGet } from '../services/methodGet';
import { methodPost } from '../services/methodPost';
import { methodPut } from '../services/methodPut';

export const createServer = () => {
  const port = process.env.PORT || 4000;

  const server = http.createServer((req, res) => {
    try {
      if (req.method === 'GET') {
        methodGet(req, res);
      }
      if (req.method === 'POST') {
        methodPost(req, res);
      }
      if (req.method === 'PUT') {
        methodPut(req, res);
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
