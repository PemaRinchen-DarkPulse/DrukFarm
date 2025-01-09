import React, { useState } from "react";
const OTPVerification = ({ onVerify }) => {
  const [otp, setOtp] = useState("");

  const handleVerify = () => {
    // Add OTP verification logic here
    if (otp === "1234") {
      // Replace with actual validation logic
      onVerify();
    } else {
      alert("Invalid OTP. Please try again.");
    }
  };

  return (
    <div>
      <h2>OTP Verification</h2>
      <input
        type="text"
        placeholder="Enter OTP"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
      />
      <button onClick={handleVerify}>Verify OTP</button>
    </div>
  );
};

export default OTPVerification;