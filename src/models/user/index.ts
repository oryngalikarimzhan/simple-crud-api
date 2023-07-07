export type User = {
  id: string;
  username: string;
  age: number;
  hobbies: string[];
};

export type UserCreateDto = Omit<User, 'id'>;

export type UserUpdateDto = Partial<UserCreateDto>;
