import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

export function LoginPage() {
  const { t } = useTranslation();
  const { login, users } = useAuth();
  const { isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (!success) {
        setError(t('auth.invalidCredentials'));
      }
    } catch (err) {
      setError(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password');
    setIsLoading(true);

    try {
      await login(demoEmail, 'password');
    } catch (err) {
      setError(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Get demo accounts
  const madam = users.find(u => u.email === 'madam@home.com');
  const sir = users.find(u => u.email === 'sir@home.com');
  const helper = users.find(u => u.email === 'helper@home.com');

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <div className={`w-full max-w-md ${isDark ? 'bg-slate-800' : 'bg-white'} rounded-2xl shadow-xl p-6`}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {t('app.name')}
          </h1>
          <p className={`text-sm mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {t('app.tagline')}
          </p>
        </div>

        {/* Demo Accounts */}
        <div className="mb-6">
          <p className={`text-sm font-medium mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            {t('auth.demoAccounts')} ({t('auth.password')}: "password")
          </p>
          <div className="grid grid-cols-3 gap-2">
            {madam && (
              <button
                onClick={() => handleDemoLogin(madam.email)}
                disabled={isLoading}
                className={`p-3 rounded-xl border-2 transition-colors ${
                  isDark 
                    ? 'border-slate-600 hover:border-blue-500 bg-slate-700' 
                    : 'border-slate-200 hover:border-blue-500 bg-slate-50'
                }`}
              >
                <div className="text-2xl mb-1">👩</div>
                <div className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {t('auth.madam')}
                </div>
                <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {t('auth.owner')}
                </div>
              </button>
            )}
            {sir && (
              <button
                onClick={() => handleDemoLogin(sir.email)}
                disabled={isLoading}
                className={`p-3 rounded-xl border-2 transition-colors ${
                  isDark 
                    ? 'border-slate-600 hover:border-blue-500 bg-slate-700' 
                    : 'border-slate-200 hover:border-blue-500 bg-slate-50'
                }`}
              >
                <div className="text-2xl mb-1">👨</div>
                <div className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {t('auth.sir')}
                </div>
                <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {t('auth.owner')}
                </div>
              </button>
            )}
            {helper && (
              <button
                onClick={() => handleDemoLogin(helper.email)}
                disabled={isLoading}
                className={`p-3 rounded-xl border-2 transition-colors ${
                  isDark 
                    ? 'border-slate-600 hover:border-blue-500 bg-slate-700' 
                    : 'border-slate-200 hover:border-blue-500 bg-slate-50'
                }`}
              >
                <div className="text-2xl mb-1">🤝</div>
                <div className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {t('auth.helper')}
                </div>
                <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {t('auth.helper')}
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className={`w-full border-t ${isDark ? 'border-slate-600' : 'border-slate-200'}`}></div>
          </div>
          <div className="relative flex justify-center">
            <span className={`px-2 text-sm ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-white text-slate-500'}`}>
              {t('common.or')}
            </span>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {t('auth.email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className={`w-full px-4 py-3 rounded-xl border ${
                isDark 
                  ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                  : 'bg-white border-slate-200 text-slate-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {t('auth.password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full px-4 py-3 rounded-xl border ${
                isDark 
                  ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                  : 'bg-white border-slate-200 text-slate-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('common.loading')}
              </span>
            ) : (
              t('auth.login')
            )}
          </button>
        </form>

        {/* Footer */}
        <div className={`mt-6 text-center text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          <p>Default password for all demo accounts: "password"</p>
        </div>
      </div>
    </div>
  );
}
