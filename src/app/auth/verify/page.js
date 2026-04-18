'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { auth as authApi } from '../../../lib/api';
import toast from 'react-hot-toast';
import { Mail, CheckCircle } from 'lucide-react';

export default function VerifyPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const inputs = useRef([]);

  useEffect(() => {
    if (!user) router.push('/auth/login');
    if (user?.is_verified) router.push('/dashboard');
  }, [user]);

  const handleChange = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const newCode = [...code];
    newCode[i] = val.slice(-1);
    setCode(newCode);
    if (val && i < 5) inputs.current[i + 1]?.focus();
    if (newCode.every(Boolean)) submitCode(newCode.join(''));
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const arr = pasted.split('');
      setCode(arr);
      submitCode(pasted);
    }
  };

  const submitCode = async (codeStr) => {
    setLoading(true);
    try {
      await authApi.verify(codeStr);
      setVerified(true);
      await refreshUser();
      toast.success('¡Email verificado!');
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Código incorrecto');
      setCode(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await authApi.resendVerification();
      toast.success('Código reenviado');
    } catch {
      toast.error('Error al reenviar');
    } finally {
      setResending(false);
    }
  };

  if (verified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={40} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">¡Verificado!</h2>
          <p className="text-gray-500 mt-2">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <span className="text-2xl font-bold">Super<span className="text-blue-600">Profe</span></span>
          </Link>
        </div>

        <div className="card p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Mail size={30} className="text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verificá tu email</h2>
          <p className="text-gray-500 mb-6 text-sm">
            Enviamos un código de 6 dígitos a <strong>{user?.email}</strong>
          </p>

          <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl outline-none transition-all
                  ${digit ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}
                  focus:border-blue-600 focus:bg-blue-50`}
                disabled={loading}
              />
            ))}
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 text-blue-600 mb-4">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              Verificando...
            </div>
          )}

          <button
            onClick={handleResend}
            disabled={resending}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {resending ? 'Reenviando...' : '¿No recibiste el código? Reenviar'}
          </button>
        </div>
      </div>
    </div>
  );
}
