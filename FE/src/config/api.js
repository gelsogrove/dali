// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = {
  async get(endpoint) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  },

  async post(endpoint, data) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  },
};

export const endpoints = {
  blogs: '/blogs',
  blogBySlug: (slug) => `/blogs/slug/${slug}`,
  properties: '/properties',
  propertyBySlug: (slug) => `/properties/slug/${slug}`,
  homeData: '/home',
};
