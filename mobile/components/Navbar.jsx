import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Mic, LayoutDashboard, Heart, Menu } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { getCurrentUser, onAuthChange } from '../lib/auth';
import OffCanvasMenu from './OffCanvasMenu';

export default function Navbar() {
  const navigation = useNavigation();
  const [user, setUser] = useState(() => getCurrentUser());
  const [search, setSearch] = useState('');
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  useEffect(() => {
    const off = onAuthChange(setUser);
    return off;
  }, []);

  const navigateToDashboard = () => {
    navigation.navigate('Dashboard');
  };

  const navigateToWishlist = () => {
    navigation.navigate('Wishlist'); // replace with your Wishlist screen
  };

  const canAccessDashboard = !!user && ['farmer', 'transporter', 'tshogpas'].includes(String(user.role || '').toLowerCase());

  return (
    <>
      <OffCanvasMenu 
        visible={isMenuVisible} 
        onClose={() => setIsMenuVisible(false)} 
      />
      
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>

        {/* Hamburger Menu Icon */}
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setIsMenuVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.menuIconContainer}>
            <Menu size={20} color="#ffffff" strokeWidth={2.5} />
          </View>
        </TouchableOpacity>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={18} color="#6b7280" style={{ marginLeft: 8 }} />
          <TextInput
            placeholder="Type to search..."
            placeholderTextColor="#9ca3af"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            onSubmitEditing={() => {
              const q = String(search || '').trim();
              navigation.navigate('Products', q ? { query: q } : {});
            }}
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent?.key === 'Enter') {
                const q = String(search || '').trim();
                navigation.navigate('Products', q ? { query: q } : {});
              }
            }}
          />
          <Mic size={18} color="#6b7280" style={{ marginRight: 8 }} />
        </View>

        {/* Icons on Right Side */}
        <View style={styles.rightIcons}>
          {canAccessDashboard && (
            <TouchableOpacity 
              style={styles.navItem}
              onPress={navigateToDashboard}
            >
              <LayoutDashboard size={26} color="#374151" />
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={styles.navItem} 
            onPress={navigateToWishlist}
          >
            <Heart size={26} color="#DC2626" />
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 64,
  },
  menuButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 24,
    marginRight: 4,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    fontSize: 14,
    color: '#111827',
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  // no disabled style needed since we hide the icon when access is not allowed
});