import React from 'react';
import SubmitBtn from '../button/SubmitBtn';

const BasicInformation = ({ onComplete }) => {
  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent the form from refreshing the page
    // Perform validation logic here if needed
    onComplete(); // Notify the parent component to move to OTP verification
  };
  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="exampleInputEmail1" className="form-label">Email address</label>
          <input type="email" className="form-control" id="exampleInputEmail1" aria-describedby="emailHelp" />
        </div>
        <div className="mb-3">
          <label htmlFor="exampleInputPassword1" className="form-label">Password</label>
          <input type="password" className="form-control" id="exampleInputPassword1" />
        </div>
        <SubmitBtn />
      </form>
    </div>
  );
};

export default BasicInformation;
