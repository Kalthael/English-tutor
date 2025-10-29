import React, { useState } from 'react';
import { GoogleIcon, SparklesIcon } from './Icons';

interface SignupScreenProps {
  onSignup: () => void;
  onSwitchToLogin: () => void;
}

export const SignupScreen: React.FC<SignupScreenProps> = ({ onSignup, onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      onSignup();
    }, 1000);
  };
  
  const handleGoogleSignup = () => {
    // Placeholder for Google signup logic
    setIsLoading(true);
    setTimeout(() => {
        onSignup();
    }, 1000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
                <SparklesIcon className="h-10 w-10 text-indigo-400" />
                <h1 className="text-4xl font-bold tracking-tight text-white">
                AI Language Coach
                </h1>
            </div>
          <h2 className="text-2xl font-bold text-white">Create your account</h2>
          <p className="text-gray-400">Start your language learning journey today</p>
        </div>

        <div className="bg-gray-800 border border-gray-700 shadow-2xl rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-300">Email</label>
                <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>
            <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-300">Password</label>
                <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>
            <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-semibold transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
            >
                {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
            </form>

            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="bg-gray-800 px-2 text-gray-400">OR</span>
                </div>
            </div>

            <button
                type="button"
                onClick={handleGoogleSignup}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-semibold transition-colors"
            >
                <GoogleIcon className="h-6 w-6" />
                Sign Up with Google
            </button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <button onClick={onSwitchToLogin} className="font-medium text-indigo-400 hover:underline focus:outline-none">
            Log in
          </button>
        </p>
      </div>
    </div>
  );
};