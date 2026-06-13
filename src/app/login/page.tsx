'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/auth';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (login(password)) {
      router.push('/');
    } else {
      setError('Incorrect password.');
      setPassword('');
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-xl">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-gray-900">Cyber Advisory Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">Enter your password to continue.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            autoFocus
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            className="w-full bg-gray-900 text-white text-sm py-2.5 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Unlock
          </button>
        </form>
      </div>
    </div>
  );
}