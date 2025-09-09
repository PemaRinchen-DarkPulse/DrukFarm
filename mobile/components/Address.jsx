import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Modal,
  Switch,
  Alert,
} from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { fetchDzongkhags, fetchTownsByDzongkhag, fetchUserAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress } from '../lib/api';
import { getCurrentCid } from '../lib/auth';

const iconOptions = [
    { name: 'home', label: 'Home' },
    { name: 'briefcase', label: 'Work' },
    { name: 'school', label: 'School' },
    { name: 'location', label: 'Other' },
];
const LIST_MAX = 160;

// CustomDropdown Component (Unchanged)
function CustomDropdown({ options, value, onChange, placeholder = 'Select…', disabled = false, isOpen, onToggle }) {
    const handleSelect = useCallback((option) => {
        onChange(option);
        onToggle();
    }, [onChange, onToggle]);
    const triggerStyle = disabled ? [styles.dropdownTrigger, styles.disabledInput] : styles.dropdownTrigger;
    return (
        <View style={styles.dropdownWrap}>
            <TouchableOpacity style={triggerStyle} activeOpacity={0.8} onPress={onToggle}>
                <Text style={[styles.dropdownText, !value && styles.placeholder, disabled && styles.disabledText]} numberOfLines={1}>
                    {value || placeholder}
                </Text>
                <ChevronDown size={16} color={disabled ? '#9ca3af' : "#059669"} style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }} />
            </TouchableOpacity>
            {isOpen && (
                <View style={styles.dropdownList}>
                    <ScrollView style={{ maxHeight: LIST_MAX }} nestedScrollEnabled>
                        {options.map((opt, index) => {
                            const optionValue = typeof opt === 'string' ? opt : (opt?.name || opt?.dzongkhag || String(opt));
                            const uniqueKey = `${optionValue}_${index}`;
                            return (
                                <TouchableOpacity
                                    key={uniqueKey}
                                    style={[styles.dropdownItem, value === optionValue && styles.dropdownItemActive]}
                                    activeOpacity={0.85}
                                    onPress={() => handleSelect(optionValue)}
                                >
                                    <Text style={styles.dropdownItemText}>{optionValue}</Text>
                                    {value === optionValue ? <Check size={16} color="#059669" /> : null}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            )}
        </View>
    );
}


// --- MODIFIED: AddressCard component updated to display place and dzongkhag on separate lines ---
const AddressCard = ({ address, onDelete, onToggleDefault }) => (
  <View style={styles.addressCard}>
    <View style={styles.addressContent}>
      <View style={[styles.iconContainer, { backgroundColor: getIconColor(address.icon) }]}>
        <Ionicons name={address.icon} size={20} color="white" />
      </View>
      <View style={styles.addressTextContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.addressTitle}>{address.title}</Text>
          <View style={styles.switchContainer}>
            {address.isDefault && <Text style={styles.defaultLabel}>DEFAULT</Text>}
            <Switch
              value={address.isDefault}
              onValueChange={() => onToggleDefault(address._id)}
              trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
              thumbColor={address.isDefault ? '#fff' : '#f4f3f4'}
              ios_backgroundColor="#E0E0E0"
            />
          </View>
        </View>
        {/* --- MODIFIED: Display place and dzongkhag on separate lines --- */}
        <Text style={styles.addressPlaceText}>{address.place}</Text>
        <Text style={styles.addressDzongkhagText}>{address.dzongkhag}</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => onDelete(address._id)}
          >
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </View>
);

// Helper function to get icon color (Unchanged)
const getIconColor = (iconName) => {
  const colors = {
    home: '#4CAF50',
    briefcase: '#2196F3',
    school: '#FF9800',
    location: '#9C27B0',
  };
  return colors[iconName] || '#757575';
};


const Address = ({ navigation }) => {
  const [addresses, setAddresses] = useState([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [locationTitle, setLocationTitle] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('home');
  const [selectedDzongkhag, setSelectedDzongkhag] = useState('');
  const [selectedTown, setSelectedTown] = useState('');
  const [dzongkhagList, setDzongkhagList] = useState([]);
  const [townsList, setTownsList] = useState([]);
  const [loadingDzongkhags, setLoadingDzongkhags] = useState(false);
  const [loadingTowns, setLoadingTowns] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserAddresses();
  }, []);

  const loadUserAddresses = async () => {
    try {
      setLoading(true);
      const userCid = getCurrentCid();
      if (!userCid) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }
      
      const userAddresses = await fetchUserAddresses(userCid);
      const addressList = Array.isArray(userAddresses) ? userAddresses : [];
      setAddresses(addressList);
    } catch (error) {
      console.error('Error loading addresses:', error);
      setAddresses([]);
      Alert.alert('Error', 'Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadDzongkhags = async () => {
        try {
            setLoadingDzongkhags(true);
            const data = await fetchDzongkhags();
            const dzongkhags = Array.isArray(data) ? data.filter(item => typeof item === 'string') : [];
            setDzongkhagList(dzongkhags);
        } catch (error) {
            console.error('Failed to fetch dzongkhags:', error);
            setDzongkhagList([]);
        } finally {
            setLoadingDzongkhags(false);
        }
    };
    if (isModalVisible) {
      loadDzongkhags();
    }
  }, [isModalVisible]);

  useEffect(() => {
    const loadTowns = async (dzongkhag) => {
        try {
            setLoadingTowns(true);
            const data = await fetchTownsByDzongkhag(dzongkhag);
            const towns = Array.isArray(data) ? data.filter(item => typeof item === 'string') : [];
            setTownsList(towns);
        } catch (error) {
            console.error('Failed to fetch towns:', error);
            setTownsList([]);
        } finally {
            setLoadingTowns(false);
        }
    };
    if (selectedDzongkhag) {
      loadTowns(selectedDzongkhag);
    } else {
      setTownsList([]);
    }
  }, [selectedDzongkhag]);

  const handleFormSubmit = async () => {
    try {
      if (!locationTitle.trim() || !selectedDzongkhag || !selectedTown) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      const userCid = getCurrentCid();
      if (!userCid) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      const newAddressData = { 
        userCid,
        title: locationTitle.trim(), 
        icon: selectedIcon, 
        dzongkhag: selectedDzongkhag, 
        place: selectedTown,
        isDefault: addresses.length === 0
      };

      await createAddress(newAddressData);
      
      await loadUserAddresses();
      setModalVisible(false);
      setLocationTitle('');
      setSelectedIcon('home');
      setSelectedDzongkhag('');
      setSelectedTown('');
      setOpenDropdown(null);
      
      Alert.alert('Success', 'Address saved successfully');
    } catch (error) {
      console.error('Error saving address:', error);
      Alert.alert('Error', 'Failed to save address');
    }
  };

  const handleDeleteAddress = async (addressId) => {
    const addressToDelete = addresses.find(addr => addr._id === addressId);
    if (!addressToDelete) return;
    
    if (addresses.length === 1) {
      Alert.alert('Error', 'Cannot delete the only address.');
      return;
    }
    
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAddress(addressId);
              
              if (addressToDelete.isDefault && addresses.length > 1) {
                const remainingAddresses = addresses.filter(addr => addr._id !== addressId);
                if (remainingAddresses.length > 0) {
                  await setDefaultAddress(remainingAddresses[0]._id);
                }
              }
              
              await loadUserAddresses();
              Alert.alert('Success', 'Address deleted successfully');
            } catch (error) {
              console.error('Error deleting address:', error);
              Alert.alert('Error', 'Failed to delete address');
            }
          }
        }
      ]
    );
  };

  const handleToggleDefault = async (addressId) => {
    try {
      const targetAddress = addresses.find(addr => addr._id === addressId);
      if (!targetAddress) return;
      
      if (targetAddress.isDefault) {
        if (addresses.length > 1) {
          Alert.alert('Info', 'Cannot remove default status. Please set another address as default first.');
        } else {
          Alert.alert('Info', 'Cannot remove default status from the only address.');
        }
        return;
      }
      
      await setDefaultAddress(addressId);
      await loadUserAddresses();
      Alert.alert('Success', 'Default address updated');
    } catch (error) {
      console.error('Error toggling default address:', error);
      Alert.alert('Error', 'Failed to update default address');
    }
  };
  
  const toggleDropdown = (dropdownName) => {
    setOpenDropdown(prev => (prev === dropdownName ? null : dropdownName));
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.page}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { if (navigation?.canGoBack()) navigation.goBack(); }}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Delivery Addresses</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={[styles.addressListContainer, { alignItems: 'center', justifyContent: 'center' }]}>
          <Text>Loading addresses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.page}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
            <View style={styles.card}>
              <View>
                  <Text style={styles.title}>Add New Address</Text>
                  <Text style={styles.subtitle}>Enter the details for your new address.</Text>
              </View>
              
              <View style={styles.formContainer}> 
                <View style={{ gap: 12 }}>
                  <View>
                    <Text style={styles.label}>Location Title</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., My Home, Office"
                      placeholderTextColor="#9ca3af"
                      value={locationTitle}
                      onChangeText={setLocationTitle}
                      onFocus={() => setOpenDropdown(null)}
                    />
                  </View>

                  <View onStartShouldSetResponder={() => { setOpenDropdown(null); return false; }}>
                    <Text style={styles.label}>Icon</Text>
                     <View style={styles.iconSelectionContainer}>
                        {iconOptions.map((icon) => (
                            <TouchableOpacity
                                key={icon.name}
                                style={[ styles.iconWrapper, selectedIcon === icon.name && styles.selectedIconWrapper ]}
                                onPress={() => setSelectedIcon(icon.name)}
                            >
                                <Ionicons name={icon.name} size={24} color={selectedIcon === icon.name ? '#059669' : '#555'} />
                                <Text style={[styles.iconLabel, selectedIcon === icon.name && styles.selectedIconLabel]}>
                                    {icon.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                  </View>
                  
                  <View>
                    <Text style={[styles.label, { marginBottom: 4 }]}>Dzongkhag</Text>
                    <CustomDropdown
                      options={dzongkhagList}
                      value={selectedDzongkhag}
                      onChange={(value) => {
                        setSelectedDzongkhag(value);
                        setSelectedTown('');
                      }}
                      placeholder={loadingDzongkhags ? "Loading..." : "Select Dzongkhag"}
                      disabled={loadingDzongkhags}
                      isOpen={openDropdown === 'dzongkhag'}
                      onToggle={() => toggleDropdown('dzongkhag')}
                    />
                  </View>

                  <View>
                    <Text style={[styles.label, { marginBottom: 4 }]}>Place Name</Text>
                    <CustomDropdown
                      options={townsList}
                      value={selectedTown}
                      onChange={setSelectedTown}
                      placeholder={
                        !selectedDzongkhag ? "Select Dzongkhag first" :
                        loadingTowns ? "Loading towns..." :
                        townsList.length === 0 ? "No towns available" :
                        "Select Town"
                      }
                      disabled={!selectedDzongkhag || loadingTowns || townsList.length === 0}
                      isOpen={openDropdown === 'town'}
                      onToggle={() => toggleDropdown('town')}
                    />
                  </View>
                </View>
              </View>
              
              <View style={{paddingTop: 15, marginTop: 'auto'}}>
                <TouchableOpacity style={styles.button} onPress={handleFormSubmit}>
                  <Text style={styles.buttonText}>Save Address</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{marginTop: 10}} onPress={() => setModalVisible(false)}>
                  <Text style={{textAlign: 'center', color: '#64748b', fontSize: 13}}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
        </View>
      </Modal>

      {/* Main Screen Content */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { if (navigation?.canGoBack()) navigation.goBack(); }}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Addresses</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.addressListContainer}>
        <View style={styles.addressList}>
          {addresses.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No addresses found</Text>
              <Text style={styles.emptyStateSubtext}>Add your first delivery address</Text>
            </View>
          ) : (
            addresses.map((address) => {
              if (!address || !address._id) {
                return null;
              }
              return (
                <AddressCard 
                  key={address._id} 
                  address={address} 
                  onDelete={handleDeleteAddress}
                  onToggleDefault={handleToggleDefault}
                />
              );
            }).filter(Boolean)
          )}
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={20} color="white" style={styles.addIcon} />
          <Text style={styles.addButtonText}>Add New Address</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Main Screen Styles
  page: { flex: 1, backgroundColor: '#F5F7FB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  addressListContainer: { flex: 1 },
  addressList: { padding: 16 },
  addressCard: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  addressContent: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  addressTextContainer: { flex: 1, marginLeft: 12 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  addressTitle: { fontSize: 16, fontWeight: '600', color: '#000' },
  switchContainer: { flexDirection: 'row', alignItems: 'center' },
  defaultLabel: { fontSize: 10, fontWeight: 'bold', color: '#4CAF50', backgroundColor: '#E8F5E9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 8, overflow: 'hidden' },
  // --- MODIFIED: Replaced 'addressText' with specific styles for each line ---
  addressPlaceText: { fontSize: 14, color: '#333' },
  addressDzongkhagText: { fontSize: 12, color: '#666', marginTop: 2 },
  buttonContainer: { padding: 16, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#E0E0E0' },
  addButton: { backgroundColor: '#059669', borderRadius: 8, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  addIcon: { marginRight: 8 },
  addButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  
  // Modal & Form Styles
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.6)' },
  card: {
    width: '90%',
    maxWidth: 384,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    height: 600, 
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    display: 'flex',
    flexDirection: 'column',
  },
  title: { fontSize: 22, fontWeight: '600', textAlign: 'center' },
  // --- MODIFIED: Reduced marginTop to decrease space between header and sub-header ---
  subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 4, marginBottom: 12 },
  formContainer: { 
    marginTop: 20, 
  }, 
  label: { fontSize: 12, fontWeight: '500', color: '#374151' },
  input: { marginTop: 4, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827' },
  disabledInput: { backgroundColor: '#f3f4f6' },
  disabledText: { color: '#9ca3af' },
  button: { backgroundColor: '#059669', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
  dropdownTrigger: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dropdownText: { fontSize: 14, color: '#111827', flex: 1, marginRight: 8 },
  placeholder: { color: '#9ca3af' },
  dropdownWrap: { position: 'relative' },
  dropdownList: {
    position: 'absolute', left: 0, right: 0, top: '100%', marginTop: 6, backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    elevation: 12, zIndex: 20,
  },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 12 },
  dropdownItemActive: { backgroundColor: '#ecfdf5' },
  dropdownItemText: { fontSize: 14, color: '#111827' },
  iconSelectionContainer: {
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconWrapper: {
    width: 65,
    height: 65,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  selectedIconWrapper: {
    borderColor: '#059669',
    backgroundColor: '#ecfdf5',
    borderWidth: 2,
  },
    iconLabel: {
    marginTop: 4,
    fontSize: 12,
    color: '#374151',
  },
  selectedIconLabel: {
    color: '#059669',
    fontWeight: '600',
  },
  
  // Action buttons and empty state
  actionButtons: {
    flexDirection: 'row',
    marginTop: 12, // Increased margin for better spacing from address text
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#059669',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  deleteButton: {
    borderColor: '#ef4444',
  },
  deleteButtonText: {
    color: '#ef4444',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
});

export default Address;