import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setUnauthorizedHandler, tokenStore } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));
  const [config, setConfig] = useState({ collegeDomains: [], emailDevMode: false });
  // Dev email mode only: the verification link returned by register/resend.
  const [devLink, setDevLink] = useState(null);

  const signOut = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setDevLink(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(signOut);
    api('/auth/config').then(setConfig).catch(() => {});
    if (!tokenStore.get()) return;
    api('/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, [signOut]);

  // Any response shaped { token, user } signs the user in.
  const acceptSession = useCallback((data) => {
    setDevLink(data?.devLink || null);
    if (data?.token) tokenStore.set(data.token);
    if (data?.user) setUser(data.user);
    return data;
  }, []);

  const login = useCallback((email, password) => api('/auth/login', { method: 'POST', body: { email, password } }).then(acceptSession), [acceptSession]);
  const register = useCallback((form) => api('/auth/register', { method: 'POST', body: form }).then(acceptSession), [acceptSession]);

  const value = useMemo(
    () => ({ user, setUser, loading, config, login, register, signOut, acceptSession, devLink, setDevLink }),
    [user, loading, config, login, register, signOut, acceptSession, devLink],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
