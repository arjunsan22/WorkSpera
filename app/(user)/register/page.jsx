'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from "next/link";
import gsap from 'gsap';

export default function RegisterPage() {
  // --- Logic & State (Unchanged) ---
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();

  // Refs for GSAP
  const containerRef = useRef(null);
  const cardRef = useRef(null);
  const formItemsRef = useRef([]);
  const backgroundCirclesRef = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      tl.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 1 })
        .fromTo(cardRef.current,
          { y: 60, opacity: 0, scale: 0.95 },
          { y: 0, opacity: 1, scale: 1, duration: 1.2 },
          "-=0.5"
        )
        .fromTo(formItemsRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.05, duration: 0.8 },
          "-=0.8"
        );

      backgroundCirclesRef.current.forEach((circle, i) => {
        gsap.to(circle, {
          x: "random(-80, 80)",
          y: "random(-80, 80)",
          duration: "random(12, 24)",
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: i * 0.5
        });
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const validateField = (fieldName, value) => {
    switch (fieldName) {
      case 'name':
        if (!value.trim()) return 'Full name is required';
        if (value.length < 2) return 'Name must be at least 2 characters';
        return '';
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email';
        return '';
      case 'username':
        if (!value.trim()) return 'Username is required';
        if (value.length < 3) return 'Username must be at least 3 characters';
        if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Only letters, numbers, and underscores';
        return '';
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 8) return 'At least 8 characters';
        if (!/(?=.*[a-z])/.test(value)) return 'One lowercase letter required';
        if (!/(?=.*[A-Z])/.test(value)) return 'One uppercase letter required';
        if (!/(?=.*\d)/.test(value)) return 'One number required';
        return '';
      default: return '';
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
    const newErrors = {
      name: validateField('name', name),
      email: validateField('email', email),
      username: validateField('username', username),
      password: validateField('password', password)
    };
    setErrors(newErrors);
    setTouched({ name: true, email: true, username: true, password: true });
    if (Object.values(newErrors).some(err => err !== '')) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      if (data.requiresVerification) {
        router.replace(`/verify-otp?email=${encodeURIComponent(email)}`);
      } else {
        router.replace('/');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPasswordStrength = () => {
    if (!password) return { strength: 0, text: '', color: '' };
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    if (strength <= 2) return { strength: (strength / 5) * 100, text: 'Weak', color: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' };
    if (strength <= 3) return { strength: (strength / 5) * 100, text: 'Fair', color: 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]' };
    if (strength <= 4) return { strength: (strength / 5) * 100, text: 'Good', color: 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' };
    return { strength: 100, text: 'Strong', color: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' };
  };

  // UI Helpers (Styled for Dark Theme)
  const getInputClassName = (fieldName) => {
    const baseClass = "w-full pl-12 pr-12 py-3.5 bg-slate-950/50 border border-slate-800 rounded-2xl outline-none transition-all duration-300 placeholder-slate-600 text-slate-200";
    if (touched[fieldName] && errors[fieldName]) return `${baseClass} border-red-500/50 focus:border-red-500 ring-1 ring-red-500/20`;
    if (touched[fieldName] && !errors[fieldName] && { name, email, username, password }[fieldName]) return `${baseClass} border-emerald-500/50 focus:border-emerald-500`;
    return `${baseClass} focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30`;
  };

  const addToRefs = (el) => { if (el && !formItemsRef.current.includes(el)) formItemsRef.current.push(el); };

  const passwordStrength = getPasswordStrength();

  return (
    <div ref={containerRef} className="flex min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-200 overflow-hidden font-sans selection:bg-indigo-500/30 relative">
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .glass-card {
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(51, 65, 85, 0.4);
        }
      `}</style>

      {/* GSAP Animated Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div ref={el => backgroundCirclesRef.current[0] = el} className="absolute top-[5%] left-[5%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]" />
        <div ref={el => backgroundCirclesRef.current[1] = el} className="absolute bottom-[5%] right-[5%] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="z-10 w-full flex items-center justify-center p-4 py-12 overflow-y-auto custom-scrollbar">
        <div
          ref={cardRef}
          className="glass-card w-full max-w-[480px] rounded-[2.5rem] p-8 md:p-12 shadow-2xl"
        >
          {/* Header */}
          <div ref={addToRefs} className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-gradient-to-br from-white via-slate-300 to-slate-500 bg-clip-text text-transparent mb-2">
              Create Account
            </h1>
            <p className="text-slate-400 text-sm">Start your journey with WrokSpera</p>
          </div>

          {error && (
            <div ref={addToRefs} className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs text-center font-medium animate-pulse">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div ref={addToRefs} className="group space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">Full Name</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <input
                  type="text"
                  placeholder=""
                  value={name}
                  onChange={(e) => handleFieldChange('name', e.target.value, setName)}
                  onBlur={() => handleBlur('name')}
                  className={getInputClassName('name')}
                  required
                />
              </div>
              {touched.name && errors.name && <p className="text-[10px] text-red-400 ml-2">{errors.name}</p>}
            </div>

            {/* Email */}
            <div ref={addToRefs} className="group space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">Email Address</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <input
                  type="email"
                  placeholder=""
                  value={email}
                  onChange={(e) => handleFieldChange('email', e.target.value, setEmail)}
                  onBlur={() => handleBlur('email')}
                  className={getInputClassName('email')}
                  required
                />
              </div>
              {touched.email && errors.email && <p className="text-[10px] text-red-400 ml-2">{errors.email}</p>}
            </div>

            {/* Username */}
            <div ref={addToRefs} className="group space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">Username</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <input
                  type="text"
                  placeholder=""
                  value={username}
                  onChange={(e) => handleFieldChange('username', e.target.value, setUsername)}
                  onBlur={() => handleBlur('username')}
                  className={getInputClassName('username')}
                  required
                />
              </div>
              {touched.username && errors.username && <p className="text-[10px] text-red-400 ml-2">{errors.username}</p>}
            </div>

            {/* Password */}
            <div ref={addToRefs} className="group space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">Password</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => handleFieldChange('password', e.target.value, setPassword)}
                  onBlur={() => handleBlur('password')}
                  className={getInputClassName('password')}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268-2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
              {password && (
                <div className="px-1 pt-1 space-y-1.5">
                  <div className="flex justify-between items-center text-[9px] uppercase tracking-tighter font-bold">
                    <span className="text-slate-500">Security Strength</span>
                    <span className={passwordStrength.text === 'Strong' ? 'text-emerald-400' : 'text-slate-400'}>{passwordStrength.text}</span>
                  </div>
                  <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-700 ${passwordStrength.color}`} style={{ width: `${passwordStrength.strength}%` }} />
                  </div>
                </div>
              )}
              {touched.password && errors.password && <p className="text-[10px] text-red-400 ml-2">{errors.password}</p>}
            </div>

            {/* Register Button */}
            <button
              ref={addToRefs}
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all duration-300 disabled:opacity-50 group relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isSubmitting ? 'Architecting Account...' : 'Create Account'}
                {!isSubmitting && <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            </button>
          </form>

          {/* Social Access */}
          <div ref={addToRefs} className="flex items-center my-6">
            <div className="flex-1 border-t border-slate-800"></div>
            <span className="px-4 text-[9px] uppercase tracking-[0.3em] text-slate-600 font-bold">Or use social</span>
            <div className="flex-1 border-t border-slate-800"></div>
          </div>

          <button
            ref={addToRefs}
            onClick={async () => {
              setIsGoogleLoading(true);
              try { await signIn('google', { callbackUrl: '/' }); }
              catch (err) { setIsGoogleLoading(false); }
            }}
            className="w-full flex items-center justify-center gap-3 py-4 bg-slate-900/50 border border-slate-800 rounded-2xl hover:bg-slate-800 transition-all duration-300 text-sm font-semibold mb-8"
          >
            {isGoogleLoading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#fff" opacity="0.6" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /></svg>}
            Google
          </button>

          <div ref={addToRefs} className="text-center">
            <p className="text-sm text-slate-500">
              Already a member?{' '}
              <Link href="/login" className="text-white font-bold hover:underline underline-offset-4">Sign In</Link>
            </p>
            <p className="mt-4 text-[10px] text-slate-600 px-6 leading-relaxed">
              By joining, you agree to our <a href="#" className="underline">Terms</a> and <a href="#" className="underline">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer { 100% { transform: translateX(100%); } }
      `}</style>
    </div>
  );
}