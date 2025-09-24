import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native'
import { Eye, EyeOff, ChevronDown, Check } from 'lucide-react-native'
import { useNavigation } from '@react-navigation/native'
import api from '../lib/api'
import { setCurrentUser } from '../lib/auth'

const dzongkhags = [
  'Bumthang','Chhukha','Dagana','Gasa','Haa','Lhuentse','Mongar','Paro',
  'Pemagatshel','Punakha','Samdrup Jongkhar','Samtse','Sarpang','Thimphu',
  'Trashigang','Trashiyangtse','Trongsa','Tsirang','Wangdue Phodrang','Zhemgang'
]

const LIST_MAX = 160

function CustomDropdown({ options, value, onChange, placeholder = 'Select…', onOpenChange }) {
  const [open, setOpen] = useState(false)

  const handleToggle = useCallback(() => {
    setOpen(prev => {
      const next = !prev
      onOpenChange?.(next)
      return next
    })
  }, [onOpenChange])

  const handleSelect = useCallback((option) => {
    onChange(option)
    setOpen(false)
    onOpenChange?.(false)
  }, [onChange, onOpenChange])

  return (
    <View style={styles.dropdownWrap}>
      <TouchableOpacity style={styles.dropdownTrigger} activeOpacity={0.8} onPress={handleToggle}>
        <Text style={[styles.dropdownText, !value && styles.placeholder]} numberOfLines={1}>
          {value || placeholder}
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
                  onPress={() => handleSelect(opt)}
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

const RegisterStep1 = React.memo(function RegisterStep1({ formData, setField, nextStep, onDropdownOpenChange }) {
  return (
    <View style={{ gap: 12 }}>
      {/* CID */}
      <View>
        <Text style={styles.label}>CID</Text>
        <TextInput
          style={styles.input}
          placeholder="Citizen ID"
          placeholderTextColor="#9ca3af"
          keyboardType={Platform.select({ ios: 'number-pad', android: 'numeric' })}
          maxLength={11}
          value={formData.cid}
          onChangeText={(v) => setField('cid', v.replace(/\D/g, ''))}
        />
      </View>

      {/* Full Name */}
      <View>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor="#9ca3af"
          value={formData.name}
          onChangeText={(v) => setField('name', v)}
          autoComplete="name"
        />
      </View>

      {/* Location */}
      <View>
        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          placeholder="Location"
          placeholderTextColor="#9ca3af"
          value={formData.location}
          onChangeText={(v) => setField('location', v)}
        />
      </View>

      {/* Dzongkhag */}
      <View>
        <Text style={[styles.label, { marginBottom: 4 }]}>Dzongkhag</Text>
        <CustomDropdown
          options={dzongkhags}
          value={formData.dzongkhag}
          onChange={(v) => setField('dzongkhag', v)}
          placeholder="Select Dzongkhag"
          onOpenChange={onDropdownOpenChange}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, { marginTop: 12 }, (!formData.cid || !formData.name || !formData.location || !formData.dzongkhag) && styles.buttonDisabled]}
        activeOpacity={0.9}
        disabled={!formData.cid || !formData.name || !formData.location || !formData.dzongkhag}
        onPress={nextStep}
      >
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>
    </View>
  )
})

