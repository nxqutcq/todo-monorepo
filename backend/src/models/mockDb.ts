export interface IUserMock {
  id: string;
  email: string;
  passwordHash: string;
}

export interface ITodoMock {
  id: string;
  title: string;
  completed: boolean;
  userId: string;
}

export const usersDb: IUserMock[] = [];
export const todosDb: ITodoMock[] = [];
