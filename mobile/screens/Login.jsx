import React from 'react';
import AuthLayout from '../components/AuthLayout';

export default function Login({ route }) {
  const returnTo = route?.params?.returnTo;
  return <AuthLayout mode="login" returnTo={returnTo} />;
}
