/* eslint-disable @typescript-eslint/no-explicit-any */
import { UserCreateDto, UserUpdateDto } from './User';

export function isValidUserCreateDto(data: any): data is UserCreateDto {
  return 'age' in data && 'username' in data && 'hobbies' in data;
}

export function isValidUserUpdateDto(data: any): data is UserUpdateDto {
  return 'age' in data || 'username' in data || 'hobbies' in data;
}
