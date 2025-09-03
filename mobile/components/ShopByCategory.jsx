import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import api from "../lib/api"; // keep your API call

export default function ShopByCategory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const guessMimeFromBase64 = (b64) => {
      if (!b64 || typeof b64 !== "string") return null;
      const s = b64.slice(0, 12);
      if (s.startsWith("/9j/")) return "image/jpeg";
      if (s.startsWith("iVBORw0KG")) return "image/png";
      if (s.startsWith("R0lGODdh") || s.startsWith("R0lGODlh")) return "image/gif";
      if (s.startsWith("UklGR") || s.startsWith("RIFF")) return "image/webp";
      return "image/jpeg";
    };

    setLoading(true);
    Promise.all([api.fetchCategories(), api.fetchProducts()])
      .then(([cats = [], prods = []]) => {
        const countMap = prods.reduce((acc, p) => {
          const key = String(p.categoryId || "");
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});
        const mapped = cats.slice(0, 3).map((c) => {
          const mime = guessMimeFromBase64(c.imageBase64);
          const count = countMap[String(c.categoryId)] || 0;
          return {
            id: c.categoryId,
            title: c.categoryName,
            desc: c.description,
            count,
            bg: c.imageBase64 && mime ? `data:${mime};base64,${c.imageBase64}` : null,
          };
        });
        setItems(mapped);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Shop by Category</Text>
        <Text style={styles.subtitle}>
          Explore our wide range of fresh, locally sourced agricultural products
        </Text>
      </View>

      <View style={styles.grid}>
        {(loading
          ? Array.from({ length: 3 }).map((_, idx) => ({
              id: `sk-${idx}`,
              title: "Loading…",
              desc: " ",
              bg: null,
            }))
          : items
        ).map((cat) => {
          const content = (
            <View style={styles.overlay}>
              <Text style={[styles.catTitle, cat.bg && styles.textWhite]}>
                {cat.title}
              </Text>
              <Text style={[styles.catDesc, cat.bg && styles.textWhite]}>
                {cat.desc}
              </Text>
              {typeof cat.count === "number" && (
                <View
                  style={[
                    styles.badge,
                    cat.bg ? styles.badgeLight : styles.badgeDark,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      cat.bg ? styles.badgeTextDark : styles.badgeTextLight,
                    ]}
                  >
                    {cat.count > 0 ? `${cat.count}+` : "0"} products
                  </Text>
                </View>
              )}
            </View>
          );

          return (
            <TouchableOpacity
              key={cat.id}
              style={styles.card}
              activeOpacity={0.8}
              onPress={() =>
                !loading && navigation.navigate("Products", { category: cat.title })
              }
            >
              {cat.bg ? (
                <ImageBackground
                  source={{ uri: cat.bg }}
                  style={styles.bg}
                  imageStyle={styles.bgImg}
                >
                  <View style={styles.dim} />
                  {content}
                </ImageBackground>
              ) : (
                content
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={styles.browseBtn}
        onPress={() => navigation.navigate("Categories")}
      >
        <Text style={styles.browseText}>Browse All Categories →</Text>
      </TouchableOpacity>

      {loading && (
        <ActivityIndicator size="large" color="#065f46" style={{ marginTop: 20 }} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "transparent",
    padding: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#065f46", // emerald-800
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "rgba(4,120,87,0.8)", // emerald-700/80
    textAlign: "center",
  },
  grid: {
    flexDirection: "column",
    gap: 16,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ecfdf5", // emerald-50
    backgroundColor: "#fff",
    padding: 16,
    height: 200,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  bg: {
    flex: 1,
    justifyContent: "center",
  },
  bgImg: {
    borderRadius: 12,
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
  },
  overlay: {
    alignItems: "center",
    justifyContent: "center",
  },
  catTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#065f46",
    marginBottom: 8,
    textAlign: "center",
  },
  catDesc: {
    fontSize: 16,
    color: "#4b5563",
    marginBottom: 12,
    textAlign: "center",
  },
  textWhite: {
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeDark: {
    backgroundColor: "#ecfdf5", // emerald-50
  },
  badgeLight: {
    backgroundColor: "rgba(255,255,255,0.85)",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  badgeTextLight: {
    color: "#065f46",
  },
  badgeTextDark: {
    color: "#064e3b",
  },
  browseBtn: {
    alignSelf: "center",
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    elevation: 2,
  },
  browseText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#065f46",
  },
});
