import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCart } from '../services/api';

const AppContext = createContext(null);

export function AppProvider({ children }){
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('currentUser');
        if (raw) setUser(JSON.parse(raw));
      } catch {}
      try {
        const cart = await getCart();
        const count = Array.isArray(cart?.cart?.items) ? cart.cart.items.reduce((s,i)=> s + Number(i.quantity||0), 0) : 0;
        setCartCount(count);
      } catch {}
    })();
  }, []);

  const value = useMemo(() => ({ user, setUser, cartCount, setCartCount }), [user, cartCount]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(){
  return useContext(AppContext);
}
