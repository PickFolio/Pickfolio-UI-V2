import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { refreshAccessToken } from '../services/authService';

const useAuthFetch = () => {
  const { tokens, login, logout } = useAuth();

  const authFetch = useCallback(async (url, options = {}) => {
    // 1. Pre-check: Ensure we have an access token before attempting fetch
    if (!tokens?.accessToken) {
      logout();
      throw new Error('User not authenticated');
    }

    // Helper function to perform the actual fetch with a given token
    const doFetch = async (accessToken) => {
      const fetchOptions = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers, // Merge custom headers
          'Authorization': `Bearer ${accessToken}`,
        },
      };
      return fetch(url, fetchOptions);
    };

    // 2. Initial Request: Try with the current access token
    let response = await doFetch(tokens.accessToken);

    // 3. Handle 401 Unauthorized (Token Expired)
    if (response.status === 401) {
      try {
        // Attempt to refresh the token
        // Device is 'WebApp' for now but can be dynamic in future implementations
        const deviceInfo = "WebApp";

        if (!tokens.refreshToken) {
            throw new Error("No refresh token available");
        }

        const newTokens = await refreshAccessToken(tokens.refreshToken, deviceInfo);

        // Update context and local storage with new tokens
        login(newTokens);

        // 4. Retry Request: Try again with the new access token
        response = await doFetch(newTokens.accessToken);

      } catch (refreshError) {
        // If refresh fails (token expired, invalid, etc.), log the user out
        console.error("Token refresh failed:", refreshError);
        logout();
        throw new Error('Session expired. Please log in again.');
      }
    }

    // 5. General Error Handling
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // robust parsing: check for 'message' (custom) OR 'error' (standard Spring Boot)
      const errorMessage = errorData.message || errorData.error || 'An unexpected server error occurred.';

      throw new Error(errorMessage);
    }

    // 6. Success: Return parsed JSON or null
    const responseText = await response.text();
    return responseText ? JSON.parse(responseText) : null;

  }, [tokens, login, logout]);

  return authFetch;
};

export default useAuthFetch;