import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Ensure URL ends with trailing slash if no query parameters
  if (config.url) {
    if (config.url.includes("?")) {
      // Split URL into base and query parts
      const [base, query] = config.url.split("?");
      // Add trailing slash to base if needed, then recombine
      config.url = `${base.endsWith("/") ? base : base + "/"}?${query}`;
    } else if (!config.url.endsWith("/")) {
      config.url = `${config.url}/`;
    }
  }
  return config;
});

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
