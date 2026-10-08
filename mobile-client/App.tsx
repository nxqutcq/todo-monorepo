import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { styles } from "./styles";

const API_URL = "http://192.168.1.139:5000";

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  userId: string;
}

export default function App() {
  const [screen, setScreen] = useState<"auth" | "todos">("auth");
  const [isLoginView, setIsLoginView] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  useEffect(() => {
    checkToken();
  }, []);

  const checkToken = async () => {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      setScreen("todos");
      fetchTodos(token);
    }
  };

  const getHeaders = async (tokenOverride?: string) => {
    const token = tokenOverride || (await AsyncStorage.getItem("token"));
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Заполните все поля");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const endpoint = isLoginView ? "/auth/login" : "/auth/register";
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Ошибка запроса");

      if (isLoginView) {
        if (data.token) {
          await AsyncStorage.setItem("token", data.token);
          setScreen("todos");
          fetchTodos(data.token);
        }
      } else {
        setIsLoginView(true);
        setError("Регистрация успешна! Войдите.");
      }
    } catch (err: any) {
      setError(err.message || "Сетевая ошибка бэкенда");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("token");
    setTodos([]);
    setEmail("");
    setPassword("");
    setScreen("auth");
  };

  const fetchTodos = async (tokenOverride?: string) => {
    try {
      const headers = await getHeaders(tokenOverride);
      const res = await fetch(`${API_URL}/todos`, { headers });
      if (res.ok) {
        const data = await res.json();
        setTodos(data);
      }
    } catch (err) {
      setError("Не удалось загрузить задачи");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTodo = async () => {
    if (!newTitle.trim()) return;
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_URL}/todos`, {
        method: "POST",
        headers,
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      if (res.ok) {
        const newTodo = await res.json();
        setTodos((prev) => [...prev, newTodo]);
        setNewTitle("");
      }
    } catch (err) {
      setError("Ошибка создания задачи");
    }
  };

  const handleToggleTodo = async (id: string, currentStatus: boolean) => {
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_URL}/todos/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ completed: !currentStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
      }
    } catch (err) {
      setError("Ошибка изменения статуса");
    }
  };

  const handleSaveTitle = async (id: string) => {
    if (!editingTitle.trim()) return;
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_URL}/todos/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ title: editingTitle.trim() }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
        setEditingId(null);
      }
    } catch (err) {
      setError("Ошибка обновления текста");
    }
  };

  const handleDeleteTodo = async (id: string) => {
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_URL}/todos/${id}`, {
        method: "DELETE",
        headers,
      });
      if (res.ok) {
        setTodos((prev) => prev.filter((t) => String(t.id) !== String(id)));
      }
    } catch (err) {
      setError("Ошибка удаления");
    }
  };

  if (screen === "auth") {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.authCard}>
          <Text style={styles.title}>
            {isLoginView ? "Вход в систему" : "Регистрация"}
          </Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#4b5563"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            placeholder="Пароль"
            placeholderTextColor="#4b5563"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#09090b" />
            ) : (
              <Text style={styles.buttonText}>
                {isLoginView ? "Войти" : "Создать аккаунт"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setIsLoginView(!isLoginView);
              setError("");
            }}
          >
            <Text style={styles.switchText}>
              {isLoginView
                ? "Нет аккаунта? Зарегистрироваться"
                : "Уже есть аккаунт? Войти"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Мои задачи</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Выйти</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.todoForm}>
        <TextInput
          style={[styles.input, { flex: 1, marginBottom: 0, marginRight: 8 }]}
          placeholder="Что нужно сделать?"
          placeholderTextColor="#4b5563"
          value={newTitle}
          onChangeText={setNewTitle}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleCreateTodo}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={todos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={styles.todoItem}>
            <TouchableOpacity
              style={[
                styles.checkbox,
                item.completed && styles.checkboxChecked,
              ]}
              onPress={() => handleToggleTodo(item.id, item.completed)}
            />

            {editingId === item.id ? (
              <TextInput
                style={styles.editInput}
                value={editingTitle}
                onChangeText={setEditingTitle}
                onSubmitEditing={() => handleSaveTitle(item.id)}
                autoFocus
              />
            ) : (
              <Text
                style={[
                  styles.todoText,
                  item.completed && styles.todoTextCompleted,
                ]}
              >
                {item.title}
              </Text>
            )}

            <View style={styles.actions}>
              {editingId === item.id ? (
                <TouchableOpacity
                  onPress={() => handleSaveTitle(item.id)}
                  style={styles.actionBtn}
                >
                  <Text style={{ color: "#34d399", fontSize: 12 }}>ОК</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    setEditingId(item.id);
                    setEditingTitle(item.title);
                  }}
                  style={styles.actionBtn}
                >
                  <Text style={{ color: "#a1a1aa", fontSize: 12 }}>Ред.</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => handleDeleteTodo(item.id)}
                style={styles.actionBtn}
              >
                <Text style={{ color: "#f87171", fontSize: 12 }}>Удал.</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}