const RegisterStep2 = React.memo(function RegisterStep2({ formData, setField, showPassword, showConfirm, togglePassword, toggleConfirm, prevStep, loading, onSubmit, onDropdownOpenChange }) {
  return (
    <View style={{ gap: 12 }}>
      {/* Phone */}
      <View>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          placeholderTextColor="#9ca3af"
          keyboardType={Platform.select({ ios: 'number-pad', android: 'numeric' })}
          maxLength={8}
          value={formData.phoneNumber}
          onChangeText={(v) => setField('phoneNumber', v.replace(/\D/g, ''))}
        />
      </View>

      {/* Role */}
      <View>
        <Text style={[styles.label, { marginBottom: 4 }]}>Role</Text>
        <CustomDropdown
          options={["Farmer", "Consumer", "Transporter"]}
          value={formData.role}
          onChange={(v) => setField('role', v)}
          placeholder="Select Role"
          onOpenChange={onDropdownOpenChange}
        />
      </View>

      {/* Password */}
      <View>
        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordWrap}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            placeholderTextColor="#9ca3af"
            secureTextEntry={!showPassword}
            value={formData.password}
            onChangeText={(v) => setField('password', v)}
            autoComplete="password-new"
          />
          <TouchableOpacity onPress={togglePassword} style={styles.eyeBtn}>
            {showPassword ? <EyeOff size={18} color="#6b7280" /> : <Eye size={18} color="#6b7280" />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Confirm */}
      <View>
        <Text style={styles.label}>Confirm Password</Text>
        <View style={styles.passwordWrap}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Confirm Password"
            placeholderTextColor="#9ca3af"
            secureTextEntry={!showConfirm}
            value={formData.confirm}
            onChangeText={(v) => setField('confirm', v)}
            autoComplete="password-new"
          />
          <TouchableOpacity onPress={toggleConfirm} style={styles.eyeBtn}>
            {showConfirm ? <EyeOff size={18} color="#6b7280" /> : <Eye size={18} color="#6b7280" />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Actions */}
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        <TouchableOpacity style={[styles.buttonOutline, { flex: 1 }]} onPress={prevStep} activeOpacity={0.9}>
          <Text style={styles.buttonOutlineText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, { flex: 1 }, loading && styles.buttonDisabled]} onPress={onSubmit} disabled={loading} activeOpacity={0.9}>
          <Text style={styles.buttonText}>{loading ? 'Creating...' : 'Create Account'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
})

const LoginForm = React.memo(function LoginForm({ formData, setField, showPassword, togglePassword, loading, onSubmit }) {
  return (
    <View style={{ gap: 12 }}>
      {/* Phone */}
      <View>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          placeholderTextColor="#9ca3af"
          keyboardType={Platform.select({ ios: 'number-pad', android: 'numeric' })}
          maxLength={8}
          value={formData.phoneNumber}
          onChangeText={(v) => setField('phoneNumber', v.replace(/\D/g, ''))}
        />
      </View>

      {/* Password */}
      <View>
        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordWrap}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            placeholderTextColor="#9ca3af"
            secureTextEntry={!showPassword}
            value={formData.password}
            onChangeText={(v) => setField('password', v)}
            autoComplete="password"
          />
          <TouchableOpacity onPress={togglePassword} style={styles.eyeBtn}>
            {showPassword ? <EyeOff size={18} color="#6b7280" /> : <Eye size={18} color="#6b7280" />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Forgot link */}
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.linkMuted}>Forgot Password?</Text>
      </View>

      <TouchableOpacity style={[styles.button, { marginTop: 12 }]} onPress={onSubmit} disabled={loading} activeOpacity={0.9}>
        <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Login'}</Text>
      </TouchableOpacity>
    </View>
  )
})

