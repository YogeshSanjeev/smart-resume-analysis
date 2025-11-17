interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
}

const AUTH_STORAGE_KEY = 'career_helper_auth';

export const authService = {
  login: (email: string, password: string): { success: boolean; error?: string } => {
    const users = JSON.parse(localStorage.getItem('career_helper_users') || '[]');
    const user = users.find((u: any) => u.email === email && u.password === password);

    if (user) {
      const authState: AuthState = {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        },
        token: btoa(`${user.id}:${Date.now()}`),
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
      return { success: true };
    }

    return { success: false, error: 'Invalid email or password' };
  },

  signup: (email: string, password: string, name: string): { success: boolean; error?: string } => {
    const users = JSON.parse(localStorage.getItem('career_helper_users') || '[]');

    if (users.some((u: any) => u.email === email)) {
      return { success: false, error: 'Email already exists' };
    }

    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }

    const newUser = {
      id: crypto.randomUUID(),
      email,
      password,
      name,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem('career_helper_users', JSON.stringify(users));

    const authState: AuthState = {
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        createdAt: newUser.createdAt,
      },
      token: btoa(`${newUser.id}:${Date.now()}`),
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));

    return { success: true };
  },

  logout: () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  },

  getCurrentUser: (): User | null => {
    const authData = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!authData) return null;

    try {
      const authState: AuthState = JSON.parse(authData);
      return authState.user;
    } catch {
      return null;
    }
  },

  isAuthenticated: (): boolean => {
    return !!authService.getCurrentUser();
  },
};
