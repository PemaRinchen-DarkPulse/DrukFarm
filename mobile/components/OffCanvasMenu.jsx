import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { getCurrentUser, onAuthChange } from '../lib/auth';

const SCREEN_WIDTH = Dimensions.get('window').width;
const MENU_WIDTH = SCREEN_WIDTH * 0.75;

export default function OffCanvasMenu({ visible, onClose }) {
  const navigation = useNavigation();
  const [slideAnim] = useState(new Animated.Value(-MENU_WIDTH));
  const [user, setUser] = useState(() => getCurrentUser());

  useEffect(() => {
    const off = onAuthChange(setUser);
    return off;
  }, []);

  const isFarmer = !!user && (String(user.role || '').toLowerCase() === 'farmer' || String(user.role || '').toLowerCase() === 'tshogpas');

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -MENU_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleNavigate = (screen) => {
    onClose();
    setTimeout(() => {
      navigation.navigate(screen);
    }, 300);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.menuContainer,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Support</Text>
              <Text style={styles.headerSubtitle}>How can we help you?</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Support Menu Items */}
          <View style={styles.menuContent}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigate('About')}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <Icon name="information-outline" size={22} color="#10b981" />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.menuItemText}>About Us</Text>
                <Text style={styles.menuItemSubtext}>Learn more about DrukFarm</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigate('Contact')}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <Icon name="email-outline" size={22} color="#10b981" />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.menuItemText}>Contact</Text>
                <Text style={styles.menuItemSubtext}>Get in touch with us</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigate('Help Center')}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <Icon name="help-circle-outline" size={22} color="#10b981" />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.menuItemText}>Help Center</Text>
                <Text style={styles.menuItemSubtext}>Find answers to common questions</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigate('Terms of Service')}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <Icon name="file-document-outline" size={22} color="#10b981" />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.menuItemText}>Terms of Service</Text>
                <Text style={styles.menuItemSubtext}>Read our terms & conditions</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigate('Privacy Policy')}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <Icon name="shield-check-outline" size={22} color="#10b981" />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.menuItemText}>Privacy Policy</Text>
                <Text style={styles.menuItemSubtext}>How we protect your data</Text>
              </View>
            </TouchableOpacity>

            {isFarmer && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigate('Farmer Guide')}
                activeOpacity={0.7}
              >
                <View style={styles.iconContainer}>
                  <Icon name="book-open-outline" size={22} color="#10b981" />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.menuItemText}>Farmer Guide</Text>
                  <Text style={styles.menuItemSubtext}>Tips & best practices</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex: 1,
  },
  menuContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: MENU_WIDTH,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 0,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '400',
  },
  closeButton: {
    padding: 4,
    marginTop: 4,
  },
  menuContent: {
    paddingTop: 16,
    paddingHorizontal: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 6,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  menuItemSubtext: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '400',
  },
});