export default function AuthLayout({ mode = 'login' }) {
  const navigation = useNavigation()
  const isLoginInitial = mode === 'login'
  const [isLogin, setIsLogin] = useState(isLoginInitial)
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ cid:'', name:'', location:'', dzongkhag:'', phoneNumber:'', role:'', password:'', confirm:'' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [scrollLocked, setScrollLocked] = useState(false)

  const setField = useCallback((key, val) => setFormData(prev => ({ ...prev, [key]: val })), [])

  const handleSubmit = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      if (isLogin) {
        const res = await api.loginUser({ phoneNumber: formData.phoneNumber, password: formData.password })
        console.log('login ok', res)
        // Save in-memory user for app-wide auth state
        if (res && res.user) setCurrentUser(res.user)

        // Redirect based on role
        const role = String(res?.user?.role || '').toLowerCase()
        let routeName = 'Products' // Default for consumers
        if (role === 'farmer') {
          routeName = 'Dashboard'
        } else if (role === 'transporter') {
          routeName = 'TransporterDashboard'
        }
        navigation.reset({ index: 0, routes: [{ name: routeName }] })
      } else {
        if (formData.password !== formData.confirm) { setError('Passwords do not match.'); return }
        const res = await api.registerUser({ ...formData, role: String(formData.role || '').toLowerCase() })
        console.log('register ok', res)
        if (res && res.user) setCurrentUser(res.user)

        // Redirect based on role
        const role = String(res?.user?.role || '').toLowerCase()
        let routeName = 'Products' // Default for consumers
        if (role === 'farmer') {
          routeName = 'Dashboard'
        } else if (role === 'transporter') {
          routeName = 'TransporterDashboard'
        }
        navigation.reset({ index: 0, routes: [{ name: routeName }] })
      }
    } catch (err) {
      const message = err?.body?.error || err?.message || 'An error occurred.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [isLogin, formData, navigation])

  const title = isLogin ? 'Hello Again!' : 'Create Account'
  const subtitle = isLogin
    ? 'Login to continue managing your orders and products.'
    : (step === 1 ? 'Step 1: Enter your basic details.' : 'Step 2: Set your contact and password.')

  return (
    <View style={styles.page}>
      <ScrollView
        contentContainerStyle={styles.center}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={!scrollLocked}
      >
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          {!!error && (
            <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>
          )}

          {/* Forms */}
          {isLogin ? (
            <LoginForm
              formData={formData}
              setField={setField}
              showPassword={showPassword}
              togglePassword={() => setShowPassword(p => !p)}
              loading={loading}
              onSubmit={handleSubmit}
            />
          ) : step === 1 ? (
            <RegisterStep1
              formData={formData}
              setField={setField}
              nextStep={() => setStep(2)}
              onDropdownOpenChange={setScrollLocked}
            />
          ) : (
            <RegisterStep2
              formData={formData}
              setField={setField}
              showPassword={showPassword}
              showConfirm={showConfirm}
              togglePassword={() => setShowPassword(p => !p)}
              toggleConfirm={() => setShowConfirm(p => !p)}
              prevStep={() => setStep(1)}
              loading={loading}
              onSubmit={handleSubmit}
              onDropdownOpenChange={setScrollLocked}
            />
          )}

          {/* Footer switch text */}
          <TouchableOpacity
            onPress={() => { setIsLogin(v => !v); setStep(1); setError(''); }}
            activeOpacity={0.8}
          >
            <Text style={styles.footerSwitch}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <Text style={styles.footerLink}>{isLogin ? 'Sign Up' : 'Login'}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F5F7FB' },
  center: { minHeight: Dimensions.get('window').height, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  card: {
    width: '100%', maxWidth: 384, backgroundColor: '#fff', borderRadius: 16, padding: 24,
    height: 600,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: '600', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 8, marginBottom: 12 },
  errorBox: { backgroundColor: '#fee2e2', borderRadius: 8, padding: 8, marginBottom: 8 },
  errorText: { color: '#dc2626', textAlign: 'center', fontSize: 13 },

  label: { fontSize: 12, fontWeight: '500', color: '#374151' },
  input: { marginTop: 4, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827' },

  passwordWrap: { marginTop: 4, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingLeft: 12, paddingRight: 10, flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: '#111827' },
  eyeBtn: { padding: 4 },

  button: { backgroundColor: '#059669', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '600' },
  buttonOutline: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  buttonOutlineText: { color: '#374151', fontWeight: '500' },

  linkMuted: { fontSize: 12, color: '#2563eb' },

  dropdownTrigger: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dropdownText: { fontSize: 14, color: '#111827', flex: 1, marginRight: 8 },
  placeholder: { color: '#9ca3af' },
  dropdownWrap: { position: 'relative' },
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
  dropdownItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 12 },
  dropdownItemActive: { backgroundColor: '#ecfdf5' },
  dropdownItemText: { fontSize: 14, color: '#111827' },

  footerSwitch: { marginTop: 16, fontSize: 13, color: '#374151', textAlign: 'center' },
  footerLink: { color: '#059669', fontWeight: '600' },
})