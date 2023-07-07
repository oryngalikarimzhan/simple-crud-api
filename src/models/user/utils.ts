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

export function isValidUserUpdateDto(
  data: any,
  id: string,
): data is UserUpdateDto {
  const dataKeys = Object.keys(data);

  if (dataKeys.includes('id')) {
    if (data.id !== id) {
      return false;
    }

    dataKeys.splice(dataKeys.indexOf('id'), 1);
  }

  if (dataKeys.length > 3) {
    return false;
  }

  const userKeys = ['age', 'username', 'hobbies'];

  return dataKeys.every((key) => {
    if (!userKeys.includes(key)) {
      return false;
    }

    let result = true;

    switch (data[key]) {
      case 'age': {
        result = typeof data.age === 'number';
      }

      case 'username': {
        result =
          typeof data.username === 'string' && data.username.length !== 0;
      }

      case 'hobbies': {
        result =
          Array.isArray(data.hobbies) &&
          data.hobbies.every(
            (hobby: any) => typeof hobby === 'string' && hobby.length !== 0,
          );
      }
    }

    return result;
  });
}
