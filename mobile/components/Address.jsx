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
  // KeyboardAvoidingView and Platform are no longer needed
} from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

// --- Placeholder API Functions (Unchanged) ---
const fetchDzongkhags = async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return ['Thimphu', 'Paro', 'Punakha', 'Wangdue Phodrang'];
};
const fetchTownsByDzongkhag = async (dzongkhag) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const allTowns = {
    Thimphu: ['Thimphu Town', 'Babesa', 'Olakha'],
    Paro: ['Paro Town', 'Bondey', 'Shari'],
    Punakha: ['Khuruthang', 'Lobesa'],
    'Wangdue Phodrang': ['Wangdue Town', 'Bajo'],
  };
  return allTowns[dzongkhag] || [];
};
// --------------------------------------------------------------------

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
                        {options.map(opt => (
                            <TouchableOpacity
                                key={opt}
                                style={[styles.dropdownItem, value === opt && styles.dropdownItemActive]}
                                activeOpacity={0.85}
                                onPress={() => handleSelect(opt)}
                            >
                                <Text style={styles.dropdownItemText}>{opt}</Text>
                                {value === opt ? <Check size={16} color="#059669" /> : null}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    );
}


// Renders a single address card (Unchanged)
const AddressCard = ({ iconName, iconBgColor, title, address, isPermanentDefault, isSelected, onSelect }) => (
  <View style={styles.addressCard}>
    <View style={styles.addressContent}>
      <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
        <Ionicons name={iconName} size={20} color="white" />
      </View>
      <View style={styles.addressTextContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.addressTitle}>{title}</Text>
          <View style={styles.switchContainer}>
            {isPermanentDefault && <Text style={styles.defaultLabel}>Default</Text>}
            <Switch
              value={isSelected}
              onValueChange={() => onSelect(title)}
              trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
              thumbColor={isSelected ? '#fff' : '#f4f3f4'}
              ios_backgroundColor="#E0E0E0"
            />
          </View>
        </View>
        <Text style={styles.addressText}>{address}</Text>
      </View>
    </View>
  </View>
);


const Address = ({ navigation }) => {
  const [selectedAddress, setSelectedAddress] = useState('Home');
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

  useEffect(() => {
    const loadDzongkhags = async () => {
        try {
            setLoadingDzongkhags(true);
            const data = await fetchDzongkhags();
            setDzongkhagList(data);
        } catch (error) {
            console.error('Failed to fetch dzongkhags:', error);
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
            setTownsList(data);
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

  const handleFormSubmit = () => {
    const newAddressData = { title: locationTitle, icon: selectedIcon, dzongkhag: selectedDzongkhag, place: selectedTown };
    console.log('Saving New Address:', newAddressData);
    setModalVisible(false);
    setLocationTitle('');
    setSelectedIcon('home');
    setSelectedDzongkhag('');
    setSelectedTown('');
    setOpenDropdown(null);
  };
  
  const toggleDropdown = (dropdownName) => {
    setOpenDropdown(prev => (prev === dropdownName ? null : dropdownName));
  };

  const addressData = [
    { iconName: 'home', iconBgColor: '#4CAF50', title: 'Home', address: '123 Happiness Avenue, Thrissur' },
    { iconName: 'briefcase', iconBgColor: '#2196F3', title: 'Office', address: '456 Serenity Road, Pala' },
  ];

  return (
    <SafeAreaView style={styles.page}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        {/* --- MODIFIED: Removed KeyboardAvoidingView wrapper --- */}
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
              
              <View style={{paddingTop: 15}}>
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
          {addressData.map((item) => (
            <AddressCard key={item.title} {...item} isSelected={selectedAddress === item.title} onSelect={setSelectedAddress} />
          ))}
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
  addressText: { fontSize: 14, color: '#666' },
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
    justifyContent: 'space-between',
  },
  title: { fontSize: 22, fontWeight: '600', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 8, marginBottom: 12 },
  formContainer: { flex: 1, paddingTop: 12 }, 
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
});

export default Address;