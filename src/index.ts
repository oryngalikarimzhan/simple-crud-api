import 'dotenv/config';
import { runServer } from './server';
import cluster from 'cluster';
import { Serializable } from 'child_process';

import { runLoadBalancerServer } from './load-balancer';
import { runMemoryDb } from './memoryDB';

const mode = process.env.MODE;
const port = +(process.env.PORT || 4000);

if (cluster.isPrimary) {
  app();
} else {
  if (process.env.MEMORY_DB) {
    runMemoryDb();
  } else if (mode && mode === 'parallel') {
    const workerPort = process.env.WORKER_PORT;

    if (workerPort) {
      runServer(+workerPort);
    }
  }
}

export default function app() {
  const memoryDbWorker = cluster.fork({ MEMORY_DB: true });

  if (mode && mode === 'parallel') {
    cluster.on('message', (worker, msg) => {
      if (worker !== memoryDbWorker) {
        memoryDbWorker.send(msg as Serializable);
      }
    });

    memoryDbWorker.on('message', (msg) => {
      if (cluster.workers) {
        const worker = Object.entries(cluster.workers).find(
          ([id, worker]) => +id !== 1 && worker?.process.pid === msg.pid,
        )?.[1];

        if (worker) {
          worker.send(msg);
        }
      }
    });

    return runLoadBalancerServer(port);
  }

  return runServer(port, memoryDbWorker);
}
