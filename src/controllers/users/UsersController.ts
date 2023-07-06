import http from 'http';
import { Worker } from 'cluster';
import { v4 } from 'uuid';

import { IController } from '../IController';
import { MemoryDBTransaction } from '../../memoryDB';
import { UserCreateDto, UserUpdateDto, User } from '../../models/user/User';
import {
  isValidUserCreateDto,
  isValidUserUpdateDto,
} from '../../models/user/utils';
import {
  HTTPMethods,
  ServerMessages,
  StatusCodes,
  getBodyData,
  useErrorBoundary,
} from '../../server/serverUtils';
import { UsersTransactionTypes } from '../../memoryDB/utils';
import { BadRequestError } from '../../server/serverErrors';

export class UsersController implements IController {
  constructor(public db: Worker) {}

  async handle(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    id: string | undefined,
  ) {
    useErrorBoundary(res, async () => {
      const transaction = {
        pid: process.pid,
      } as MemoryDBTransaction;
      const { method } = req;

      switch (method) {
        case HTTPMethods.GET:
          if (id) {
            transaction.type = UsersTransactionTypes.GET_USER;
            transaction.params = id;
          } else {
            transaction.type = UsersTransactionTypes.GET_USERS;
          }

          break;

        case HTTPMethods.POST:
          if (id) {
            throw new BadRequestError(ServerMessages.BAD_ROUTE);
          }

          const stringBody = await getBodyData(req);

          if (!stringBody) {
            throw new BadRequestError(ServerMessages.EMPTY_BODY);
          }

          let userDto: UserCreateDto;

          try {
            userDto = JSON.parse(stringBody);
          } catch {
            throw new BadRequestError(ServerMessages.INVALID_JSON_FORMAT);
          }

          if (!isValidUserCreateDto(userDto)) {
            throw new BadRequestError(ServerMessages.INVALID_USER_DATA);
          }

          const newUser: User = { ...userDto, id: v4() };

          transaction.type = UsersTransactionTypes.CREATE_USER;
          transaction.params = newUser;

          break;

        case HTTPMethods.PUT:
          if (id) {
            const stringBody = await getBodyData(req);

            if (!stringBody) {
              throw new BadRequestError(ServerMessages.EMPTY_BODY);
            }

            let userDto: UserUpdateDto;

            try {
              userDto = JSON.parse(stringBody);
            } catch {
              throw new BadRequestError(ServerMessages.INVALID_JSON_FORMAT);
            }

            if (!isValidUserUpdateDto(userDto)) {
              throw new BadRequestError(ServerMessages.INVALID_USER_DATA);
            }

            transaction.type = UsersTransactionTypes.UPDATE_USER;
            transaction.params = [id, userDto];
          }

          break;

        case HTTPMethods.DELETE:
          if (id) {
            transaction.type = UsersTransactionTypes.DELETE_USER;
            transaction.params = id;
          }

          break;

        default:
          throw new BadRequestError(ServerMessages.UNSUPPORTED_METHOD);
      }

      this.db.send(transaction);

      this.db.on('message', (msg) => {
        useErrorBoundary(res, () => {
          if (msg.pid === process.pid) {
            if (msg.isError) {
              throw new Error();
            }

            if (!msg.result) {
              throw new BadRequestError(ServerMessages.USER_NOT_FOUND);
            }

            res.statusCode = StatusCodes.OK;
            res.end(JSON.stringify(msg.result));
          }
        });
      });
    });
  }
}
