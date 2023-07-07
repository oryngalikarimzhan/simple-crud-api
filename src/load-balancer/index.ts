import cluster from 'cluster';
import http from 'http';
import { availableParallelism } from 'os';
import { runServer } from '../server';
import { host } from '../server/constants';
import { StatusCodes, handleCaughtError } from '../server/serverUtils';

export function runLoadBalancerServer(port: number) {
  if (cluster.isPrimary) {
    const workersAmount = availableParallelism() - 1;

    const workersPorts = new Array(workersAmount).fill(null).map((_, index) => {
      const workerPort = port + index + 1;
      cluster.fork({ WORKER_PORT: workerPort });

      return workerPort;
    });

    let nextWorkerIndex = 0;

    const loadBalancerServer = http.createServer((req, res) => {
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

        req.pipe(forwardReq);
      } catch (error) {
        handleCaughtError(error, res);
      }
    });

    loadBalancerServer.listen(port, () => {
      console.log(`BALANCER SERVER: ${host} = ${port}, pid = ${process.pid}`);
    });
  } else {
    const workerPort = process.env.WORKER_PORT;

    if (!workerPort) {
      console.log('Closing process. Reason: worker port does not exists');
      process.exit();
    }

    runServer(+workerPort);
  }
}
