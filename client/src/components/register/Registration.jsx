import React, { useState } from 'react';
import BasicInformation from './BasicInformation';
import Location from './Location';
import OTPVerification from './OTPVerification'
const Registration = () => {
  const [step, setStep] = useState('basic'); // 'basic', 'otp', or 'location'

  const handleBasicInfoComplete = () => {
    setStep('otp');
  };

  const handleOtpVerified = () => {
    setStep('location');
  };

  return (
    <div>
      {step === 'basic' && <BasicInformation onComplete={handleBasicInfoComplete} />}
      {step === 'otp' && <OTPVerification onVerify={handleOtpVerified} />}
      {step === 'location' && <Location />}
    </div>
  );
};

export default Registration;
