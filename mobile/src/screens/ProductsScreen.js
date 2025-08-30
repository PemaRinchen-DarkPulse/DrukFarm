import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { fetchProducts } from '../services/api';

export default function ProductsScreen(){
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async ()=>{
      try {
        const list = await fetchProducts();
        if (mounted) setData(list);
      } catch (e) {
        if (mounted) setData([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, []);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => String(item.productId)}
      contentContainerStyle={{ padding: 12 }}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.imageWrap}>
            <Image style={styles.image} source={item.productImageBase64 ? { uri: `data:image/jpeg;base64,${item.productImageBase64}` } : require('../../assets/icon.png')} />
          </View>
          <View style={{ padding: 12 }}>
            <Text style={styles.title}>{item.productName}</Text>
            <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
            <Text style={styles.price}>Nu. {item.price} <Text style={styles.unit}>/{item.unit}</Text></Text>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#dcfce7', marginBottom: 12 },
  imageWrap: { height: 160, backgroundColor: '#ecfdf5' },
  image: { width: '100%', height: '100%' },
  title: { fontSize: 16, fontWeight: '700', color: '#064e3b' },
  desc: { marginTop: 6, color: '#475569' },
  price: { marginTop: 6, fontSize: 18, fontWeight: '800', color: '#065f46' },
  unit: { fontSize: 14, fontWeight: '600', color: '#64748b' },
});
