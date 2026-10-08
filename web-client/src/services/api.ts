const BASE_URL =
  import.meta.env.VITE_API_URL ?? "https://51.20.85.74.sslip.io";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const api = {
  register: async (email: string, password: string) => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok)
      throw new Error((await res.json()).message || "Ошибка регистрации");
    return res.json();
  },

  login: async (email: string, password: string) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error((await res.json()).message || "Ошибка входа");
    const data = await res.json();
    if (data.token) localStorage.setItem("token", data.token);
    return data;
  },

  logout: () => {
    localStorage.removeItem("token");
  },

  getTodos: async () => {
    const res = await fetch(`${BASE_URL}/todos`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Не удалось загрузить задачи");
    return res.json();
  },

  createTodo: async (title: string) => {
    const res = await fetch(`${BASE_URL}/todos`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ title }),
    });
    if (!res.ok) throw new Error("Не удалось создать задачу");
    return res.json();
  },

  updateTodo: async (id: string, title?: string, completed?: boolean) => {
    const res = await fetch(`${BASE_URL}/todos/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ title, completed }),
    });
    if (!res.ok) throw new Error("Не удалось обновить задачу");
    return res.json();
  },

  deleteTodo: async (id: string) => {
    const res = await fetch(`${BASE_URL}/todos/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Не удалось удалить задачу");
    return res.json();
  },

  uploadAttachment: async (id: string, file: File) => {
    const token = localStorage.getItem("token");
    const body = new FormData();
    body.append("file", file);
    const res = await fetch(`${BASE_URL}/todos/${id}/attachment`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body,
    });
    if (!res.ok) throw new Error("Не удалось загрузить файл");
    return res.json();
  },

  downloadAttachment: async (id: string) => {
    const res = await fetch(`${BASE_URL}/todos/${id}/attachment`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Не удалось скачать файл");
    const blob = await res.blob();
    const disposition = res.headers.get("Content-Disposition") || "";
    const match = disposition.match(/filename="?([^"]+)"?/);
    const filename = match?.[1] || "attachment";
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  },
};
