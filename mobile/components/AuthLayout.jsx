import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

const dzongkhags = [
  'Bumthang','Chhukha','Dagana','Gasa','Haa','Lhuentse','Mongar','Paro',
  'Pemagatshel','Punakha','Samdrup Jongkhar','Samtse','Sarpang','Thimphu',
  'Trashigang','Trashiyangtse','Trongsa','Tsirang','Wangdue Phodrang','Zhemgang'
];

export default function AuthScreen({ navigation }) {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [step, setStep] = useState(1); // for registration steps
  const [formData, setFormData] = useState({
    cid:'', name:'', location:'', dzongkhag:'', phoneNumber:'', role:'', password:'', confirm:''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const togglePassword = () => setShowPassword(prev => !prev);
  const toggleConfirm = () => setShowConfirm(prev => !prev);

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleNextStep = () => setStep(2);
  const handlePrevStep = () => setStep(1);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.wrapper}>
            <View style={styles.card}>
              <Text style={styles.title}>
                {mode === 'login' ? 'Hello Again!' : 'Create Account'}
              </Text>
              <Text style={styles.subtitle}>
                {mode === 'login'
                  ? 'Login to continue managing your orders and products.'
                  : step === 1
                    ? 'Step 1: Enter your basic details.'
                    : 'Step 2: Set your contact and password.'}
              </Text>

              {/* Login Form */}
              {mode === 'login' ? (
                <>
                  <Text style={styles.label}>Phone Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Phone Number"
                    keyboardType="numeric"
                    value={formData.phoneNumber}
                    onChangeText={value => handleChange('phoneNumber', value)}
                  />

                  <Text style={styles.label}>Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.inputPassword}
                      placeholder="Password"
                      secureTextEntry={!showPassword}
                      value={formData.password}
                      onChangeText={value => handleChange('password', value)}
                    />
                    <TouchableOpacity onPress={togglePassword}>
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity>
                    <Text style={styles.forgotText}>Forgot Password?</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.button}>
                    <Text style={styles.buttonText}>Login</Text>
                  </TouchableOpacity>

                  <View style={styles.signUpContainer}>
                    <Text style={styles.signUpText}>Don't have an account? </Text>
                    <TouchableOpacity onPress={() => setMode('register')}>
                      <Text style={styles.signUpLink}>Sign Up</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                // Registration Form
                <>
                  {step === 1 ? (
                    <>
                      <Text style={styles.label}>CID</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Citizen ID"
                        keyboardType="numeric"
                        value={formData.cid}
                        onChangeText={value => handleChange('cid', value)}
                      />
                      <Text style={styles.label}>Full Name</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Full Name"
                        value={formData.name}
                        onChangeText={value => handleChange('name', value)}
                      />
                      <Text style={styles.label}>Location</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Location"
                        value={formData.location}
                        onChangeText={value => handleChange('location', value)}
                      />
                      <Text style={styles.label}>Dzongkhag</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Dzongkhag"
                        value={formData.dzongkhag}
                        onChangeText={value => handleChange('dzongkhag', value)}
                      />

                      <TouchableOpacity style={styles.button} onPress={handleNextStep}>
                        <Text style={styles.buttonText}>Next</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <Text style={styles.label}>Phone Number</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Phone Number"
                        keyboardType="numeric"
                        value={formData.phoneNumber}
                        onChangeText={value => handleChange('phoneNumber', value)}
                      />
                      <Text style={styles.label}>Password</Text>
                      <View style={styles.passwordContainer}>
                        <TextInput
                          style={styles.inputPassword}
                          placeholder="Password"
                          secureTextEntry={!showPassword}
                          value={formData.password}
                          onChangeText={value => handleChange('password', value)}
                        />
                        <TouchableOpacity onPress={togglePassword}>
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </TouchableOpacity>
                      </View>

                      <Text style={styles.label}>Confirm Password</Text>
                      <View style={styles.passwordContainer}>
                        <TextInput
                          style={styles.inputPassword}
                          placeholder="Confirm Password"
                          secureTextEntry={!showConfirm}
                          value={formData.confirm}
                          onChangeText={value => handleChange('confirm', value)}
                        />
                        <TouchableOpacity onPress={toggleConfirm}>
                          {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                        </TouchableOpacity>
                      </View>

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <TouchableOpacity
                          style={[styles.button, { backgroundColor: '#E5E7EB', flex: 1, marginRight: 8 }]}
                          onPress={handlePrevStep}
                        >
                          <Text style={[styles.buttonText, { color: '#111827' }]}>Back</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.button, { flex: 1 }]}>
                          <Text style={styles.buttonText}>Create Account</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}

                  <View style={styles.signUpContainer}>
                    <Text style={styles.signUpText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => setMode('login')}>
                      <Text style={styles.signUpLink}>Login</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const CARD_HEIGHT = 560; // adjust as needed

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FB' },
  wrapper: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  card: { 
    width: '100%', 
    maxWidth: 400, 
    minHeight: CARD_HEIGHT,
    backgroundColor: 'white', 
    borderRadius: 20, 
    padding: 20, 
    elevation: 5,
    justifyContent: 'center'
  },
  title: { fontSize: 22, fontWeight: '600', textAlign: 'center', marginBottom: 8, color: '#064E3B' },
  subtitle: { fontSize: 14, textAlign: 'center', color: '#6B7280', marginBottom: 16 },
  label: { fontSize: 12, color: '#374151', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 14 },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 10, marginBottom: 12 },
  inputPassword: { flex: 1, height: 40, fontSize: 14 },
  button: { backgroundColor: '#059669', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonText: { color: 'white', fontWeight: '600' },
  forgotText: { fontSize: 12, color: '#3B82F6', textAlign: 'right', marginBottom: 12 },
  signUpContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 12 },
  signUpText: { fontSize: 12, color: '#6B7280' },
  signUpLink: { fontSize: 12, color: '#3B82F6' },
});