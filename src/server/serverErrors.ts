import { ServerMessages, StatusCodes } from './serverUtils';

export class NotFoundError extends Error {
  statusCode = StatusCodes.NOT_FOUND;
  message: string;

  constructor(url: string | undefined) {
    super();
    this.message = `This url route: ${url} does nor exists`;
  }
}

export class InternalError extends Error {
  message = ServerMessages.SERVER_INTERNAL;
  statusCode = StatusCodes.SERVER_INTERNAL;
}

export class BadRequestError extends Error {
  statusCode = StatusCodes.BAD_REQUEST;

  constructor(public message: string) {
    super();
  }
}
