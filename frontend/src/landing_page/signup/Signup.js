import React, { useState } from 'react';
import axios from 'axios';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Simple validation for email, name, and password
  const validateForm = () => {
    let errors = {};
    if (!formData.name) errors.name = 'Name is required';
    if (!formData.email) errors.email = 'Email is required';
    if (!formData.password) errors.password = 'Password is required';
    else if (formData.password.length < 6)
      errors.password = 'Password must be at least 6 characters long';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const response = await axios.post('https://zerodhaclonerepo.onrender.com/api/signup', formData);
      if (response.status === 200) {
        setSuccessMessage('Signup successful!');
        setFormData({ name: '', email: '', password: '' });
        setFormErrors({});
      }
    } catch (error) {
      console.error('Error during signup:', error);
      setSuccessMessage('Signup failed. Please try again.');
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: '500px', backgroundColor: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
      <h2 className="mb-4 text-center">Sign Up</h2>
      <form onSubmit={handleSubmit}>
        {/* Name Field */}
        <div className="form-group mb-3">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your name"
          />
          {formErrors.name && <div className="invalid-feedback">{formErrors.name}</div>}
        </div>

        {/* Email Field */}
        <div className="form-group mb-3">
          <label htmlFor="email">Email address</label>
          <input
            type="email"
            className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
          />
          {formErrors.email && <div className="invalid-feedback">{formErrors.email}</div>}
        </div>

        {/* Password Field */}
        <div className="form-group mb-3">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            className={`form-control ${formErrors.password ? 'is-invalid' : ''}`}
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
          />
          {formErrors.password && <div className="invalid-feedback">{formErrors.password}</div>}
        </div>

        {/* Submit Button */}
        <button type="submit" className="btn btn-primary w-100">Sign Up</button>

        {/* Success Message */}
        {successMessage && <div className="mt-3 alert alert-info">{successMessage}</div>}
      </form>
    </div>
  );
};

export default Signup;
