import http from 'http';
import { Worker } from 'cluster';
import { v4 } from 'uuid';

import { IController } from '../IController';
import { MemoryDBTransaction, MemoryDBTransactionResult } from '../../memoryDB';
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
  handleCaughtError,
} from '../../server/serverUtils';
import { UsersTransactionTypes } from '../../memoryDB/utils';
import { BadRequestError, NotFoundError } from '../../server/serverErrors';
import cluster from 'cluster';

export class UsersController implements IController {
  constructor(public db?: Worker) {}

  async handle(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    id: string | undefined,
  ) {
    try {
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

        case HTTPMethods.PUT: {
          if (!id) {
            throw new BadRequestError(ServerMessages.ID_NOT_PROVIDED);
          }

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

          break;
        }

        case HTTPMethods.DELETE:
          if (!id) {
            throw new BadRequestError(ServerMessages.ID_NOT_PROVIDED);
          }

          transaction.type = UsersTransactionTypes.DELETE_USER;
          transaction.params = id;

          break;

        default:
          throw new BadRequestError(ServerMessages.UNSUPPORTED_METHOD);
      }

      const channel = cluster.isPrimary ? this.db : process;

      if (!channel || !channel.send) {
        console.log(
          'Closing process. Reason: process send method or memory database do not exist',
        );
        process.exit();
      }
      channel.send(transaction);

      channel.on('message', (msg) => {
        try {
          const transactionResult = msg as MemoryDBTransactionResult;

          if (transactionResult.pid === process.pid) {
            if (transactionResult.isError) {
              throw new Error();
            }

            if (!transactionResult.result) {
              throw new NotFoundError(ServerMessages.USER_NOT_FOUND);
            }

            res.statusCode = StatusCodes.OK;
            res.end(JSON.stringify(transactionResult.result));
          }
        } catch (error) {
          handleCaughtError(error, res);
        }
      });
    } catch (error) {
      handleCaughtError(error, res);
    }
  }
}
