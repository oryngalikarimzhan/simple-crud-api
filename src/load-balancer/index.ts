import cluster from 'cluster';
import http from 'http';
import { availableParallelism } from 'os';
import { host } from '../server/constants';
import { StatusCodes, handleCaughtError } from '../server/serverUtils';
import { pipeline } from 'stream/promises';

export function runLoadBalancerServer(port: number) {
  const workersAmount = availableParallelism() - 2;

  const workersPorts = new Array(workersAmount).fill(null).map((_, index) => {
    const workerPort = port + index + 1;
    cluster.fork({ WORKER_PORT: workerPort });

    return workerPort;
  });

  let nextWorkerIndex = 0;

  const loadBalancerServer = http.createServer(async (req, res) => {
    const workerPort = workersPorts[nextWorkerIndex++ % workersAmount];
    try {
      const forwardReq = http.request(
        {
          host,
          port: workerPort,
          path: req.url,
          method: req.method,
          headers: req.headers,
        },
        (response) => {
          res.statusCode = response.statusCode ?? StatusCodes.OK;
          res.setHeader('Content-Type', 'application/json');
          response.pipe(res);
        },
      );

      await pipeline(req, forwardReq);
    } catch (error) {
      handleCaughtError(error, res);
    }
  });

  loadBalancerServer.listen(port, () => {
    console.log(`BALANCER SERVER: ${host} = ${port}, pid = ${process.pid}`);
  });

  return loadBalancerServer;
}
