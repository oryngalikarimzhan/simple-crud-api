/* eslint-disable @typescript-eslint/no-explicit-any */
import { UserCreateDto, UserUpdateDto } from './User';

export function isValidUserCreateDto(data: any): data is UserCreateDto {
  return (
    Object.keys(data).length === 3 &&
    'age' in data &&
    typeof data.age === 'number' &&
    'username' in data &&
    typeof data.username === 'string' &&
    data.username.length !== 0 &&
    'hobbies' in data &&
    Array.isArray(data.hobbies) &&
    data.hobbies.every(
      (hobby: any) => typeof hobby === 'string' && hobby.length !== 0,
    )
  );
}

export function isValidUserUpdateDto(data: any): data is UserUpdateDto {
  console.log(Object.keys(data));
  return (
    (Object.keys(data).length <= 3 &&
      'age' in data &&
      typeof data.age === 'number') ||
    ('username' in data &&
      typeof data.username === 'string' &&
      data.username.length !== 0) ||
    ('hobbies' in data &&
      Array.isArray(data.hobbies) &&
      data.hobbies.every(
        (hobby: any) => typeof hobby === 'string' && hobby.length !== 0,
      ))
  );
}
