import { User, UserUpdateDto } from '../models/user/User';
import { UsersTransactionTypes } from './utils';

type UniqueId = string;

export type MemoryDBTransaction = {
  type: UsersTransactionTypes;
  pid: number;
  params?: UniqueId | User | [UniqueId, User] | [UniqueId, UserUpdateDto];
};

export type MemoryDBTransactionResult = {
  pid: number;
  result: User[] | User | string;
  message: string;
};

export function runMemoryDb() {
  const usersMemoryDb: User[] = [];

  process.on('message', ({ type, pid, params }: MemoryDBTransaction) => {
    if (!process.send) {
      process.exit();
    }

    try {
      switch (type) {
        case UsersTransactionTypes.GET_USERS: {
          process.send({ result: usersMemoryDb, pid });
          break;
        }

        case UsersTransactionTypes.GET_USER: {
          let isSuccess = true;

          if (typeof params !== 'string') {
            isSuccess = false;
          }

          process.send({
            result: isSuccess
              ? usersMemoryDb.find((user) => user.id === params)
              : undefined,
            pid,
            isError: !isSuccess,
          });
          break;
        }

        case UsersTransactionTypes.CREATE_USER: {
          let isSuccess = true;

          if (typeof params === 'object' && !Array.isArray(params)) {
            usersMemoryDb.push(params);
          } else {
            isSuccess = false;
          }

          process.send({
            result: isSuccess ? params : undefined,
            pid,
            isError: !isSuccess,
          });

          break;
        }

        case UsersTransactionTypes.UPDATE_USER: {
          let isSuccess = true;
          let updatedUser: User | undefined;

          if (Array.isArray(params)) {
            const [id, userDto] = params;
            const index = usersMemoryDb.findIndex((user) => user.id === id);

            if (index !== -1) {
              updatedUser = { ...usersMemoryDb[index], ...userDto } as User;

              usersMemoryDb.splice(index, 1, updatedUser);
            }
          } else {
            isSuccess = false;
          }

          process.send({
            result: isSuccess ? updatedUser : undefined,
            pid,
            isError: !isSuccess,
          });

          break;
        }

        case UsersTransactionTypes.DELETE_USER: {
          let isSuccess = true;
          let deletedUser: User | undefined;

          if (typeof params === 'string') {
            const index = usersMemoryDb.findIndex((user) => user.id === params);

            if (index !== -1) {
              deletedUser = usersMemoryDb.splice(index, 1)[0];
            }
          } else {
            isSuccess = false;
          }

          process.send({ result: deletedUser, pid, isError: !isSuccess });

          break;
        }
      }
    } catch (error) {
      process.send({ isError: true, pid });
    }
  });
}