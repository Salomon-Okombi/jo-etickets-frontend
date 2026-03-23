import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000/api",
  withCredentials: true, // nécessaire pour panier visiteur (cookie session)
  headers: { "Content-Type": "application/json" },
});