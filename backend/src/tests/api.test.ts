import request from "supertest";
import app from "../app.js";
import { usersDb, todosDb } from "../models/mockDb.js";

describe("Тестирование API согласно ТЗ", () => {
  beforeEach(() => {
    usersDb.length = 0;
    todosDb.length = 0;
  });

  it("Должен успешно зарегистрировать и авторизовать пользователя, вернув JWT", async () => {
    const userData = { email: "user@test.com", password: "password123" };

    const registerRes = await request(app)
      .post("/auth/register")
      .send(userData);
    expect(registerRes.status).toBe(201);

    const loginRes = await request(app).post("/auth/login").send(userData);

    expect(loginRes.status).toBe(200);
    expect(loginRes.body).toHaveProperty("token");
  });

  it("Чужая задача должна быть недоступна для изменения и удаления", async () => {
    const user1 = { id: "user1_id", email: "u1@t.com", passwordHash: "hash1" };
    const user2 = { id: "user2_id", email: "u2@t.com", passwordHash: "hash2" };
    usersDb.push(user1, user2);

    const todoUser1 = {
      id: "todo_id_1",
      title: "Задача первого",
      completed: false,
      userId: "user1_id",
    };
    todosDb.push(todoUser1);

    const loginRes = await request(app)
      .post("/auth/register")
      .send({ email: "u2@test.com", password: "password123" });

    const authRes = await request(app)
      .post("/auth/login")
      .send({ email: "u2@test.com", password: "password123" });

    const tokenUser2 = authRes.body.token;

    const updateRes = await request(app)
      .put(`/todos/${todoUser1.id}`)
      .set("Authorization", `Bearer ${tokenUser2}`)
      .send({ title: "Хакерская атака", completed: true });

    expect(updateRes.status).toBe(403);
    expect(updateRes.body.message).toBe("Нет доступа к чужой задаче");

    const deleteRes = await request(app)
      .delete(`/todos/${todoUser1.id}`)
      .set("Authorization", `Bearer ${tokenUser2}`);

    expect(deleteRes.status).toBe(403);
  });

  it("Должен возвращать ошибку 400 при отправке невалидных данных", async () => {
    const badRegisterRes = await request(app)
      .post("/auth/register")
      .send({ email: "nopassword@test.com" });

    expect(badRegisterRes.status).toBe(400);

    await request(app)
      .post("/auth/register")
      .send({ email: "todo@test.com", password: "123" });
    const auth = await request(app)
      .post("/auth/login")
      .send({ email: "todo@test.com", password: "123" });
    const token = auth.body.token;

    const badTodoRes = await request(app)
      .post("/todos")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(badTodoRes.status).toBe(400);
    expect(badTodoRes.body.message).toBe("Текст задачи обязателен");
  });
});
