import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const show = useCallback((message, opts = {}) => {
    const id = Date.now() + Math.random()
    setToasts((s) => [...s, { id, message, ...opts }])
    if (!opts.persistent) {
      setTimeout(() => {
        setToasts((s) => s.filter((t) => t.id !== id))
      }, opts.duration || 3000)
    }
  }, [])

  const remove = useCallback((id) => {
    setToasts((s) => s.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ show, remove }}>
      {children}
      <View pointerEvents="box-none" style={styles.container}>
        {toasts.map((t) => (
          <Toast key={t.id} {...t} onHide={() => remove(t.id)} />
        ))}
      </View>
    </ToastContext.Provider>
  )
}

function Toast({ message, variant, onHide }) {
  const translateY = useRef(new Animated.Value(-100)).current

  useEffect(() => {
    // slide in
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
    }).start()
  }, [translateY])

  const isError = variant === 'error' || variant === 'destructive'
  const backgroundColor = isError ? '#DC2626' : '#2563EB' // red-600 / blue-600

  return (
    <Animated.View
      style={[
        styles.toast,
        { backgroundColor, transform: [{ translateY }] },
      ]}
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export default ToastProvider

const { width } = Dimensions.get('window')
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 40,
    alignSelf: 'center',
    width: width * 0.9,
    zIndex: 9999,
  },
  toast: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  text: {
    color: '#fff',
    fontSize: 16,
  },
})
