import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  clearSessionToken,
  getSessionToken,
  loginUser,
  logoutUser,
  setSessionToken,
  validateSession,
} from "../api/masterApi";

const AuthContext = createContext(null);
const USER_STORAGE_KEY = "cattle_user";

function clearStoredAuthentication() {
  clearSessionToken();
  localStorage.removeItem(USER_STORAGE_KEY);
}

function storeAuthenticatedUser(user) {
  localStorage.setItem(
    USER_STORAGE_KEY,
    JSON.stringify(user)
  );
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /*
   * Restore login only after the backend confirms that the saved
   * session token is still valid and the account remains Active.
   * Browser-stored role data is never trusted by itself.
   */
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const token = getSessionToken();

      if (!token) {
        clearStoredAuthentication();
        if (!cancelled) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const response = await validateSession();

        if (
          !response ||
          response.success !== true ||
          !response.user
        ) {
          throw new Error(
            response?.error ||
              "Your session is no longer valid."
          );
        }

        if (!cancelled) {
          setUser(response.user);
          storeAuthenticatedUser(response.user);
        }
      } catch (error) {
        console.warn(
          "Session restoration failed:",
          error
        );

        clearStoredAuthentication();

        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  async function login(email, password) {
    try {
      clearStoredAuthentication();
      setUser(null);

      const response = await loginUser(
        String(email || "").trim().toLowerCase(),
        String(password || "")
      );

      if (
        response &&
        response.success === true &&
        response.user &&
        response.sessionToken
      ) {
        setSessionToken(response.sessionToken);
        setUser(response.user);
        storeAuthenticatedUser(response.user);

        return {
          success: true,
          user: response.user,
        };
      }

      clearStoredAuthentication();

      return {
        success: false,
        error:
          response?.error ||
          "Invalid email or password.",
      };
    } catch (error) {
      console.error(
        "Login request failed:",
        error
      );

      clearStoredAuthentication();

      return {
        success: false,
        error:
          error?.message ||
          "Login failed. Please check your connection.",
      };
    }
  }

  function logout() {
    /*
     * Start backend invalidation while the token is still available,
     * then clear browser state immediately for a responsive logout.
     */
    const logoutRequest = logoutUser().catch(
      (error) => {
        console.warn(
          "Backend logout failed:",
          error
        );
      }
    );

    setUser(null);
    clearStoredAuthentication();

    return logoutRequest;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
