import http from 'node:http';
import 'dotenv/config';
import { CYAN, GRAY, GREEN, RESET_COLOR, YELLOW } from '../constants';
import { methodGet } from '../services/methodGet';
import { methodPost } from '../services/methodPost';
import { methodPut } from '../services/methodPut';
import { methodDelete } from '../services/methodDelete';
import { methodNotAllowed405 } from '../services/responses';

import cluster from 'node:cluster';
import { availableParallelism } from 'node:os';
import { dataBase } from '../data/dataBase';
import { checkUser } from '../utils/checkUser';
import { ExtendedUser } from '../types/types';

const args = process.argv.slice(2);

export const loadBalancerArg = args.find((arg) => arg.startsWith('loadbalancer'));

const createWorkerServer = (workerPort: string) => {
  http
    .createServer((req, res) => {
      try {
        if (req.method === 'GET') {
          return methodGet(req, res);
        }
        if (req.method === 'POST') {
          return methodPost(req, res);
        }
        if (req.method === 'PUT') {
          return methodPut(req, res);
        }
        if (req.method === 'DELETE') {
          return methodDelete(req, res);
        }

        methodNotAllowed405(res);
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            error: 'Server Error',
            message: err instanceof Error ? err.message : 'Unknown server error',
          }),
        );
      }
    })
    .listen(workerPort, () => {
      console.log(`${GRAY}      Worker is running on port ${GREEN}${workerPort}${GRAY}`);
    });
};

export const createServer = () => {
  const port = process.env.PORT || 4000;

  if (!loadBalancerArg) {
    const server = http.createServer((req, res) => {
      try {
        if (req.method === 'GET') {
          return methodGet(req, res);
        }
        if (req.method === 'POST') {
          return methodPost(req, res);
        }
        if (req.method === 'PUT') {
          return methodPut(req, res);
        }
        if (req.method === 'DELETE') {
          return methodDelete(req, res);
        }

        methodNotAllowed405(res);
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
  } else {
    if (cluster.isPrimary) {
      const numCPUs = availableParallelism() - 1;
      const workers = [];
      const workerPorts: string[] = [];

      for (let i = 0; i < numCPUs; i++) {
        const workerPort = (parseInt(`${port}`) + i + 1).toString();

        const worker = cluster.fork({ PORT: workerPort });

        worker.on('message', (message) => {
          if (message.type === 'addUser') {
            dataBase.users.push(message.data);
            worker.send({ type: 'addUserResponse', data: message.data });
          }

          if (message.type === 'getUsers') {
            worker.send({ type: 'getUsersResponse', data: dataBase.users });
          }

          if (message?.type === 'getUserById') {
            const result = checkUser(dataBase, message.data);
            worker.send({ type: 'getUserByIdResponse', data: result });
          }

          if (message.type === 'deleteUser') {
            const index = dataBase.users.findIndex((u) => u.id === message.userId);

            if (index !== -1) {
              dataBase.users.splice(index, 1);
              worker.send({ type: 'deleteUserResponse', success: true });
            } else {
              worker.send({ type: 'deleteUserResponse', success: false });
            }
          }

          if (message.type === 'updateUser') {
            const index = dataBase.users.findIndex((u) => u.id === message.userId);

            if (index === -1) {
              worker.send({ type: 'updateUserResponse', success: false, error: 'User not found' });
              return;
            }

            try {
              const updatedUser: ExtendedUser = { ...dataBase.users[index] };
              const protectedFields = ['id', 'username', 'age', 'hobbies'];

              for (const [key, value] of Object.entries(message.data)) {
                if (key === 'id') continue;

                if (value === '--remove_field') {
                  if (['username', 'age', 'hobbies'].includes(key)) {
                    throw new Error(`Cannot remove ${key}`);
                  }
                  delete updatedUser[key as keyof ExtendedUser];
                } else {
                  if (key === 'hobbies') {
                    if (!Array.isArray(value)) throw new Error('Hobbies must be an array');
                    updatedUser.hobbies = value;
                  } else if (value === '--remove_field') {
                    if (!protectedFields.includes(key)) {
                      delete updatedUser[key];
                    }
                  } else {
                    updatedUser[key] = value;
                  }
                }
              }

              dataBase.users[index] = updatedUser;

              worker.send({ type: 'updateUserResponse', success: true, updatedUser });
            } catch (err) {
              worker.send({
                type: 'updateUserResponse',
                success: false,
                error: err instanceof Error ? err.message : 'Unknown error',
              });
            }
          }
        });
        workers.push(worker);
        workerPorts.push(workerPort);
      }

      let currentWorkerIndex = 0;

      const loadBalancer = http.createServer((req, res) => {
        const workerPort = workerPorts[currentWorkerIndex];
        currentWorkerIndex = (currentWorkerIndex + 1) % workerPorts.length;

        const options = {
          hostname: 'localhost',
          port: workerPort,
          path: req.url,
          method: req.method,
          headers: req.headers,
        };

        const proxyReq = http.request(options, (proxyRes) => {
          res.writeHead(proxyRes.statusCode ?? 200, proxyRes.headers);
          proxyRes.pipe(res, { end: true });
        });

        req.pipe(proxyReq, { end: true });
      });

      loadBalancer.listen(port, () => {
        console.log(`
          ${CYAN}
    ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━►
    ┃ Load balancer is running on port ${YELLOW}${port}${CYAN}
    ┃ http://localhost:${port}
    ┗━━━━━━━━━━━━━━━━━━━━━━━━►
          ${RESET_COLOR}
          `);
      });
    } else {
      const workerPort = process.env.PORT ?? '4000';
      createWorkerServer(workerPort);
    }
  }
};
