import request from 'supertest';
import { v4, validate } from 'uuid';

import { ServerMessages, StatusCodes } from '../server/serverUtils';

const server = 'localhost:4000';
const apiRoute = '/api/users/';
const validId = v4();
const inValidId = validId.slice(1);
let userValidId = '';

const createUserDto = {
  username: 'Tom',
  age: 32,
  hobbies: [],
};
const updateUserDto = {
  username: 'Jerry',
};

describe('CRUD API. Route: /api/users', () => {
  afterAll((done) => {
    done();
  });

  describe('GET method', () => {
    it('should return list with 200 status code, when simple GET request', async () => {
      const { statusCode, body } = await request(server).get(apiRoute);
      expect(statusCode).toEqual(StatusCodes.OK);
      expect(Array.isArray(body)).toBe(true);
    });

    it('should return error message json object with 400 status code, when invalid id', async () => {
      await request(server)
        .get(apiRoute + inValidId)
        .expect(StatusCodes.BAD_REQUEST, {
          message: ServerMessages.INVALID_USER_ID,
        });
    });

    it('should return error message json object with 404 status code, when valid id but not existing users id', async () => {
      await request(server)
        .get(apiRoute + validId)
        .expect(StatusCodes.NOT_FOUND, {
          message: ServerMessages.USER_NOT_FOUND,
        });
    });

    it('should return error message json object with 404 status code, when valid id but not existing users id', async () => {
      await request(server)
        .get(apiRoute + validId)
        .expect(StatusCodes.NOT_FOUND, {
          message: ServerMessages.USER_NOT_FOUND,
        });
    });
  });

  describe('POST method', () => {
    it('should return user object with created valid id and with 201 status code, when POST request with body', async () => {
      const { statusCode, body } = await request(server)
        .post(apiRoute)
        .send(createUserDto);

      const isValidId = validate(body.id);
      userValidId = body.id;

      expect(statusCode).toStrictEqual(StatusCodes.CREATED);
      expect(isValidId).toBe(true);
      expect(body).toEqual({ ...createUserDto, id: body.id });
    });

    it('should return user object with 200 status code, when simple GET request with existing user id', async () => {
      const { statusCode, body } = await request(server).get(
        apiRoute + userValidId,
      );

      expect(statusCode).toEqual(StatusCodes.OK);
      expect(body).toEqual({ ...createUserDto, id: userValidId });
    });
  });

  describe('PUT method', () => {
    it('should return user object with updated data and with 200 status code, when PUT request with body', async () => {
      const { statusCode, body } = await request(server)
        .put(apiRoute + userValidId)
        .send(updateUserDto);

      const isValidId = validate(body.id);

      expect(statusCode).toStrictEqual(StatusCodes.OK);
      expect(isValidId).toBe(true);
      expect(body).toEqual({
        ...createUserDto,
        ...updateUserDto,
        id: userValidId,
      });
    });
  });
});
