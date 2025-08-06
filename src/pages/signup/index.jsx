import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Icon from 'components/AppIcon';

const Signup = () => {
  const navigate = useNavigate();
  const { signUp, user, loading, authError, clearAuthError } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'staff'
  });
  const [formLoading, setFormLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordMatchError, setPasswordMatchError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  // Clear auth errors when component mounts or form data changes
  useEffect(() => {
    clearAuthError();
  }, [formData, clearAuthError]);

  const handleInputChange = (e) => {
    const { name, value } = e?.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear password match error when user types
    if (name === 'password' || name === 'confirmPassword') {
      setPasswordMatchError('');
    }
  };

  const validateForm = () => {
    if (!formData?.fullName?.trim()) {
      return 'Full name is required';
    }

    if (!formData?.email?.trim()) {
      return 'Email is required';
    }

    if (formData?.password?.length < 6) {
      return 'Password must be at least 6 characters long';
    }

    if (formData?.password !== formData?.confirmPassword) {
      setPasswordMatchError('Passwords do not match');
      return 'Passwords do not match';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      return;
    }

    try {
      setFormLoading(true);
      
      const result = await signUp(formData?.email, formData?.password, {
        fullName: formData?.fullName,
        role: formData?.role
      });
      
      if (result?.success) {
        // Show success message or redirect
        navigate('/dashboard');
      }
      // Error handling is done by AuthContext and displayed via authError
    } catch (error) {
      console.error('Signup error:', error);
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary rounded-lg flex items-center justify-center mb-4">
            <Icon name="Calculator" size={24} color="white" />
          </div>
          <h2 className="text-3xl font-heading font-bold text-text-primary">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            Join AccountingPro and start managing your finances
          </p>
        </div>

        {/* Signup Form */}
        <form className="mt-8 space-y-6 bg-white p-8 rounded-xl shadow-lg border border-border" onSubmit={handleSubmit}>
          {/* Error Display */}
          {(authError || passwordMatchError) && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <Icon name="AlertCircle" size={20} color="#EF4444" />
                <div className="ml-2 flex-1">
                  <p className="text-red-700 text-sm">{authError || passwordMatchError}</p>
                  {authError && (
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(authError)}
                      className="mt-1 text-xs text-red-600 hover:text-red-800 underline"
                    >
                      Copy error message
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    clearAuthError();
                    setPasswordMatchError('');
                  }}
                  className="ml-2 text-red-600 hover:text-red-800"
                >
                  <Icon name="X" size={16} color="#EF4444" />
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Full Name Field */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-text-primary mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icon name="User" size={16} color="#9CA3AF" />
                </div>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData?.fullName}
                  onChange={handleInputChange}
                  className="pl-10 w-full px-3 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-text-primary placeholder-text-secondary"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icon name="Mail" size={16} color="#9CA3AF" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData?.email}
                  onChange={handleInputChange}
                  className="pl-10 w-full px-3 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-text-primary placeholder-text-secondary"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-text-primary mb-2">
                Role
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icon name="Briefcase" size={16} color="#9CA3AF" />
                </div>
                <select
                  id="role"
                  name="role"
                  value={formData?.role}
                  onChange={handleInputChange}
                  className="pl-10 w-full px-3 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-text-primary bg-white"
                >
                  <option value="staff">Staff Member</option>
                  <option value="freelancer">Freelancer</option>
                  <option value="client">Client</option>
                  <option value="partner">Partner</option>
                </select>
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icon name="Lock" size={16} color="#9CA3AF" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData?.password}
                  onChange={handleInputChange}
                  className="pl-10 pr-10 w-full px-3 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-text-primary placeholder-text-secondary"
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <Icon name={showPassword ? "EyeOff" : "Eye"} size={16} color="#9CA3AF" />
                </button>
              </div>
              <p className="mt-1 text-xs text-text-secondary">
                Password must be at least 6 characters long
              </p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-primary mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icon name="Lock" size={16} color="#9CA3AF" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData?.confirmPassword}
                  onChange={handleInputChange}
                  className={`pl-10 pr-10 w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-text-primary placeholder-text-secondary ${
                    passwordMatchError ? 'border-red-300' : 'border-border'
                  }`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <Icon name={showConfirmPassword ? "EyeOff" : "Eye"} size={16} color="#9CA3AF" />
                </button>
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-center">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-text-secondary">
              I agree to the{' '}
              <Link to="/terms" className="text-primary hover:text-primary-700">
                Terms and Conditions
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-primary hover:text-primary-700">
                Privacy Policy
              </Link>
            </label>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={formLoading || loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {formLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating account...
                </div>
              ) : (
                <span className="flex items-center">
                  <Icon name="UserPlus" size={16} color="white" />
                  <span className="ml-2">Create account</span>
                </span>
              )}
            </button>
          </div>

          {/* Sign In Link */}
          <div className="text-center">
            <p className="text-sm text-text-secondary">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary hover:text-primary-700">
                Sign in here
              </Link>
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-text-secondary">
            © 2024 AccountingPro. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;