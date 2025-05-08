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
