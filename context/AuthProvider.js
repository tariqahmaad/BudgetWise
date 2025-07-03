import React, { createContext, useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";

export const AuthContext = createContext({ user: null });

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribe = null;

    try {
      if (!auth) {
        console.error("Firebase Auth not initialized");
        setError("Firebase configuration error");
        setLoading(false);
        return;
      }

      unsubscribe = onAuthStateChanged(auth,
        (currentUser) => {
          console.log(
            "Auth state changed:",
            currentUser ? currentUser.uid : "No user"
          );
          setUser(currentUser);
          setError(null);
          setLoading(false);
        },
        (authError) => {
          console.error("Auth state change error:", authError);
          setError(authError.message);
          setUser(null);
          setLoading(false);
        }
      );
    } catch (initError) {
      console.error("Auth initialization error:", initError);
      setError("Authentication initialization failed");
      setLoading(false);
    }

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  if (loading) {
    return null;
  }

  if (error) {
    console.error("AuthProvider error:", error);
    // Still provide context to prevent crashes in child components
  }

  return (
    <AuthContext.Provider value={{ user, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};
