import http from 'http';
import cluster, { Worker } from 'cluster';

import {
  handleCaughtError,
  logRequestToConsole,
  validateAndGet,
} from './serverUtils';
import { host, routes } from './constants';
import { UsersController } from '../controllers/users';
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

      logRequestToConsole({
        method,
        port,
        pid: process.pid,
      });

      const urlData = validateAndGet(url);

      controllers[urlData.route]?.handle(req, res, urlData);
    } catch (error) {
      handleCaughtError(error, res);
    }
  });

  server.listen(port, () => {
    console.log(
      `${getServerExecutorName()}: ${host} = ${port}, pid = ${process.pid}`,
    );
  });

  return server;
}
