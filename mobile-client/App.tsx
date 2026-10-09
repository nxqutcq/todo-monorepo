import React, { useState, useEffect } from "react";
import {
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
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { styles } from "./styles";

const API_URL = "https://51.20.85.74.sslip.io";
const LIMIT = 10;
const FILTERS = [
  { id: "all", label: "Все" },
  { id: "active", label: "Активные" },
  { id: "done", label: "Готово" },
  { id: "overdue", label: "Срок" },
] as const;

type TodoFilter = (typeof FILTERS)[number]["id"];

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  userId: string;
  attachmentKey?: string;
  dueDate?: string;
}

function formatDueDate(value?: string): string {
  if (!value) return "не указан";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "не указан";
  return date.toLocaleDateString("ru-RU");
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
  const [newDueDate, setNewDueDate] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [filter, setFilter] = useState<TodoFilter>("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  useEffect(() => {
    checkToken();
  }, []);

  useEffect(() => {
    if (screen === "todos") {
      fetchTodos();
    }
  }, [screen, filter, page]);

  const checkToken = async () => {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      setScreen("todos");
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("token");
    setTodos([]);
    setEmail("");
    setPassword("");
    setLoading(false);
    setScreen("auth");
  };

  const getHeaders = async (tokenOverride?: string) => {
    const token = tokenOverride || (await AsyncStorage.getItem("token"));
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const ensureAuthorized = async (res: Response): Promise<boolean> => {
    if (res.status === 401) {
      await handleLogout();
      return false;
    }
    return true;
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
          setPage(1);
          setScreen("todos");
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

  const fetchTodos = async () => {
    setLoading(true);
    try {
      const headers = await getHeaders();
      const res = await fetch(
        `${API_URL}/todos?filter=${filter}&page=${page}&limit=${LIMIT}`,
        { headers },
      );
      if (!(await ensureAuthorized(res))) return;
      if (res.ok) {
        const data = await res.json();
        setTodos(data.items);
        setTotal(data.total);
      }
    } catch (err) {
      setError("Не удалось загрузить задачи");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTodo = async () => {
    if (!newTitle.trim() || !newDueDate.trim()) {
      setError("Укажите текст и срок");
      return;
    }
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_URL}/todos`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: newTitle.trim(),
          dueDate: newDueDate.trim(),
        }),
      });
      if (!(await ensureAuthorized(res))) return;
      if (res.ok) {
        setNewTitle("");
        setNewDueDate("");
        setPage(1);
        fetchTodos();
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
      if (!(await ensureAuthorized(res))) return;
      if (res.ok) fetchTodos();
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
      if (!(await ensureAuthorized(res))) return;
      if (res.ok) {
        setEditingId(null);
        fetchTodos();
      }
    } catch (err) {
      setError("Ошибка обновления текста");
    }
  };

  const handleUploadAttachment = async (id: string) => {
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
      });
      if (picked.canceled || !picked.assets?.[0]) return;

      const file = picked.assets[0];
      const token = await AsyncStorage.getItem("token");
      const body = new FormData();
      body.append("file", {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || "application/octet-stream",
      } as never);

      const res = await fetch(`${API_URL}/todos/${id}/attachment`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body,
      });
      if (!(await ensureAuthorized(res))) return;
      if (res.ok) fetchTodos();
      else setError("Ошибка загрузки файла");
    } catch (err) {
      setError("Ошибка загрузки файла");
    }
  };

  const handleDownloadAttachment = async (id: string) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const target = `${FileSystem.cacheDirectory}attachment-${id}`;
      const result = await FileSystem.downloadAsync(
        `${API_URL}/todos/${id}/attachment`,
        target,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );
      if (result.status === 401) {
        await handleLogout();
        return;
      }
      if (result.status !== 200) {
        setError("Ошибка скачивания файла");
        return;
      }
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(result.uri);
      }
    } catch (err) {
      setError("Ошибка скачивания файла");
    }
  };

  const handleDeleteTodo = async (id: string) => {
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_URL}/todos/${id}`, {
        method: "DELETE",
        headers,
      });
      if (!(await ensureAuthorized(res))) return;
      if (res.ok) fetchTodos();
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

      {error ? (
        <Text style={[styles.errorText, { marginHorizontal: 20 }]}>
          {error}
        </Text>
      ) : null}

      <View style={styles.todoForm}>
        <TextInput
          style={[styles.input, { flex: 1, marginBottom: 8, marginRight: 8 }]}
          placeholder="Что нужно сделать?"
          placeholderTextColor="#4b5563"
          value={newTitle}
          onChangeText={setNewTitle}
        />
        <TextInput
          style={[styles.input, { width: 130, marginBottom: 8, marginRight: 8 }]}
          placeholder="ГГГГ-ММ-ДД"
          placeholderTextColor="#4b5563"
          value={newDueDate}
          onChangeText={setNewDueDate}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleCreateTodo}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.filterChip,
              filter === item.id && styles.filterChipActive,
            ]}
            onPress={() => {
              setFilter(item.id);
              setPage(1);
            }}
          >
            <Text
              style={[
                styles.filterChipText,
                filter === item.id && styles.filterChipTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color="#a1a1aa" />
      ) : (
        <FlatList
          data={todos}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.pagerText}>Задач нет</Text>
          }
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
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.todoText,
                      item.completed && styles.todoTextCompleted,
                    ]}
                  >
                    {item.title}
                  </Text>
                  <Text style={styles.dueText}>
                    Срок: {formatDueDate(item.dueDate)}
                  </Text>
                </View>
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
                  onPress={() => handleUploadAttachment(item.id)}
                  style={styles.actionBtn}
                >
                  <Text style={{ color: "#a1a1aa", fontSize: 12 }}>Файл</Text>
                </TouchableOpacity>
                {item.attachmentKey ? (
                  <TouchableOpacity
                    onPress={() => handleDownloadAttachment(item.id)}
                    style={styles.actionBtn}
                  >
                    <Text style={{ color: "#a1a1aa", fontSize: 12 }}>Скач.</Text>
                  </TouchableOpacity>
                ) : null}
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
      )}

      <View style={styles.pager}>
        <TouchableOpacity
          disabled={page <= 1}
          onPress={() => setPage((current) => Math.max(1, current - 1))}
        >
          <Text style={[styles.pagerText, page <= 1 && { opacity: 0.4 }]}>
            Назад
          </Text>
        </TouchableOpacity>
        <Text style={styles.pagerText}>
          Стр. {page} из {totalPages}
        </Text>
        <TouchableOpacity
          disabled={page >= totalPages}
          onPress={() => setPage((current) => current + 1)}
        >
          <Text
            style={[styles.pagerText, page >= totalPages && { opacity: 0.4 }]}
          >
            Дальше
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
