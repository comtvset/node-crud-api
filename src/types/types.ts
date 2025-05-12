export type User = {
  id: string;
  username: string;
  age: number;
  hobbies: string[];
};

export type ExtendedUser = User & {
  id: string;
  username: string;
  age: number;
  hobbies: string[];
  [key: string]: unknown;
};

export type DBType = {
  users: User[];
};

export type Endpoint = {
  path: string;
  method: string;
  description: string;
};

export type Greeting = {
  message: string;
  availableEndpoints: Endpoint[];
};

export type ResultWithUser = {
  user: User | undefined;
  userId: string;
};

export type IPCMessage =
  | { type: 'addUser'; data: User }
  | { type: 'addUserResponse'; data: User }
  | { type: 'getUsers' }
  | { type: 'getUsersResponse'; data: User[] }
  | { type: 'deleteUser'; userId: string }
  | { type: 'deleteUserResponse'; success: boolean }
  | { type: 'updateUser'; userId: string; data: Partial<User> }
  | {
      error: string;
      type: 'updateUserResponse';
      success: boolean;
      updatedUser?: User;
    };
