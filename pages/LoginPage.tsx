
// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import { useToast } from '../contexts/ToastContext.js'; 
import Input from '../App components/ui/Input.js'; 
import Button from '../App components/ui/Button.js'; 
import { APP_NAME, ICON_PATHS } from '../src/constants.js'; 
import Icon from '../App components/ui/Icon.js'; 

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const { addToast } = useToast(); 
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      addToast('Login successful! Welcome back.', 'success'); 
      navigate('/');
    } catch (err) {
      const errorMessage = (err as Error).message || 'Failed to login. Please check your credentials.';
      setError(errorMessage);
      addToast(errorMessage, 'error'); 
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-md w-full space-y-8 p-10 bg-white dark:bg-gray-800 shadow-xl rounded-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            Sign in to <span className="text-blue-600 dark:text-blue-400">{APP_NAME}</span>
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4">
              <p className="text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900 dark:bg-opacity-30 p-3 rounded-md">{error}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 px-1">
                Hint: Try <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded text-xs">requester@example.com</code> or <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded text-xs">provider@example.com</code>.
              </p>
            </div>
          )}
          <Input
            label="Email address"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          
          <div className="flex items-center justify-between mt-4">
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              className="w-full flex items-center justify-center border border-gray-300 dark:border-gray-600 dark:text-blue-400 dark:hover:bg-gray-700"
              onClick={() => addToast('Face ID login (Demo - Not Implemented).', 'info')}
              title="Face ID login (Demo - Not Implemented)"
            >
              <Icon path={ICON_PATHS.FACE_SMILE} className="w-5 h-5 mr-2 text-blue-500 dark:text-blue-400" />
              Sign in with Face ID (Demo)
            </Button>
          </div>

          <div>
            <Button type="submit" isLoading={isLoading} className="w-full" variant="primary" size="lg">
              Sign in
            </Button>
          </div>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;