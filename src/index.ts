import 'dotenv/config';
import { runServer } from './server';
import cluster from 'cluster';
import { runMemoryDb } from './memoryDB';
import { runLoadBalancerServer } from './load-balancer';
import { Serializable } from 'child_process';

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
  if (process.env.MEMORY_DB) {
    runMemoryDb();
  }

  if (mode && mode === 'parallel' && !process.env.MEMORY_DB) {
    runLoadBalancerServer(port);
  }
}
