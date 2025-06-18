// src/pages/RegistrationPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js'; 
import { useToast } from '../contexts/ToastContext.js';
import { UserRole, User } from '../types.js'; 
import Input from '../components/ui/Input.js'; 
import Button from '../components/ui/Button.js'; 
import { APP_NAME, ICON_PATHS } from '../constants.js'; 
import Icon from '../components/ui/Icon.js'; 
import FaceIDSetupModal from '../components/auth/FaceIDSetupModal.js';

const RegistrationPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.REQUESTER);
  const [error, setError] = useState('');
  const { register, isLoading, user: authUserFromContext, updateUser } = useAuth(); 
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [isFaceIDModalOpen, setIsFaceIDModalOpen] = useState(false);
  const [registeredUserForFaceID, setRegisteredUserForFaceID] = useState<User | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      addToast("Passwords do not match.", "error");
      return;
    }
    try {
      await register(name, email, password, role);
      // AuthProvider's useEffect will update authUserFromContext, which triggers the below useEffect
    } catch (err) {
      setError((err as Error).message || 'Failed to register. Please try again.');
      addToast((err as Error).message || 'Failed to register.', "error");
    }
  };
  
  // Effect to run after authUserFromContext might have been updated
  useEffect(() => {
    if (authUserFromContext && authUserFromContext.email === email && !isFaceIDModalOpen && !isLoading && !registeredUserForFaceID) {
      // Check !registeredUserForFaceID to prevent re-opening if modal was closed manually or due to other reasons
      setRegisteredUserForFaceID(authUserFromContext);
      setIsFaceIDModalOpen(true);
      addToast("Registration successful! Please set up Face ID.", "success");
    }
  }, [authUserFromContext, email, isFaceIDModalOpen, isLoading, addToast, registeredUserForFaceID]);


  const handleFaceIDSetupComplete = () => {
    if (registeredUserForFaceID) { 
      updateUser({ faceIdRegistered: true }); 
      addToast("Face ID setup complete (mocked)!", "success");
    }
  };

  const handleFaceIDModalClose = () => {
    setIsFaceIDModalOpen(false);
    setRegisteredUserForFaceID(null); // Clear this to allow re-trigger if needed (though unlikely in this flow)
    navigate('/'); 
  };


  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
        <div className="max-w-md w-full space-y-8 p-10 bg-white dark:bg-gray-800 shadow-xl rounded-lg">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
              Create your <span className="text-blue-600 dark:text-blue-400">{APP_NAME}</span> account
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && <p className="text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900 dark:bg-opacity-30 p-3 rounded-md">{error}</p>}
            <Input
              label="Full Name"
              name="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
            />
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
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
            />
            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
            />
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">I want to register as a:</label>
              <select
                id="role"
                name="role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-100"
              >
                <option value={UserRole.REQUESTER}>Requester (I need services/products)</option>
                <option value={UserRole.PROVIDER}>Service Provider (I offer services/products)</option>
              </select>
            </div>
            
            <div>
              <Button type="submit" isLoading={isLoading} className="w-full" variant="primary" size="lg">
                Create Account
              </Button>
            </div>
          </form>
          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>
      {registeredUserForFaceID && (
        <FaceIDSetupModal
          isOpen={isFaceIDModalOpen}
          onClose={handleFaceIDModalClose}
          onSetupComplete={handleFaceIDSetupComplete}
          userName={registeredUserForFaceID.name}
        />
      )}
    </>
  );
};

export default RegistrationPage;