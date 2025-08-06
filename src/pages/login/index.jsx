import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Icon from 'components/AppIcon';

const Login = () => {
  const navigate = useNavigate();
  const { signIn, user, loading, authError, clearAuthError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!formData?.email || !formData?.password) {
      return;
    }

    try {
      setFormLoading(true);
      
      const result = await signIn(formData?.email, formData?.password);
      
      if (result?.success) {
        navigate('/dashboard');
      }
      // Error handling is done by AuthContext and displayed via authError
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDemoLogin = async (role) => {
    const demoCredentials = {
      partner: { email: 'sarah.johnson@accountingpro.com', password: 'password123' },
      staff: { email: 'michael.chen@accountingpro.com', password: 'password123' },
      freelancer: { email: 'emily.rodriguez@freelance.com', password: 'password123' },
      client: { email: 'david.thompson@client.com', password: 'password123' }
    };

    const credentials = demoCredentials?.[role];
    if (credentials) {
      setFormData(credentials);
      
      try {
        setFormLoading(true);
        const result = await signIn(credentials?.email, credentials?.password);
        
        if (result?.success) {
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Demo login error:', error);
      } finally {
        setFormLoading(false);
      }
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
            Sign in to AccountingPro
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            Access your financial dashboard and accounting tools
          </p>
        </div>

        {/* Demo Access Banner */}
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <div className="flex items-center">
            <Icon name="Info" size={16} color="var(--color-primary)" />
            <p className="ml-2 text-sm text-primary font-medium">
              Preview Mode: Try different roles
            </p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => handleDemoLogin('partner')}
              disabled={formLoading}
              className="text-xs bg-white border border-primary-300 text-primary px-3 py-2 rounded hover:bg-primary-50 transition-colors"
            >
              Partner Demo
            </button>
            <button
              onClick={() => handleDemoLogin('staff')}
              disabled={formLoading}
              className="text-xs bg-white border border-primary-300 text-primary px-3 py-2 rounded hover:bg-primary-50 transition-colors"
            >
              Staff Demo
            </button>
            <button
              onClick={() => handleDemoLogin('freelancer')}
              disabled={formLoading}
              className="text-xs bg-white border border-primary-300 text-primary px-3 py-2 rounded hover:bg-primary-50 transition-colors"
            >
              Freelancer Demo
            </button>
            <button
              onClick={() => handleDemoLogin('client')}
              disabled={formLoading}
              className="text-xs bg-white border border-primary-300 text-primary px-3 py-2 rounded hover:bg-primary-50 transition-colors"
            >
              Client Demo
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6 bg-white p-8 rounded-xl shadow-lg border border-border" onSubmit={handleSubmit}>
          {/* Error Display */}
          {authError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <Icon name="AlertCircle" size={20} color="#EF4444" />
                <div className="ml-2 flex-1">
                  <p className="text-red-700 text-sm">{authError}</p>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(authError)}
                    className="mt-1 text-xs text-red-600 hover:text-red-800 underline"
                  >
                    Copy error message
                  </button>
                </div>
                <button
                  type="button"
                  onClick={clearAuthError}
                  className="ml-2 text-red-600 hover:text-red-800"
                >
                  <Icon name="X" size={16} color="#EF4444" />
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">
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
                  autoComplete="current-password"
                  required
                  value={formData?.password}
                  onChange={handleInputChange}
                  className="pl-10 pr-10 w-full px-3 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-text-primary placeholder-text-secondary"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <Icon name={showPassword ? "EyeOff" : "Eye"} size={16} color="#9CA3AF" />
                </button>
              </div>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-text-secondary">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link to="/forgot-password" className="font-medium text-primary hover:text-primary-700">
                Forgot your password?
              </Link>
            </div>
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
                  Signing in...
                </div>
              ) : (
                <span className="flex items-center">
                  <Icon name="LogIn" size={16} color="white" />
                  <span className="ml-2">Sign in</span>
                </span>
              )}
            </button>
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-sm text-text-secondary">
              Don't have an account?{' '}
              <Link to="/signup" className="font-medium text-primary hover:text-primary-700">
                Sign up here
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

export default Login;