/*
Author: Aubin Mugisha
Date: December 1, 2025

Main entry point for React app. Configures axios with JWT authentication
and uses proxy from package.json to avoid CORS issues with backend.
*/

import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";

// Load JWT token from localStorage and attach to all requests
const token = localStorage.getItem('access_token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Intercept 401 responses to handle expired tokens
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.response?.data?.message?.includes('expired')) {
      // Token expired - clear storage and redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_id');
      delete axios.defaults.headers.common['Authorization'];
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
