const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const api = {
  // Auth endpoints
  auth: {
    login: async (credentials) => {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      return response.json();
    },
    register: async (userData) => {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      return response.json();
    },
  },

  // Goals endpoints
  goals: {
    getAll: async (token) => {
      const response = await fetch(`${API_URL}/goals`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      return response.json();
    },
    create: async (goalData, token) => {
      const response = await fetch(`${API_URL}/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(goalData),
      });
      return response.json();
    },
  },

  // Savings endpoints
  savings: {
    getAll: async (token) => {
      const response = await fetch(`${API_URL}/savings`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      return response.json();
    },
    create: async (savingsData, token) => {
      const response = await fetch(`${API_URL}/savings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(savingsData),
      });
      return response.json();
    },
  },

  // Notifications endpoints
  notifications: {
    getAll: async (token) => {
      const response = await fetch(`${API_URL}/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      return response.json();
    },
  },
};