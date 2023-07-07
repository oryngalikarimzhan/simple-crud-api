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
import { BadRequestError } from '../../server/serverErrors';
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

      if (cluster.isPrimary) {
        if (!this.db) {
          process.exit();
        }

        this.db.send(transaction);

        this.db.on('message', (msg) => {
          try {
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
          } catch (error) {
            handleCaughtError(error, res);
          }
        });
      } else {
        if (!process.send) {
          process.exit();
        }
        process.send(transaction);

        process.on('message', (msg) => {
          try {
            const memoryDbTransactionResult = msg as MemoryDBTransactionResult;
            if (memoryDbTransactionResult.pid === process.pid) {
              if (memoryDbTransactionResult.isError) {
                throw new Error();
              }

              if (!memoryDbTransactionResult.result) {
                throw new BadRequestError(ServerMessages.USER_NOT_FOUND);
              }

              res.statusCode = StatusCodes.OK;
              res.end(JSON.stringify(memoryDbTransactionResult.result));
            }
          } catch (error) {
            handleCaughtError(error, res);
          }
        });
      }
    } catch (error) {
      handleCaughtError(error, res);
    }
  }
}
