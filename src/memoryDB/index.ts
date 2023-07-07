import { User } from '../models/user/User';
import { MemoryDBTransaction, UsersTransactionTypes } from './utils';
import { routes } from '../server/constants';

export function runMemoryDb() {
  const usersMemoryDb: User[] = [];

  console.log(`MEMORY DATABASE: pid - ${process.pid}`);

  process.on('message', (transaction: MemoryDBTransaction) => {
    try {
      if (!routes.includes(transaction.route)) {
        throw new Error();
      }

      switch (transaction.route) {
        case 'users': {
          handleUsersTransaction(usersMemoryDb, transaction);

          break;
        }
      }
    } catch {
      if (!process.send) {
        console.log(
          'Closing process. Reason: memory db worker process send method does not exists',
        );
        process.exit();
      }

      process.send({ isError: true, pid: transaction.pid });
    }
  });
}

function handleUsersTransaction(
  usersMemoryDb: User[],
  { type, pid, params }: MemoryDBTransaction,
) {
  if (!process.send) {
    throw new Error();
  }

  switch (type) {
    case UsersTransactionTypes.GET_USERS: {
      process.send({ result: usersMemoryDb, pid, type });
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
        type,
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
        type,
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
          updatedUser = {
            ...usersMemoryDb[index],
            ...userDto,
          } as User;

          usersMemoryDb.splice(index, 1, updatedUser);
        }
      } else {
        isSuccess = false;
      }

      process.send({
        result: isSuccess ? updatedUser : undefined,
        pid,
        isError: !isSuccess,
        type,
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

      process.send({ result: deletedUser, pid, isError: !isSuccess, type });

      break;
    }
  }
}
