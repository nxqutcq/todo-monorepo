import request from "supertest";
import app from "../app.js";
import { User } from "../models/User.js";
import { Todo } from "../models/Todo.js";
import { connectDb, disconnectDb } from "../db.js";
import { getMongoUri } from "../config.js";

function testMongoUri(): string {
  return getMongoUri().replace(/mongodb\.net\/[^?]*/, "mongodb.net/todo_test");
}

describe("Тестирование API согласно ТЗ", () => {
  beforeAll(async () => {
    await connectDb(testMongoUri());
  }, 30000);

  afterEach(async () => {
    await User.deleteMany({});
    await Todo.deleteMany({});
  });

  afterAll(async () => {
    await disconnectDb();
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
    await request(app)
      .post("/auth/register")
      .send({ email: "u1@test.com", password: "password123" });
    const user1Auth = await request(app)
      .post("/auth/login")
      .send({ email: "u1@test.com", password: "password123" });

    const created = await request(app)
      .post("/todos")
      .set("Authorization", `Bearer ${user1Auth.body.token}`)
      .send({ title: "Задача первого" });

    await request(app)
      .post("/auth/register")
      .send({ email: "u2@test.com", password: "password123" });
    const user2Auth = await request(app)
      .post("/auth/login")
      .send({ email: "u2@test.com", password: "password123" });

    const updateRes = await request(app)
      .put(`/todos/${created.body.id}`)
      .set("Authorization", `Bearer ${user2Auth.body.token}`)
      .send({ title: "Хакерская атака", completed: true });

    expect(updateRes.status).toBe(403);
    expect(updateRes.body.message).toBe("Нет доступа к чужой задаче");

    const deleteRes = await request(app)
      .delete(`/todos/${created.body.id}`)
      .set("Authorization", `Bearer ${user2Auth.body.token}`);

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
