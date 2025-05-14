import http from 'node:http';
import { EventEmitter } from 'events';
import { methodGet } from '../src/services/methodGet';
import { methodPost } from '../src/services/methodPost';
import { methodPut } from '../src/services/methodPut';

import { dataBase } from '../src/data/dataBase';

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

    expect(parsed).toEqual(dataBase.users);
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

describe('POST /api/users/', () => {
  let req: http.IncomingMessage;
  let res: Partial<http.ServerResponse>;

  beforeEach(() => {
    res = {
      writeHead: jest.fn(),
      end: jest.fn(),
    };
  });

  it('should return status 201', async () => {
    req = new EventEmitter() as http.IncomingMessage;
    req.url = '/api/users/';
    req.method = 'POST';

    const newUser = { username: 'Mike', age: 35, hobbies: ['coding', 'reading', 'snowboarding'] };

    const handlerPromise = new Promise<void>((resolve) => {
      (res.end as jest.Mock).mockImplementation(() => resolve());

      methodPost(req, res as http.ServerResponse);
    });

    req.emit('data', JSON.stringify(newUser));
    req.emit('end');

    await handlerPromise;

    expect(res.writeHead).toHaveBeenCalledWith(201, { 'Content-Type': 'application/json' });
    const endArg = (res.end as jest.Mock).mock.calls[0][0];
    const parsed = JSON.parse(endArg);

    expect(parsed).toMatchObject({
      username: 'Mike',
      age: 35,
      hobbies: ['coding', 'reading', 'snowboarding'],
      id: expect.any(String),
    });
  });
});

describe('PUT /api/users/id', () => {
  let req: http.IncomingMessage;
  let res: Partial<http.ServerResponse>;

  beforeEach(() => {
    res = {
      writeHead: jest.fn(),
      end: jest.fn(),
    };
  });

  it('should return status 200', async () => {
    req = new EventEmitter() as http.IncomingMessage;
    req.url = '/api/users/';
    req.method = 'POST';

    const newUser = { username: 'Mike', age: 35, hobbies: ['coding', 'reading', 'snowboarding'] };

    const handlerPromise = new Promise<void>((resolve) => {
      (res.end as jest.Mock).mockImplementation(() => resolve());

      methodPost(req, res as http.ServerResponse);
    });

    req.emit('data', JSON.stringify(newUser));
    req.emit('end');

    await handlerPromise;

    const createdUserRaw = (res.end as jest.Mock).mock.calls[0][0];
    const createdUser = JSON.parse(createdUserRaw);
    const userId = createdUser.id;

    (res.writeHead as jest.Mock).mockClear();
    (res.end as jest.Mock).mockClear();

    req = new EventEmitter() as http.IncomingMessage;
    req.url = `/api/users/${userId}`;
    req.method = 'PUT';

    const updatedData = {
      username: 'Hubert',
      hobbies: ['music'],
      email: 'example@gmail.com',
    };

    const putPromise = new Promise<void>((resolve) => {
      (res.end as jest.Mock).mockImplementation(() => resolve());
      methodPut(req, res as http.ServerResponse);
    });

    req.emit('data', JSON.stringify(updatedData));
    req.emit('end');

    await putPromise;

    expect(res.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'application/json' });

    const putResponseRaw = (res.end as jest.Mock).mock.calls[0][0];
    const updatedUser = JSON.parse(putResponseRaw);

    expect(updatedUser).toMatchObject({
      id: userId,
      username: 'Hubert',
      age: 35,
      hobbies: ['music'],
      email: 'example@gmail.com',
    });
  });
});
