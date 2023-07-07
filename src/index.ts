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

  cluster.on('message', (_, msg) => {
    memoryDbWorker.send(msg as Serializable);
  });

  memoryDbWorker.on('message', (msg) => {
    if (cluster.workers) {
      Object.keys(cluster.workers).forEach((id) => {
        if (+id !== 1) {
          cluster.workers?.[id]?.send(msg);
        }
      });
    }
  });

  if (mode && mode === 'parallel') {
    runLoadBalancerServer(port);
  } else {
    runServer(port, memoryDbWorker);
  }
} else if (cluster.isWorker) {
  if (!cluster.worker) {
    console.log('Closing process. Reason: cluster worker does not exists');
    process.exit();
  }

  if (cluster.worker.id === 1) {
    runMemoryDb();
  }

  if (mode && mode === 'parallel' && cluster.worker.id !== 1) {
    runLoadBalancerServer(port);
  }
}
