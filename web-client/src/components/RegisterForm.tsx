import React, { useState } from "react";
import { api } from "../services/api.js";

interface RegisterFormProps {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  onSwitchToLogin,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      await api.register(email, password);
      setSuccessMessage("Регистрация успешна! Перенаправление на вход...");
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      const errorObject = err as Error;
      setError(errorObject.message || "Ошибка при регистрации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-400 bg-red-950/50 border border-red-800 rounded">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="p-3 text-sm text-emerald-400 bg-emerald-950/50 border border-emerald-800 rounded">
          {successMessage}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-zinc-400 mb-1">
          Email
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded focus:outline-none focus:border-zinc-600 text-zinc-200"
          placeholder="your@email.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-400 mb-1">
          Пароль
        </label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded focus:outline-none focus:border-zinc-600 text-zinc-200"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-zinc-200 hover:bg-zinc-300 text-zinc-900 font-medium rounded transition duration-200 disabled:opacity-50"
      >
        {loading ? "Создание..." : "Создать аккаунт"}
      </button>

      <p className="text-center text-sm text-zinc-500">
        Уже есть аккаунт?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-zinc-300 hover:underline focus:outline-none"
        >
          Войти
        </button>
      </p>
    </form>
  );
};
