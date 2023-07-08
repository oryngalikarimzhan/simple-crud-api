import { Worker } from 'cluster';
import { IncomingMessage, ServerResponse } from 'http';
import { URLData } from '../server/serverUtils';

export interface IController {
  db?: Worker;
  handle: (req: IncomingMessage, res: ServerResponse, urlData: URLData) => void;
}
