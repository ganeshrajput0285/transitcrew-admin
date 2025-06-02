// src/services/api.js
import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

// Add auth token to requests if needed
API.interceptors.request.use((req) => {
  const adminToken = localStorage.getItem("adminToken");
  if (adminToken) {
    req.headers.Authorization = `Bearer ${adminToken}`;
  }
  return req;
});

export default API;
