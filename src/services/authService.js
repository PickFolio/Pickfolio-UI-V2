import { apiRequest, endpoints } from './api';

export const loginUser = async (username, password, deviceInfo) => {
  return apiRequest(endpoints.auth.login, {
    method: 'POST',
    body: { username, password, deviceInfo },
  });
};

export const registerUser = async ({ name, username, password }) => {
  await apiRequest(endpoints.auth.register, {
    method: 'POST',
    body: { name, username, password },
  });
  return { success: true };
};

export const refreshAccessToken = async (refreshToken, deviceInfo) => {
  return apiRequest(endpoints.auth.refresh, {
    method: 'POST',
    body: { refreshToken, deviceInfo },
  });
};

export const logoutUser = async (refreshToken) => apiRequest(endpoints.auth.logout, {
  method: 'POST',
  body: { refreshToken },
});

export const logoutAllDevices = async (authFetch) => authFetch(endpoints.auth.logoutAll, { method: 'POST' });
