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
import About from './screens/About';
import How from './screens/How';
import Contact from './screens/Contact';
import Dashboard from './screens/Dashboard';
import Products from './screens/Products';
import Cart from './screens/Cart';
import Checkout from './components/Checkout';
import MyOrders from './screens/MyOrders';
import Wishlist from './components/Wishlist';
import HelpCenter from './components/support/HelpCenter';
import TermsOfService from './components/support/TermsOfService';
import PrivacyPolicy from './components/support/PrivacyPolicy';
import FarmerGuide from './components/support/FarmerGuide';
import AccountSettings from './components/setting/AccountSettings';
import Scanner from './screens/Scanner';
// Components
import Navbar from './components/Navbar';
import BottomDock from './components/BottomDock';

const Stack = createNativeStackNavigator();

function MainLayout({ children }) {
  return (
    <View style={styles.container}>
      <Navbar />
      <View style={styles.content}>{children}</View>
      <BottomDock />
    </View>
  );
}

// Helper to wrap any screen with the common layout (Navbar + BottomDock)
const withMainLayout = (ScreenComponent) => (props) => (
  <MainLayout>
    <ScreenComponent {...props} />
  </MainLayout>
);

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'none' }}>
          {/* Screens with Navbar + BottomDock */}
          <Stack.Screen name="Home" component={withMainLayout(Home)} />
          <Stack.Screen name="About" component={withMainLayout(About)} />
          <Stack.Screen name="How It Works" component={withMainLayout(How)} />
          <Stack.Screen name="Contact" component={withMainLayout(Contact)} />
          <Stack.Screen name="Dashboard" component={withMainLayout(Dashboard)} />
          <Stack.Screen name="Products" component={withMainLayout(Products)} />
          <Stack.Screen name="Cart" component={withMainLayout(Cart)} />
          <Stack.Screen name="Checkout" component={withMainLayout(Checkout)} />
          <Stack.Screen name="My Orders" component={withMainLayout(MyOrders)} />
          <Stack.Screen name="Wishlist" component={withMainLayout(Wishlist)} />
          <Stack.Screen name="Help Center" component={withMainLayout(HelpCenter)} />
          <Stack.Screen name="Terms of Service" component={withMainLayout(TermsOfService)} />
          <Stack.Screen name="Privacy Policy" component={withMainLayout(PrivacyPolicy)} />
          <Stack.Screen name="Farmer Guide" component={withMainLayout(FarmerGuide)} />
          <Stack.Screen name="Account Settings" component={withMainLayout(AccountSettings)} />

          {/* Public screens without dock/navbar */}
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Register" component={Register} />

          {/* Modal Scanner */}
          <Stack.Screen
            name="Scanner"
            component={Scanner}
            options={{ presentation: 'modal', headerShown: false }}
          />

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
