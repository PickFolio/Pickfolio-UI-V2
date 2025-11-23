// This function will be called by the login form.
// It keeps the 'fetch' logic out of the component.
export const loginUser = async (username, password, deviceInfo) => {
  const response = await fetch(import.meta.env.VITE_AUTH_API_URL + '/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, deviceInfo }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Login failed');
  }

  return data; // Returns the tokens
};

export const registerUser = async ({ name, username, password }) => {
  const response = await fetch(import.meta.env.VITE_AUTH_API_URL + '/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, username, password }),
  });

  if (!response.ok) {
    // Try to parse the error message from the backend
    const data = await response.json();
    throw new Error(data.message || 'Registration failed');
  }

  return { success: true };
};