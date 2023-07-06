import 'dotenv/config';
import { runServer } from './server';
import cluster from 'cluster';
import { runMemoryDb } from './memoryDB';

const mode = process.env.MODE;
const port = +(process.env.PORT || 4000);

if (cluster.isPrimary) {
  const memoryDbWorker = cluster.fork();

  if (mode && mode === 'parallel') {
    // runLoadBalancerServer(port, memoryDbWorker)
  } else {
    runServer(port, memoryDbWorker);
  }
} else if (cluster.isWorker) {
  runMemoryDb();
}
