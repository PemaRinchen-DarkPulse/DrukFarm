// App.jsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens
import Home from './screens/HomePage';
import Login from './screens/Login';
import Register from './screens/Register';

// Components
import Navbar from './components/Navbar';
import BottomDock from './components/BottomDock';

const Stack = createNativeStackNavigator();

// Layout wrapper with Navbar + BottomDock
function MainLayout({ children }) {
  return (
    <View style={styles.container}>
      <Navbar />
      <View style={styles.content}>{children}</View>
      <BottomDock />
    </View>
  );
}

// Example: Home screen wrapped with layout
function HomeWithLayout() {
  return (
    <MainLayout>
      <Home />
    </MainLayout>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {/* Screens with Navbar + BottomDock */}
          <Stack.Screen name="Home" component={HomeWithLayout} />

          {/* Public screens without dock/navbar */}
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Register" component={Register} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
});
