export type User = {
  id: string;
  username: string;
  age: number;
  hobbies: string[];
};

export type ExtendedUser = User & {
  [key: string]: string | number | string[] | undefined;
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
};
