import React from 'react';
import {
  Modal,
  View,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';

const { height: screenHeight } = Dimensions.get('window');

/**
 * KeyboardAwareModal - A wrapper component that ensures consistent keyboard handling
 * across all modals in the app. Prevents UI shrinking and maintains form height.
 */
export default function KeyboardAwareModal({
  visible,
  onRequestClose,
  children,
  containerStyle = {},
  overlayStyle = {},
  avoidingViewStyle = {},
  animationType = 'fade',
  ...modalProps
}) {
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
  
  return (
    <Modal
      animationType={animationType}
      transparent={true}
      visible={visible}
      onRequestClose={onRequestClose}
      {...modalProps}
    >
      <View style={[defaultStyles.modalOverlay, overlayStyle]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'height' : 'height'}
          style={[defaultStyles.keyboardAvoidingWrapper, avoidingViewStyle]}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20 + statusBarHeight}
        >
          <View style={[defaultStyles.modalContainer, containerStyle]}>
            {children}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const defaultStyles = {
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  keyboardAvoidingWrapper: {
    width: '90%',
    height: '85%',
    maxHeight: '85%',
  },
  modalContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
};