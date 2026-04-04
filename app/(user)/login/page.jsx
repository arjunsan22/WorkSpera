'use client';
import { useState, useEffect, useRef } from 'react';
import Link from "next/link";
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';

export default function LoginPage() {
  // Logic & State (Unchanged)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // Refs for GSAP
  const containerRef = useRef(null);
  const cardRef = useRef(null);
  const formItemsRef = useRef([]);
  const backgroundCirclesRef = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Entrance Animation
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      tl.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 1 })
        .fromTo(cardRef.current,
          { y: 100, opacity: 0, scale: 0.9, rotateX: -20 },
          { y: 0, opacity: 1, scale: 1, rotateX: 0, duration: 1.2 },
          "-=0.5"
        )
        .fromTo(formItemsRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.1, duration: 0.8 },
          "-=0.7"
        );

      // Background floating animation
      backgroundCirclesRef.current.forEach((circle, i) => {
        gsap.to(circle, {
          x: "random(-100, 100)",
          y: "random(-100, 100)",
          duration: "random(10, 20)",
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: i * 0.5
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });
      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
      } else {
        router.replace('/');
      }
    } catch (err) {
      setError('Something went wrong');
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError('');
    try {
      await signIn('google', { callbackUrl: '/' });
    } catch (err) {
      setError('Google sign-in failed. Please try again.');
      setIsGoogleLoading(false);
    }
  };

  const addToRefs = (el) => {
    if (el && !formItemsRef.current.includes(el)) {
      formItemsRef.current.push(el);
    }
  };

  return (
    <div ref={containerRef} className="flex h-screen bg-[#020617] text-slate-200 overflow-hidden font-sans selection:bg-indigo-500/30 relative">
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
        
        .glass-card {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(51, 65, 85, 0.5);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
      `}</style>

      {/* GSAP Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          ref={el => backgroundCirclesRef.current[0] = el}
          className="absolute top-[10%] left-[10%] w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-[120px]"
        />
        <div
          ref={el => backgroundCirclesRef.current[1] = el}
          className="absolute bottom-[10%] right-[10%] w-[350px] h-[350px] bg-purple-600/20 rounded-full blur-[100px]"
        />
      </div>

      <div className="z-10 w-full flex items-center justify-center p-4">
        <div
          ref={cardRef}
          className="glass-card w-full max-w-[440px] rounded-[2rem] p-8 md:p-12 transition-transform duration-500"
          style={{ perspective: '1000px' }}
        >
          {/* Header */}
          <div ref={addToRefs} className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-gradient-to-br from-white via-slate-300 to-slate-500 bg-clip-text text-transparent mb-3">
              WrokSpera
            </h1>
          </div>

          {/* Error Message */}
          {error && (
            <div ref={addToRefs} className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-400 text-xs text-center font-medium">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div ref={addToRefs} className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Email</label>
              <input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 bg-slate-950/50 border border-slate-800 rounded-2xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-300 placeholder:text-slate-600 text-slate-200"
                required
              />
            </div>

            <div ref={addToRefs} className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-950/50 border border-slate-800 rounded-2xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-300 placeholder:text-slate-600 text-slate-200"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268-2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>

            <div ref={addToRefs} className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900" />
                <span className="ml-2 text-slate-400 group-hover:text-slate-200 transition-colors">Remember me</span>
              </label>
              <Link href="/forgot-password" size="sm" className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
                Forgot Password?
              </Link>
            </div>

            <button
              ref={addToRefs}
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all duration-300 disabled:opacity-50 flex items-center justify-center overflow-hidden group relative"
            >
              <span className="relative z-10">
                {isLoading ? 'Processing...' : 'Sign In'}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            </button>
          </form>

          {/* Divider */}
          <div ref={addToRefs} className="flex items-center my-8">
            <div className="flex-1 border-t border-slate-800"></div>
            <span className="px-4 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Social Access</span>
            <div className="flex-1 border-t border-slate-800"></div>
          </div>

          {/* Social Login */}
          <div ref={addToRefs}>
            <button
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
              className="w-full flex items-center justify-center gap-3 py-4 bg-slate-900/50 border border-slate-800 rounded-2xl hover:bg-slate-800 hover:border-slate-700 transition-all duration-300 text-sm font-semibold"
            >
              {isGoogleLoading ? (
                <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#fff" opacity="0.7" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#fff" opacity="0.5" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#fff" opacity="0.8" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              {isGoogleLoading ? 'Connecting...' : 'Continue with Google'}
            </button>
          </div>

          {/* Footer Link */}
          <div ref={addToRefs} className="mt-10 text-center">
            <p className="text-sm text-slate-500">
              New here?{' '}
              <Link href="/register" className="text-white font-bold hover:underline underline-offset-4">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}