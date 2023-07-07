import http from 'http';
import cluster, { Worker } from 'cluster';

import {
  handleCaughtError,
  logRequestToConsole,
  validateAndGet,
} from './serverUtils';
import { host, routes } from './constants';
import { UsersController } from '../controllers/users/UsersController';
import { IController } from '../controllers/IController';

const getServerExecutorName = () => (cluster.isWorker ? 'WORKER' : 'SERVER');

export function runServer(port: number, memoryDBWorker?: Worker) {
  const controllers: { [key in (typeof routes)[number]]: IController } = {
    users: new UsersController(memoryDBWorker),
  };

  const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');

    try {
      const { method, url } = req;

      logRequestToConsole('Request', {
        method,
        port,
        pid: process.pid,
      });

      const { route, id } = validateAndGet(url);

      controllers[route]?.handle(req, res, id);
    } catch (error) {
      handleCaughtError(error, res);
    }
  });

  server.listen(port, () => {
    console.log(
      `${getServerExecutorName()}: ${host} = ${port}, pid = ${process.pid}`,
    );
  });
}
