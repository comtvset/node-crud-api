import http from 'node:http';

import { methodGet } from '../src/services/methodGet';
import { dateBase } from '../src/data/dataBase';

jest.spyOn(console, 'log').mockImplementation(() => {});

describe('GET /api/users', () => {
  let req: http.IncomingMessage;
  let res: http.ServerResponse;

  it('should return all users with status 200', async () => {
    req = {
      url: '/api/users',
      method: 'GET',
    } as http.IncomingMessage;

    res = {
      writeHead: jest.fn(),
      end: jest.fn(),
    } as unknown as http.ServerResponse;

    await methodGet(req, res);

    expect(res.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'application/json' });
    const endCallArg = (res.end as jest.Mock).mock.calls[0][0];
    const parsed = JSON.parse(endCallArg);

    expect(parsed).toEqual(dateBase.users);
  });

  it('should return error with status 400 (Bad Request, Invalid user ID format)', async () => {
    req = {
      url: '/api/users/invalid_user_ID_format',
      method: 'GET',
    } as http.IncomingMessage;

    res = {
      writeHead: jest.fn(),
      end: jest.fn(),
    } as unknown as http.ServerResponse;

    await methodGet(req, res);

    expect(res.writeHead).toHaveBeenCalledWith(400, { 'Content-Type': 'application/json' });

    const responseBody = JSON.parse((res.end as jest.Mock).mock.calls[0][0]);
    expect(responseBody).toEqual({
      error: 'Bad Request',
      message: 'Invalid user ID format',
    });
  });

  it('should return error with status 404 (Not Found, User ID not found)', async () => {
    req = {
      url: '/api/users/4e914a81-c1cf-4e99-8727-f2c229bc9b23',
      method: 'GET',
    } as http.IncomingMessage;

    res = {
      writeHead: jest.fn(),
      end: jest.fn(),
    } as unknown as http.ServerResponse;

    await methodGet(req, res);

    expect(res.writeHead).toHaveBeenCalledWith(404, { 'Content-Type': 'application/json' });

    const responseBody = JSON.parse((res.end as jest.Mock).mock.calls[0][0]);
    expect(responseBody).toEqual({
      error: 'Not Found',
      message: 'User ID not found',
    });
  });
});

describe('GET /some-non/existing/resource', () => {
  let req: http.IncomingMessage;
  let res: http.ServerResponse;

  it('should return error with status 404 (Not Found, Resource does not exist)', async () => {
    req = {
      url: '/some-non/existing/resource',
      method: 'GET',
    } as http.IncomingMessage;

    res = {
      writeHead: jest.fn(),
      end: jest.fn(),
    } as unknown as http.ServerResponse;

    await methodGet(req, res);

    expect(res.writeHead).toHaveBeenCalledWith(404, { 'Content-Type': 'application/json' });

    const responseBody = JSON.parse((res.end as jest.Mock).mock.calls[0][0]);
    expect(responseBody).toEqual({
      error: 'Not Found',
      message: 'Resource does not exist',
    });
  });
});
