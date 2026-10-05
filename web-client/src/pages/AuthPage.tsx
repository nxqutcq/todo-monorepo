import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoginForm } from "../components/LoginForm.jsx";
import { RegisterForm } from "../components/RegisterForm.jsx";

export const AuthPage: React.FC = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    navigate("/todos");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md p-8 bg-zinc-900/40 border border-zinc-800/80 rounded-lg shadow-xl backdrop-blur-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
            {isLoginView ? "Вход в систему" : "Регистрация"}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {isLoginView
              ? "Введите свои данные для доступа к задачам"
              : "Создайте новый аккаунт"}
          </p>
        </div>

        {isLoginView ? (
          <LoginForm
            onSuccess={handleLoginSuccess}
            onSwitchToRegister={() => setIsLoginView(false)}
          />
        ) : (
          <RegisterForm
            onSuccess={() => setIsLoginView(true)}
            onSwitchToLogin={() => setIsLoginView(true)}
          />
        )}
      </div>
    </div>
  );
};
