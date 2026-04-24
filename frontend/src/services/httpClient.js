import axios from "axios";
const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
  timeout: 15e3,
  headers: {
    "Content-Type": "application/json"
  }
});
export {
  httpClient
};
