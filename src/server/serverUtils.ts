/* eslint-disable @typescript-eslint/no-explicit-any */
import { validate } from 'uuid';
import { API_ROOT_ROUTE, routes } from './constants';
import { BadRequestError, InternalError, NotFoundError } from './serverErrors';
import { IncomingMessage, ServerResponse } from 'http';

export const enum StatusCodes {
  OK = 200,
  CREATED = 201,
  DELETED = 204,
  BAD_REQUEST = 400,
  NOT_FOUND = 404,
  SERVER_INTERNAL = 500,
}

export enum ServerMessages {
  SERVER_INTERNAL = 'Unexpected server error',
  ROUTE_NOT_EXISTS = 'This route does not exist',
  UNSUPPORTED_METHOD = 'Method is not supported',
  INVALID_USER_ID = 'Invalid user id',
  BAD_ROUTE = 'URL Route is incorrect or has excess data in URL',
  INVALID_JSON_FORMAT = 'JSON provided in request body has invalid format',
  EMPTY_BODY = 'Body was not provided in request',
  USER_NOT_FOUND = 'User with this provided id not found',
  INVALID_USER_DATA = 'Request body does not contain required fields or contain excess fields or user data fields types is incorrect',
  ID_NOT_PROVIDED = 'Unique Id was not provided in URL',
}

export const enum HTTPMethods {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
}

export type URLData = {
  route: string;
  id: string | undefined;
};

export function validateAndGet(url: string | undefined): URLData {
  if (!url) {
    throw new NotFoundError(`${ServerMessages.ROUTE_NOT_EXISTS}: ${url}`);
  }

  const [rootRoute, route, ...rest] = url.slice(1).split('/');

  if (
    !rootRoute ||
    rootRoute !== API_ROOT_ROUTE ||
    !route ||
    !routes.includes(route) ||
    rest.length > 1
  ) {
    throw new NotFoundError(`${ServerMessages.ROUTE_NOT_EXISTS}: ${url}`);
  }

  const id = rest[0];
  validateUserId(id);

  return { route, id };
}

export function validateUserId(id: string | undefined) {
  if (id && !validate(id)) {
    throw new BadRequestError(ServerMessages.INVALID_USER_ID);
  }
}

export async function getBodyData(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      let body = '';

      req
        .on('data', (chunk) => {
          body += chunk.toString();
        })
        .on('end', () => {
          resolve(body);
        });
    } catch {
      reject('');
    }
  });
}

export function logRequestToConsole(stats: {
  method: string | undefined;
  port: number;
  pid: number;
}) {
  console.table({ Request: { ...stats, time: new Date() } });
}

export function handleCaughtError(error: unknown, res: ServerResponse) {
  const { statusCode, message } =
    error instanceof BadRequestError || error instanceof NotFoundError
      ? error
      : new InternalError();

  res.statusCode = statusCode;
  res.end(
    JSON.stringify({
      message: message,
    }),
  );
}
