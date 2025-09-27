import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

const useAuthFetch = () => {
  const { tokens, logout } = useAuth(); // We can add token refresh logic here later

  const authFetch = useCallback(async (url, options = {}) => {
    if (!tokens?.accessToken) {
      // This case should ideally not be hit if routes are protected
      logout();
      throw new Error('User not authenticated');
    }

    const fetchOptions = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        'Authorization': `Bearer ${tokens.accessToken}`,
      },
    };

    const response = await fetch(url, fetchOptions);

    if (response.status === 401) {
      // If the token is expired or invalid, log the user out.
      logout();
      throw new Error('Session expired. Please log in again.');
    }

    if (!response.ok) {
        // Try to parse the error message from the backend
        const errorData = await response.json().catch(() => ({ message: 'An unexpected server error occurred.' }));
        throw new Error(errorData.message);
    }

    // Handle cases with no response body (like a POST request with 200 OK)
    const responseText = await response.text();
    return responseText ? JSON.parse(responseText) : null;

  }, [tokens, logout]);

  return authFetch;
};

export default useAuthFetch;