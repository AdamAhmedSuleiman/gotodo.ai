
// src/components/layout/Footer.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { APP_NAME } from '../../src/constants.js'; 

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 dark:bg-gray-900 text-white py-8 mt-auto transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-gray-300 dark:text-gray-400">&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Powered by Advanced AI & Cloud Technologies</p>
        <div className="mt-2">
          <Link to="/changelog" className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-200 dark:hover:text-gray-300 underline">
            Changelog
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;