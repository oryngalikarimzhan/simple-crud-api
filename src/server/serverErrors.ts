import { ServerMessages, StatusCodes } from './serverUtils';

export class NotFoundError extends Error {
  statusCode = StatusCodes.NOT_FOUND;

  constructor(public message: string) {
    super();
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
