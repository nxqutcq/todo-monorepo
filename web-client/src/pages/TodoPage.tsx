import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, UnauthorizedError, type TodoFilter } from "../services/api.js";

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  userId: string;
  attachmentKey?: string;
  dueDate: string;
}

const FILTERS: { id: TodoFilter; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "active", label: "Активные" },
  { id: "done", label: "Выполненные" },
  { id: "overdue", label: "Просроченные" },
];

export const TodoPage: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TodoFilter>("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const navigate = useNavigate();
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const handleUnauthorized = useCallback(() => {
    api.logout();
    navigate("/", { replace: true });
  }, [navigate]);

  const loadTodos = useCallback(
    async (nextFilter = filter, nextPage = page) => {
      setLoading(true);
      try {
        const data = await api.getTodos(nextFilter, nextPage, limit);
        setTodos(data.items);
        setTotal(data.total);
        setPage(data.page);
      } catch (err) {
        if (err instanceof UnauthorizedError) {
          handleUnauthorized();
          return;
        }
        const errorObject = err as Error;
        setError(errorObject.message || "Не удалось загрузить задачи");
      } finally {
        setLoading(false);
      }
    },
    [filter, page, handleUnauthorized],
  );

  useEffect(() => {
    void loadTodos(filter, page);
  }, [filter, page, loadTodos]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDueDate) return;

    try {
      await api.createTodo(newTitle.trim(), newDueDate);
      setNewTitle("");
      setNewDueDate("");
      await loadTodos(filter, 1);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        handleUnauthorized();
        return;
      }
      const errorObject = err as Error;
      setError(errorObject.message || "Ошибка при создании задачи");
    }
  };

  const handleToggleCompleted = async (id: string, currentStatus: boolean) => {
    try {
      await api.updateTodo(id, undefined, !currentStatus);
      await loadTodos();
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        handleUnauthorized();
        return;
      }
      const errorObject = err as Error;
      setError(errorObject.message || "Ошибка при изменении статуса");
    }
  };

  const startEditing = (id: string, title: string) => {
    setEditingId(id);
    setEditingTitle(title);
  };

  const handleSaveTitle = async (id: string) => {
    if (!editingTitle.trim()) return;
    try {
      await api.updateTodo(id, editingTitle.trim(), undefined);
      setEditingId(null);
      await loadTodos();
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        handleUnauthorized();
        return;
      }
      const errorObject = err as Error;
      setError(errorObject.message || "Ошибка при сохранении текста");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteTodo(id);
      await loadTodos();
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        handleUnauthorized();
        return;
      }
      const errorObject = err as Error;
      setError(errorObject.message || "Ошибка при удалении задачи");
    }
  };

  const handleLogout = () => {
    api.logout();
    navigate("/", { replace: true });
  };

  const handleUpload = async (id: string, file?: File) => {
    if (!file) return;
    try {
      await api.uploadAttachment(id, file);
      await loadTodos();
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        handleUnauthorized();
        return;
      }
      const errorObject = err as Error;
      setError(errorObject.message || "Ошибка при загрузке файла");
    }
  };

  const handleDownload = async (id: string) => {
    try {
      await api.downloadAttachment(id);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        handleUnauthorized();
        return;
      }
      const errorObject = err as Error;
      setError(errorObject.message || "Ошибка при скачивании файла");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-6 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
              Мои задачи
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Создание, редактирование и выполнение задач
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-sm font-medium rounded transition duration-200"
          >
            Выйти
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="flex flex-wrap gap-2 mb-4">
          <input
            type="text"
            required
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Что нужно сделать?"
            className="flex-1 min-w-[12rem] px-4 py-2 bg-zinc-900 border border-zinc-800 rounded focus:outline-none focus:border-zinc-600 text-zinc-200 placeholder-zinc-600"
          />
          <input
            type="date"
            required
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
            className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded focus:outline-none focus:border-zinc-600 text-zinc-200"
          />
          <button
            type="submit"
            className="px-5 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-900 font-medium rounded transition duration-200"
          >
            Добавить
          </button>
        </form>

        <div className="flex flex-wrap gap-2 mb-6">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setFilter(item.id);
                setPage(1);
              }}
              className={`text-xs px-3 py-1 rounded border ${
                filter === item.id
                  ? "bg-zinc-200 text-zinc-900 border-zinc-200"
                  : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-zinc-500 text-center py-4">
            Загрузка списка задач...
          </p>
        ) : todos.length === 0 ? (
          <p className="text-zinc-600 text-center py-8 border border-dashed border-zinc-900 rounded-lg">
            У вас пока нет добавленных задач.
          </p>
        ) : (
          <div className="space-y-2">
            {todos.map((todo) => (
              <div
                key={todo.id}
                className="flex items-center justify-between p-4 bg-zinc-900/40 border border-zinc-900 rounded-lg hover:border-zinc-800/80 transition"
              >
                <div className="flex items-center gap-3 flex-1 mr-4">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() =>
                      handleToggleCompleted(todo.id, todo.completed)
                    }
                    className="w-4 h-4 rounded bg-zinc-950 border-zinc-800 text-zinc-400 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />

                  {editingId === todo.id ? (
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleSaveTitle(todo.id)
                      }
                      className="flex-1 px-2 py-1 bg-zinc-950 border border-zinc-800 rounded focus:outline-none text-zinc-200 text-sm"
                      autoFocus
                    />
                  ) : (
                    <div>
                      <span
                        className={`text-sm tracking-wide transition-all ${
                          todo.completed
                            ? "line-through text-zinc-600"
                            : "text-zinc-300"
                        }`}
                      >
                        {todo.title}
                      </span>
                      <p className="text-xs text-zinc-500 mt-1">
                        Срок: {new Date(todo.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 flex-wrap justify-end">
                  {editingId === todo.id ? (
                    <button
                      onClick={() => handleSaveTitle(todo.id)}
                      className="text-xs px-2 py-1 bg-emerald-950/60 border border-emerald-800 text-emerald-400 rounded hover:bg-emerald-900/50"
                    >
                      Сохранить
                    </button>
                  ) : (
                    <button
                      onClick={() => startEditing(todo.id, todo.title)}
                      className="text-xs px-2 py-1 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded hover:text-zinc-200 hover:border-zinc-700"
                    >
                      Редактировать
                    </button>
                  )}

                  <label className="text-xs px-2 py-1 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded hover:text-zinc-200 hover:border-zinc-700 cursor-pointer">
                    Файл
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) =>
                        handleUpload(todo.id, e.target.files?.[0])
                      }
                    />
                  </label>

                  {todo.attachmentKey ? (
                    <button
                      onClick={() => handleDownload(todo.id)}
                      className="text-xs px-2 py-1 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded hover:text-zinc-200 hover:border-zinc-700"
                    >
                      Скачать
                    </button>
                  ) : null}

                  <button
                    onClick={() => handleDelete(todo.id)}
                    className="text-xs px-2 py-1 bg-zinc-900 border border-zinc-800 text-red-400/80 rounded hover:text-red-400 hover:border-red-900/50"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-6 text-sm text-zinc-400">
          <button
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="px-3 py-1 border border-zinc-800 rounded disabled:opacity-40"
          >
            Назад
          </button>
          <span>
            Стр. {page} из {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
            className="px-3 py-1 border border-zinc-800 rounded disabled:opacity-40"
          >
            Дальше
          </button>
        </div>
      </div>
    </div>
  );
};
