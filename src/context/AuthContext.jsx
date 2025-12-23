import React, { createContext, useContext, useState, useEffect } from "react";
import { loginUser } from "../api/masterApi";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check LocalStorage on load to keep user logged in
  useEffect(() => {
    const storedUser = localStorage.getItem("cattle_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user", e);
        localStorage.removeItem("cattle_user");
      }
    }
    setLoading(false);
  }, []);

  // Login Function
  const login = async (email, password) => {
    try {
      const response = await loginUser(email, password);
      
      // If login is successful
      if (response && response.success) {
        const userData = response.user;
        setUser(userData);
        localStorage.setItem("cattle_user", JSON.stringify(userData));
        return { success: true };
      } 
      
      // If server returns a specific error
      if (response && response.error) {
        return { success: false, error: response.error };
      }

      return { success: false, error: "Incorrect credentials" };

    } catch (err) {
      console.error("Login Request Failed:", err);
      return { success: false, error: "Incorrect credentials" };
    }
  };

  // Logout Function
  const logout = () => {
    setUser(null);
    localStorage.removeItem("cattle_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Hook to use auth
export const useAuth = () => useContext(AuthContext);