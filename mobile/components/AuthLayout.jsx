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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { useNavigation } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
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

const RegisterStep1 = React.memo(function RegisterStep1({ formData, setField, nextStep, onDropdownOpenChange, setError }) {
  const handleNext = () => {
    if (!formData.cid) {
      setError('Please enter your CID')
      return
    }
    if (!formData.name) {
      setError('Please enter your full name')
      return
    }
    if (!formData.role) {
      setError('Please select your role')
      return
    }
    if (!formData.phoneNumber) {
      setError('Please enter your phone number')
      return
    }
    setError('')
    nextStep()
  }

  return (
    <View style={{ gap: 8 }}>
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

      <TouchableOpacity
        style={[styles.button, { marginTop: 12 }]}
        activeOpacity={0.9}
        onPress={handleNext}
      >
        <LinearGradient
          colors={['#059669', '#047857']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.buttonGradient}
        >
          <Text style={styles.buttonText}>Next</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  )
})

const RegisterStep2 = React.memo(function RegisterStep2({ formData, setField, showPassword, showConfirm, togglePassword, toggleConfirm, prevStep, loading, onSubmit, agreedToTerms, setAgreedToTerms, setError, navigation }) {
  const handleSubmit = () => {
    if (!agreedToTerms) {
      setError('Please agree to the Terms & Conditions and Privacy Policy')
      return
    }
    setError('')
    onSubmit()
  }

  return (
    <View style={{ gap: 8 }}>
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

      {/* Terms & Conditions Checkbox */}
      <View style={styles.checkboxContainer}>
        <TouchableOpacity 
          onPress={() => setAgreedToTerms(!agreedToTerms)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
            {agreedToTerms && <Check size={16} color="#fff" />}
          </View>
        </TouchableOpacity>
        <Text style={styles.checkboxLabel}>
          I agree to the{' '}
          <Text 
            style={styles.checkboxLink}
            onPress={() => navigation.navigate('Terms of Service')}
          >
            Terms & Conditions
          </Text>
          {' '}and{' '}
          <Text 
            style={styles.checkboxLink}
            onPress={() => navigation.navigate('Privacy Policy')}
          >
            Privacy Policy
          </Text>
        </Text>
      </View>

      {/* Submit Button */}
      <TouchableOpacity style={[styles.button, { marginTop: 12 }, loading && styles.buttonDisabled]} onPress={handleSubmit} disabled={loading} activeOpacity={0.9}>
        <LinearGradient
          colors={['#059669', '#047857']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.buttonGradient}
        >
          <Text style={styles.buttonText}>{loading ? 'Creating...' : 'Create Account'}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  )
})

const LoginForm = React.memo(function LoginForm({ formData, setField, showPassword, togglePassword, loading, onSubmit }) {
  return (
    <View style={{ gap: 8 }}>
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
        <Text style={styles.linkMuted}>Forgot your password?</Text>
      </View>

      <TouchableOpacity style={[styles.button, { marginTop: 12 }]} onPress={onSubmit} disabled={loading} activeOpacity={0.9}>
        <LinearGradient
          colors={['#059669', '#047857']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.buttonGradient}
        >
          <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Sign In'}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  )
})

export default function AuthLayout({ mode = 'login', returnTo }) {
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
  const [agreedToTerms, setAgreedToTerms] = useState(false)

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

        // Check if there's a returnTo parameter to redirect after login
        if (returnTo) {
          navigation.reset({ index: 0, routes: [{ name: returnTo }] })
          return
        }

        // Redirect based on role
        const role = String(res?.user?.role || '').toLowerCase()
        let routeName = 'Products' // Default for consumers
        if (role === 'farmer') {
          routeName = 'Dashboard'
        } else if (role === 'tshogpas') {
          routeName = 'TshogpasDashboard'
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
        } else if (role === 'tshogpas') {
          routeName = 'TshogpasDashboard'
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
  }, [isLogin, formData, navigation, returnTo])

  const title = isLogin ? 'Welcome Back' : 'Welcome'
  const subtitle = isLogin
    ? 'Enter your details below'
    : (step === 1 ? 'Step 1: Enter your details and select your role.' : 'Step 2: Set your password.')

  return (
    <View style={styles.page}>
      {/* Purple Gradient Background */}
      <LinearGradient
        colors={['#059669', '#047857']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBg}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack()
              } else {
                navigation.navigate('Products')
              }
            }}
            activeOpacity={0.7}
          >
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.headerRight}>
            <Text style={styles.headerQuestion}>
              {isLogin ? "Don't have an account?" : "Already have an account?"}
            </Text>
            <TouchableOpacity 
              style={styles.getStartedBtn}
              onPress={() => { setIsLogin(v => !v); setStep(1); setError(''); }}
              activeOpacity={0.8}
            >
              <Text style={styles.getStartedText}>
                {isLogin ? 'Get Started' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* App Name */}
        <Text style={styles.appName}>DrukFarm</Text>
      </LinearGradient>

      {/* White Card Container */}
      <View style={styles.curvedCard}>
        <View style={styles.formWrapper}>
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
              setError={setError}
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
              agreedToTerms={agreedToTerms}
              setAgreedToTerms={setAgreedToTerms}
              setError={setError}
              navigation={navigation}
            />
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  page: { 
    flex: 1, 
    backgroundColor: '#059669',
  },
  
  gradientBg: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 60,
    paddingHorizontal: 20,
  },
  
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 5,
  },
  
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  
  headerQuestion: {
    color: '#fff',
    fontSize: 13,
    opacity: 0.9,
  },
  
  getStartedBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  
  getStartedText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  
  appName: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 1,
  },
  
  curvedCard: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    paddingTop: 10,
  },
  
  formWrapper: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    justifyContent: 'center',
    marginTop: -40,
  },
  
  title: { 
    fontSize: 28, 
    fontWeight: '700', 
    textAlign: 'center',
    color: '#1f2937',
  },
  
  subtitle: { 
    fontSize: 14, 
    color: '#6b7280', 
    textAlign: 'center', 
    marginTop: 8, 
    marginBottom: 20,
  },
  
  errorBox: { 
    backgroundColor: '#fee2e2', 
    borderRadius: 12, 
    padding: 12, 
    marginBottom: 16,
  },
  
  errorText: { 
    color: '#dc2626', 
    textAlign: 'center', 
    fontSize: 13,
  },

  label: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: '#6b7280',
    marginBottom: 6,
  },
  
  input: { 
    borderWidth: 1, 
    borderColor: '#e5e7eb', 
    borderRadius: 12, 
    paddingHorizontal: 14, 
    paddingVertical: 12, 
    fontSize: 15, 
    color: '#111827',
    backgroundColor: '#f9fafb',
  },

  passwordWrap: { 
    borderWidth: 1, 
    borderColor: '#e5e7eb', 
    borderRadius: 12, 
    paddingLeft: 14, 
    paddingRight: 10, 
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  
  passwordInput: { 
    flex: 1, 
    paddingVertical: 12, 
    fontSize: 15, 
    color: '#111827',
  },
  
  eyeBtn: { 
    padding: 6,
  },

  button: { 
    borderRadius: 12, 
    overflow: 'hidden',
  },
  
  buttonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  buttonDisabled: { 
    opacity: 0.5,
  },
  
  buttonText: { 
    color: '#fff', 
    fontWeight: '700',
    fontSize: 15,
  },
  
  buttonOutline: { 
    borderWidth: 1.5, 
    borderColor: '#e5e7eb', 
    borderRadius: 12, 
    paddingVertical: 14, 
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  
  buttonOutlineText: { 
    color: '#6b7280', 
    fontWeight: '600',
    fontSize: 15,
  },

  linkMuted: { 
    fontSize: 13, 
    color: '#059669',
    fontWeight: '500',
  },

  dropdownTrigger: { 
    borderWidth: 1, 
    borderColor: '#e5e7eb', 
    borderRadius: 12, 
    paddingHorizontal: 14, 
    paddingVertical: 12, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
  },
  
  dropdownText: { 
    fontSize: 15, 
    color: '#111827', 
    flex: 1, 
    marginRight: 8,
  },
  
  placeholder: { 
    color: '#9ca3af',
  },
  
  dropdownWrap: { 
    position: 'relative',
  },
  
  dropdownList: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '100%',
    marginTop: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    zIndex: 20,
  },
  
  dropdownItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingVertical: 12, 
    paddingHorizontal: 14,
  },
  
  dropdownItemActive: { 
    backgroundColor: '#d1fae5',
  },
  
  dropdownItemText: { 
    fontSize: 15, 
    color: '#111827',
  },
  
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 10,
  },
  
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  
  checkboxChecked: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  
  checkboxLink: {
    color: '#059669',
    fontWeight: '600',
  },
})