import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

// Import screens
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Features from "./pages/Features";
import Category from "./pages/Category";
import How from "./pages/How";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Management from "./pages/Management";
import Profile from "./pages/Profile";
import Cart from "./pages/Cart";
import BuyProducts from "./pages/BuyProducts";
import Orders from "./pages/Orders";
import Scanner from "./pages/Scanner";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tabs for main app navigation
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false, // we’ll use our own headers if needed
        tabBarStyle: { height: 60 },
        tabBarLabelStyle: { fontSize: 12 },
      }}
    >
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Features" component={Features} />
      <Tab.Screen name="Categories" component={Category} />
      <Tab.Screen name="Profile" component={Profile} />
      <Tab.Screen name="Cart" component={Cart} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false, // hide default headers
        }}
      >
        {/* Auth screens */}
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={Register} />

        {/* Main app after login */}
        <Stack.Screen name="MainTabs" component={MainTabs} />

        {/* Extra routes */}
        <Stack.Screen name="How" component={How} />
        <Stack.Screen name="About" component={About} />
        <Stack.Screen name="Contact" component={Contact} />
        <Stack.Screen name="Management" component={Management} />
        <Stack.Screen name="Buy" component={BuyProducts} />
        <Stack.Screen name="Orders" component={Orders} />
        <Stack.Screen name="Scanner" component={Scanner} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
