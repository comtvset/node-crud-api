export type User = {
  id: string;
  username: string;
  age: string;
  hobbies: string[];
};

export type DBType = {
  users: User[];
};
