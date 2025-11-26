'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  const router = useRouter();

  // Validation rules
  const validateField = (fieldName, value) => {
    switch (fieldName) {
      case 'name':
        if (!value.trim()) return 'Full name is required';
        if (value.length < 2) return 'Name must be at least 2 characters';
        return '';

      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
        return '';

      case 'username':
        if (!value.trim()) return 'Username is required';
        if (value.length < 3) return 'Username must be at least 3 characters';
        if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Username can only contain letters, numbers, and underscores';
        return '';

      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (!/(?=.*[a-z])/.test(value)) return 'Password must contain at least one lowercase letter';
        if (!/(?=.*[A-Z])/.test(value)) return 'Password must contain at least one uppercase letter';
        if (!/(?=.*\d)/.test(value)) return 'Password must contain at least one number';
        return '';

      default:
        return '';
    }
  };

  const handleBlur = (fieldName) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    const value = { name, email, username, password }[fieldName];
    setErrors(prev => ({ ...prev, [fieldName]: validateField(fieldName, value) }));
  };

  const handleFieldChange = (fieldName, value, setter) => {
    setter(value);
    if (touched[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: validateField(fieldName, value) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate all fields
    const newErrors = {
      name: validateField('name', name),
      email: validateField('email', email),
      username: validateField('username', username),
      password: validateField('password', password)
    };

    setErrors(newErrors);
    setTouched({ name: true, email: true, username: true, password: true });

    // Check if there are any errors
    if (Object.values(newErrors).some(err => err !== '')) {
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }


      if (res.ok) {
        router.push('/');
      } else {
        setError('Login failed after registration');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInputClassName = (fieldName) => {
    const baseClass = "w-full pl-12 pr-4 py-3 border-b-2 outline-none transition-all placeholder-gray-400";
    if (touched[fieldName] && errors[fieldName]) {
      return `${baseClass} border-red-500 focus:border-red-600`;
    }
    if (touched[fieldName] && !errors[fieldName] && { name, email, username, password }[fieldName]) {
      return `${baseClass} border-green-500 focus:border-green-600`;
    }
    return `${baseClass} border-gray-300 focus:border-blue-500`;
  };

  const getValidationIcon = (fieldName, value) => {
    if (!touched[fieldName]) return null;
    
    if (errors[fieldName]) {
      return (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </span>
      );
    }
    
    if (value) {
      return (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </span>
      );
    }
    
    return null;
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-300 via-blue-200 to-blue-100 p-4 relative overflow-hidden">
      {/* Decorative Character - Left */}
      <div className="hidden lg:block absolute left-20 bottom-10">
        <div className="relative">
          <svg className="w-64 h-64" viewBox="0 0 200 300" fill="none">
            <ellipse cx="100" cy="280" rx="40" ry="8" fill="#000" opacity="0.1"/>
            <rect x="70" y="180" width="60" height="100" rx="30" fill="#2C3E50"/>
            <circle cx="100" cy="100" r="50" fill="#E17055"/>
            <ellipse cx="100" cy="95" rx="45" ry="50" fill="#E17055"/>
            <circle cx="85" cy="90" r="8" fill="#2C3E50"/>
            <circle cx="115" cy="90" r="8" fill="#2C3E50"/>
            <circle cx="87" cy="88" r="3" fill="white"/>
            <circle cx="117" cy="88" r="3" fill="white"/>
            <path d="M 85 105 Q 100 110 115 105" stroke="#2C3E50" strokeWidth="2" fill="none"/>
            <rect x="75" y="130" width="50" height="50" rx="5" fill="#E8A598"/>
          </svg>
        </div>
      </div>

      {/* Decorative Plants - Right */}
      <div className="hidden lg:block absolute right-20 bottom-10">
        <svg className="w-48 h-64" viewBox="0 0 150 200" fill="none">
          <ellipse cx="75" cy="190" rx="60" ry="10" fill="#A8E6CF" opacity="0.3"/>
          <path d="M 75 190 Q 60 140 55 100 Q 50 60 60 30" stroke="#9B59B6" strokeWidth="15" fill="none" strokeLinecap="round"/>
          <ellipse cx="60" cy="40" rx="25" ry="35" fill="#E8B4F0" opacity="0.8"/>
          <path d="M 75 190 Q 90 150 95 110 Q 100 70 90 40" stroke="#8E44AD" strokeWidth="15" fill="none" strokeLinecap="round"/>
          <ellipse cx="90" cy="50" rx="28" ry="40" fill="#DDA0DD" opacity="0.8"/>
        </svg>
      </div>

      {/* Register Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 md:p-10 relative z-10">
        {/* Header */}
        <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-8">
          NEW ACCOUNT?
        </h1>

        {/* Server Error Message */}
        {error && (
          <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Registration Form */}
        <div className="space-y-5">
          {/* Full Name Field */}
          <div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => handleFieldChange('name', e.target.value, setName)}
                onBlur={() => handleBlur('name')}
                className={getInputClassName('name')}
                required
              />
              {getValidationIcon('name', name)}
            </div>
            {touched.name && errors.name && (
              <p className="mt-1 text-xs text-red-500 ml-1">{errors.name}</p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => handleFieldChange('email', e.target.value, setEmail)}
                onBlur={() => handleBlur('email')}
                className={getInputClassName('email')}
                required
              />
              {getValidationIcon('email', email)}
            </div>
            {touched.email && errors.email && (
              <p className="mt-1 text-xs text-red-500 ml-1">{errors.email}</p>
            )}
          </div>

          {/* Username Field */}
          <div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => handleFieldChange('username', e.target.value, setUsername)}
                onBlur={() => handleBlur('username')}
                className={getInputClassName('username')}
                required
              />
              {getValidationIcon('username', username)}
            </div>
            {touched.username && errors.username && (
              <p className="mt-1 text-xs text-red-500 ml-1">{errors.username}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => handleFieldChange('password', e.target.value, setPassword)}
                onBlur={() => handleBlur('password')}
                className={getInputClassName('password')}
                required
              />
              {getValidationIcon('password', password)}
            </div>
            {touched.password && errors.password && (
              <p className="mt-1 text-xs text-red-500 ml-1">{errors.password}</p>
            )}
          </div>

          {/* Register Button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-400 to-blue-500 text-white font-semibold rounded-full hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-6"
          >
            {isSubmitting ? 'REGISTERING...' : 'REGISTER'}
          </button>
        </div>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}