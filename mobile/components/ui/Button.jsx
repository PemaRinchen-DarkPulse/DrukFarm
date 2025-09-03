import React from "react";
import { Text, Pressable, StyleSheet } from "react-native";

const VARIANTS = {
  default: {
    button: { backgroundColor: "#2563EB" }, // primary blue
    text: { color: "#fff" },
  },
  destructive: {
    button: { backgroundColor: "#DC2626" }, // red-600
    text: { color: "#fff" },
  },
  outline: {
    button: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB" },
    text: { color: "#111827" },
  },
  secondary: {
    button: { backgroundColor: "#6B7280" }, // gray-500
    text: { color: "#fff" },
  },
  ghost: {
    button: { backgroundColor: "transparent" },
    text: { color: "#111827" },
  },
  link: {
    button: { backgroundColor: "transparent" },
    text: { color: "#2563EB", textDecorationLine: "underline" },
  },
};

const SIZES = {
  default: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 6 },
  sm: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  lg: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  icon: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
};

export function Button({
  children,
  variant = "default",
  size = "default",
  onPress,
  style,
  textStyle,
  ...props
}) {
  const variantStyle = VARIANTS[variant] || VARIANTS.default;
  const sizeStyle = SIZES[size] || SIZES.default;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        sizeStyle,
        variantStyle.button,
        pressed && { opacity: 0.85 },
        style,
      ]}
      {...props}
    >
      <Text style={[styles.text, variantStyle.text, textStyle]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 14,
    fontWeight: "500",
  },
});
