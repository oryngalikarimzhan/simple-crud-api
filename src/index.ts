import 'dotenv/config';
import { runServer } from './server';
import cluster from 'cluster';
import { Serializable } from 'child_process';

import { runLoadBalancerServer } from './load-balancer';
import { runMemoryDb } from './memoryDB';

const mode = process.env.MODE;
const port = +(process.env.PORT || 4000);

if (cluster.isPrimary) {
  const memoryDbWorker = cluster.fork({ MEMORY_DB: true });

  if (!mode) {
    runServer(port, memoryDbWorker);
  } else if (mode === 'parallel') {
    runLoadBalancerServer(port);

    cluster.on('message', (worker, msg) => {
      if (worker !== memoryDbWorker) {
        memoryDbWorker.send(msg as Serializable);
      }
    });

    memoryDbWorker.on('message', (msg) => {
      if (cluster.workers) {
        cluster.workers;
        Object.keys(cluster.workers).forEach((id) => {
          if (+id !== 1 && cluster.workers?.[id]?.process.pid === msg.pid) {
            cluster.workers?.[id]?.send(msg);
          }
        });
      }
    });
  }
} else if (cluster.isWorker) {
  if (process.env.MEMORY_DB) {
    runMemoryDb();
  } else if (mode && mode === 'parallel') {
    runLoadBalancerServer(port);
  }
}
