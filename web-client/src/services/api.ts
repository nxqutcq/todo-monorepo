const BASE_URL =
  import.meta.env.VITE_API_URL ?? "https://51.20.85.74.sslip.io";

export class UnauthorizedError extends Error {
  constructor() {
    super("Сессия истекла");
    this.name = "UnauthorizedError";
  }
}

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

async function parseResponse(res: Response) {
  if (res.status === 401) {
    localStorage.removeItem("token");
    throw new UnauthorizedError();
  }
  if (!res.ok) {
    let message = "Ошибка запроса";
    try {
      const data = await res.json();
      message = data.message || message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return res;
}

export type TodoFilter = "all" | "active" | "done" | "overdue";

export const api = {
  register: async (email: string, password: string) => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    await parseResponse(res);
    return res.json();
  },

  login: async (email: string, password: string) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    await parseResponse(res);
    const data = await res.json();
    if (data.token) localStorage.setItem("token", data.token);
    return data;
  },

  logout: () => {
    localStorage.removeItem("token");
  },

  getTodos: async (filter: TodoFilter = "all", page = 1, limit = 10) => {
    const params = new URLSearchParams({
      filter,
      page: String(page),
      limit: String(limit),
    });
    const res = await fetch(`${BASE_URL}/todos?${params}`, {
      headers: getHeaders(),
    });
    await parseResponse(res);
    return res.json() as Promise<{
      items: Array<{
        id: string;
        title: string;
        completed: boolean;
        userId: string;
        attachmentKey?: string;
        dueDate: string;
      }>;
      page: number;
      limit: number;
      total: number;
    }>;
  },

  createTodo: async (title: string, dueDate: string) => {
    const res = await fetch(`${BASE_URL}/todos`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ title, dueDate }),
    });
    await parseResponse(res);
    return res.json();
  },

  updateTodo: async (id: string, title?: string, completed?: boolean) => {
    const res = await fetch(`${BASE_URL}/todos/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ title, completed }),
    });
    await parseResponse(res);
    return res.json();
  },

  deleteTodo: async (id: string) => {
    const res = await fetch(`${BASE_URL}/todos/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    await parseResponse(res);
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
    await parseResponse(res);
    return res.json();
  },

  downloadAttachment: async (id: string) => {
    const res = await fetch(`${BASE_URL}/todos/${id}/attachment`, {
      headers: getHeaders(),
    });
    await parseResponse(res);
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
