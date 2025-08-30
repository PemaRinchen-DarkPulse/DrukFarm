import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import HomeScreen from './src/screens/HomeScreen';
import ProductsScreen from './src/screens/ProductsScreen';
import CartScreen from './src/screens/CartScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LoginScreen from './src/screens/LoginScreen';
import ScanScreen from './src/screens/ScanScreen';
import { AppProvider, useApp } from './src/context/AppContext';
import { View } from 'react-native';
import BottomDock from './src/components/BottomDock';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

function TabNavigator() {
  return (
  <Tabs.Navigator
      screenOptions={({ route }) => ({
    headerShown: false,
    tabBarActiveTintColor: '#047857',
    tabBarInactiveTintColor: '#64748b',
    tabBarStyle: { display: 'none' },
    tabBarShowLabel: false,
        tabBarIcon: ({ color, size }) => {
          const map = {
            Cart: 'cart-outline',
            Orders: 'cube-outline',
            Scan: 'qr-code-outline',
            Profile: 'person-circle-outline',
            Home: 'home-outline',
            Products: 'pricetags-outline',
          };
          const name = map[route.name] || 'ellipse-outline';
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
  <Tabs.Screen name="Cart" component={CartScreen} options={{ title: 'Cart' }} />
  <Tabs.Screen name="Orders" component={OrdersScreen} options={{ title: 'Orders' }} />
  <Tabs.Screen name="Scan" component={ScanScreen} options={{ title: 'Scan' }} />
  <Tabs.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tabs.Navigator>
  );
}

function RootWithDock(){
  return (
    <View style={{ flex: 1 }}>
      <TabNavigator />
      <BottomDock />
    </View>
  );
}

function Shell() {
  const scheme = useColorScheme();
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <NavigationContainer theme={scheme === 'dark' ? DarkTheme : DefaultTheme}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} translucent={false} backgroundColor={scheme === 'dark' ? '#000' : '#ffffff'} />
        <Stack.Navigator>
          <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Products" component={ProductsScreen} options={{ title: 'Products' }} />
          <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Login' }} />
          <Stack.Screen name="Root" component={RootWithDock} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
}

export default function App(){
  return (
    <SafeAreaProvider>
      <AppProvider>
        <Shell />
      </AppProvider>
    </SafeAreaProvider>
  );
}
