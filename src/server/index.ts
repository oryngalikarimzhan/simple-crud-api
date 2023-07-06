import http from 'http';
import cluster, { Worker } from 'cluster';

import {
  logRequestToConsole,
  useErrorBoundary,
  validateAndGet,
} from './serverUtils';
import { host, routes } from './constants';
import { UsersController } from '../controllers/users/UsersController';
import { IController } from '../controllers/IController';

const getServerExecutorName = () => (cluster.isWorker ? 'WORKER' : 'SERVER');

export function runServer(port: number, memoryDbWorker: Worker) {
  const controllers: { [key in (typeof routes)[number]]: IController } = {
    users: new UsersController(memoryDbWorker),
  };

  const server = http.createServer(
    async (req: http.IncomingMessage, res: http.ServerResponse) => {
      res.setHeader('Content-Type', 'application/json');

      useErrorBoundary(res, () => {
        const { method, url } = req;

        logRequestToConsole('Request', {
          method,
          port,
          pid: process.pid,
        });

        const { route, id } = validateAndGet(url);

        controllers[route]?.handle(req, res, id);
      });
    },
  );

  server.listen(port, () => {
    console.log(
      `${getServerExecutorName()}: ${host}:${port}, pid: ${process.pid}`,
    );
  });
}
