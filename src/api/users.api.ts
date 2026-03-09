import { api } from "@/api/axiosClient";
import type { Paginated, User, UserListParams, UserRegisterPayload, UserUpdatePayload } from "@/types/users";

// si axiosClient.baseURL = http://localhost:8000/api
const USERS_BASE = "/utilisateurs/";

function isPaginated<T>(data: any): data is Paginated<T> {
  return data && typeof data === "object" && Array.isArray(data.results) && typeof data.count === "number";
}

function joinUrl(base: string, part: string) {
  const b = base.endsWith("/") ? base : `${base}/`;
  const p = part.startsWith("/") ? part.slice(1) : part;
  return `${b}${p}`;
}

export async function listUsers(params: UserListParams = {}): Promise<Paginated<User>> {
  const { data } = await api.get<Paginated<User> | User[]>(USERS_BASE, { params });
  if (isPaginated<User>(data)) return data;

  const arr = Array.isArray(data) ? data : [];
  return { count: arr.length, next: null, previous: null, results: arr };
}

export async function getUser(id: number): Promise<User> {
  const url = joinUrl(USERS_BASE, `${id}/`);
  const { data } = await api.get<User>(url);
  return data;
}

export async function createUser(payload: UserRegisterPayload): Promise<User> {
  //  admin create = POST /api/utilisateurs/ (pas register)
  const { data } = await api.post<User>(USERS_BASE, payload);
  return data;
}

export async function updateUser(id: number, payload: UserUpdatePayload & { password?: string }): Promise<User> {
  const url = joinUrl(USERS_BASE, `${id}/`);
  const { data } = await api.patch<User>(url, payload);
  return data;
}

export async function deleteUser(id: number): Promise<void> {
  const url = joinUrl(USERS_BASE, `${id}/`);
  await api.delete(url);
}