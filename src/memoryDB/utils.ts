import { User, UserUpdateDto } from '../models/user/User';

export type UniqueId = string;
export type TransactionParams =
  | UniqueId
  | User
  | [UniqueId, User]
  | [UniqueId, UserUpdateDto];

export type TransactionType = UsersTransactionTypes;

export type MemoryDBTransaction = {
  type: TransactionType;
  route: string;
  pid: number;
  params?: TransactionParams;
};

export type MemoryDBTransactionResult = {
  pid: number;
  result: User[] | User | string;
  isError: boolean;
};

export enum UsersTransactionTypes {
  GET_USERS = 'get-all-users',
  GET_USER = 'get-user-by-id',
  CREATE_USER = 'create-user',
  UPDATE_USER = 'update-user-by-id',
  DELETE_USER = 'delete-user-by-id',
}
