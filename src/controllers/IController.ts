import { Worker } from 'cluster';
import { IncomingMessage, ServerResponse } from 'http';

export interface IController {
  db?: Worker;
  handle: (
    req: IncomingMessage,
    res: ServerResponse,
    id: string | undefined,
  ) => void;
}
