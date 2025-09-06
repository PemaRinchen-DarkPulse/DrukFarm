import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { ChevronDown, Check } from 'lucide-react-native';
import { getCurrentUser, setCurrentUser, onAuthChange } from '../../lib/auth';
import { fetchUserByCid, updateUser } from '../../lib/api';

const DZONGKHAGS = [
  'Bumthang','Chhukha','Dagana','Gasa','Haa','Lhuentse','Mongar','Paro','Pemagatshel','Punakha','Samdrup Jongkhar','Samtse','Sarpang','Thimphu','Trashigang','Trashiyangtse','Trongsa','Tsirang','Wangdue Phodrang','Zhemgang'
]

const LIST_MAX = 160; // Same as AuthLayout

export default function Profile({ navigation }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [cid, setCid] = useState('')
  const [name, setName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [location, setLocation] = useState('')
  const [dzongkhag, setDzongkhag] = useState('')
  const [profileImageBase64, setProfileImageBase64] = useState('')
  const [profileImageMime, setProfileImageMime] = useState('')
  const [gender, setGender] = useState('')
  const [openDropdown, setOpenDropdown] = useState(null) // 'dzongkhag' | 'gender'

  // Hydrate from current auth user
  useEffect(() => {
    const initial = getCurrentUser()
    if (initial) applyUser(initial)
    const off = onAuthChange(u => { if (u) applyUser(u) })
    return off
  }, [])

  function applyUser(u){
    setCid(u?.cid || '')
    setName(u?.name || '')
    setPhoneNumber(u?.phoneNumber || '')
    setLocation(u?.location || '')
    setDzongkhag(u?.dzongkhag || '')
    setGender(u?.gender ? capitalize(u.gender) : '')
    if (u?.profileImageBase64){
      setProfileImageBase64(u.profileImageBase64)
      setProfileImageMime(u.profileImageMime || 'image/png')
    } else {
      setProfileImageBase64('')
      setProfileImageMime('')
    }
  }

  // Fetch fresh copy from backend (in case app state stale)
  useEffect(() => {
    let active = true
    async function load(){
      const u = getCurrentUser()
      if (!u?.cid) { setLoading(false); return }
      try {
        const fresh = await fetchUserByCid(u.cid)
        if (active && fresh) { applyUser(fresh); setCurrentUser(fresh) }
      } catch(e){ /* ignore fetch errors */ }
      if (active) setLoading(false)
    }
    load()
    return () => { active = false }
  }, [])

  async function handleSaveChanges(){
    if (!cid) return
    setSaving(true)
    setError('')
    try {
      const dto = { phoneNumber: phoneNumber.replace(/\D/g,'').trim(), location, dzongkhag, gender: gender.toLowerCase() }
      if (profileImageBase64) {
        dto.profileImageBase64 = profileImageBase64
        dto.profileImageMime = profileImageMime || 'image/png'
      }
      const res = await updateUser(cid, dto)
      if (res && res.user){
        applyUser(res.user)
        setCurrentUser(res.user)
        alert('Profile updated')
      } else {
        alert('Updated')
      }
    } catch(e){
      console.log('Update error', e)
      setError(e?.body?.error || e.message || 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  async function pickImage(){
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1,1],
        quality: 0.6,
        base64: true,
      })
      if (!result.canceled && result.assets && result.assets.length){
        const asset = result.assets[0]
        if (asset.base64){
          setProfileImageBase64(asset.base64)
          setProfileImageMime(asset.mimeType || 'image/jpeg')
        }
      }
    } catch (e){
      setError('Failed to pick image')
    }
  }

  function capitalize(s){ return typeof s === 'string' && s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s }

  const genderOptions = ['Male','Female','Other']

  function toggleDropdown(which){ 
    setOpenDropdown(prev => prev === which ? null : which) 
  }

  // Updated to match AuthLayout's dropdown style
  function renderDropdown(which, options, value, onSelect){
    const open = openDropdown === which
    
    return (
      <View style={styles.dropdownWrap}>
        <TouchableOpacity 
          style={styles.dropdownTrigger} 
          activeOpacity={0.8} 
          onPress={() => toggleDropdown(which)}
        >
          <Text style={[styles.dropdownText, !value && styles.placeholder]} numberOfLines={1}>
            {value || 'Select...'}
          </Text>
          <ChevronDown size={16} color="#059669" style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }} />
        </TouchableOpacity>

        {open && (
          <View style={styles.dropdownList}>
            <ScrollView style={{ maxHeight: LIST_MAX }} nestedScrollEnabled>
              {options.length > 0 ? (
                options.map(opt => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.dropdownItem, value === opt && styles.dropdownItemActive]}
                    activeOpacity={0.85}
                    onPress={() => {
                      onSelect(opt);
                      setOpenDropdown(null);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{opt}</Text>
                    {value === opt ? <Check size={16} color="#059669" /> : null}
                  </TouchableOpacity>
                ))
              ) : (
                <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                  <Text style={{ color: '#6b7280' }}>No options available</Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          if (navigation?.canGoBack()) navigation.goBack();
          else navigation?.navigate?.('Account Settings');
        }}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={!openDropdown}
      >
        <View style={styles.infoCard}>
          {/* Unified Profile Section */}
          <View style={{alignItems:'center', marginBottom: 10}}>
            <View style={styles.profilePicContainer}>
              <Image
                source={{
                  uri: profileImageBase64
                    ? `data:${profileImageMime||'image/png'};base64,${profileImageBase64}`
                    : 'https://cdn-icons-png.flaticon.com/512/4140/4140037.png',
                }}
                style={styles.profilePic}
              />
              <TouchableOpacity style={styles.editIconContainer} onPress={pickImage}> 
                <Ionicons name="pencil" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.userName}>{name || 'Your Name'}</Text>
          </View>
          
          <Text style={styles.label}>CID (read-only)</Text>
          <TextInput 
            style={[styles.textInput, styles.readOnly]} 
            value={cid} 
            editable={false} 
            selectTextOnFocus={false} 
          />

          <Text style={styles.label}>Name (read-only)</Text>
          <TextInput 
            style={[styles.textInput, styles.readOnly]} 
            value={name} 
            editable={false} 
            selectTextOnFocus={false} 
          />

          <Text style={[styles.label, { marginBottom: 4 }]}>Gender</Text>
          {renderDropdown('gender', genderOptions, gender, setGender)}
          
          <Text style={[styles.label, { marginBottom: 4 }]}>Dzongkhag</Text>
          {renderDropdown('dzongkhag', DZONGKHAGS, dzongkhag, setDzongkhag)}

          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.textInput}
            value={location}
            onChangeText={setLocation}
            placeholder="Village / Area"
          />
          
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.textInput}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="number-pad"
            placeholder="8 digit phone number"
            maxLength={12}
          />
          
          {profileImageBase64 ? (
            <Text style={{fontSize:12, color:'#555', marginTop:4}}>
              Photo selected ({Math.round(profileImageBase64.length/1024)} KB)
            </Text>
          ) : null}
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        {/* Save Changes Button */}
        <TouchableOpacity 
          disabled={saving || loading} 
          style={[styles.saveButton, (saving||loading)&&{opacity:0.7}]} 
          onPress={handleSaveChanges}
        >
          <Text style={styles.saveButtonText}>
            {saving? 'Saving...' : 'Update Profile'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    flexGrow: 1,
  },
  profilePicContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  profilePic: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#047857',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    width: '100%',
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'visible',
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    marginTop: 15,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  readOnly: {
    backgroundColor: '#f0f0f0',
    color: '#555'
  },
  saveButton: {
    backgroundColor: '#047857',
    borderRadius: 8,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Dropdown styles - exactly matching AuthLayout
  dropdownTrigger: { 
    borderWidth: 1, 
    borderColor: '#d1d5db', 
    borderRadius: 8, 
    paddingHorizontal: 12, 
    paddingVertical: 10, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  dropdownText: { 
    fontSize: 14, 
    color: '#111827', 
    flex: 1, 
    marginRight: 8 
  },
  placeholder: { 
    color: '#9ca3af' 
  },
  dropdownWrap: { 
    position: 'relative' 
  },
  dropdownList: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '100%',
    marginTop: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 12,
    zIndex: 20,
  },
  dropdownItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingVertical: 10, 
    paddingHorizontal: 12 
  },
  dropdownItemActive: { 
    backgroundColor: '#ecfdf5' 
  },
  dropdownItemText: { 
    fontSize: 14, 
    color: '#111827' 
  },
  errorText: { 
    color: '#dc2626', 
    marginTop: 12, 
    fontSize: 14 
  },
});