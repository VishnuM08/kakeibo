import { Lock, Delete } from 'lucide-react';
import { useState, useEffect } from 'react';

/**
 * PIN Lock Screen Component
 * 
 * BACKEND INTEGRATION:
 * - PIN verification via POST /api/user/verify-pin
 * - PIN should be hashed on backend using BCrypt
 * - Failed attempts should be rate-limited on backend
 * - Consider implementing biometric auth via Web Authentication API
 * 
 * BIOMETRIC AUTHENTICATION:
 * - Use navigator.credentials.get() for Face ID / Touch ID on supported devices
 * - Fallback to PIN entry if biometric fails
 * - Store biometric preference in backend
 */

interface PINLockScreenProps {
  onUnlock: () => void;
  isDarkMode?: boolean;
}

export function PINLockScreen({ onUnlock, isDarkMode = false }: PINLockScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  const maxAttempts = 5;

  // TODO: BACKEND INTEGRATION - Check for biometric support
  useEffect(() => {
    // Check if Web Authentication API is available
    if (window.PublicKeyCredential) {
      // Attempt biometric authentication
      // handleBiometricAuth();
    }
  }, []);

  const handleBiometricAuth = async () => {
    try {
      // TODO: BACKEND INTEGRATION
      // Implement Web Authentication API for Face ID / Touch ID
      // const credential = await navigator.credentials.get({
      //   publicKey: {
      //     challenge: new Uint8Array([/* challenge from server */]),
      //     // ... other options
      //   }
      // });
      // if (credential) {
      //   onUnlock();
      // }
      console.log('[Biometric] Auth attempted');
    } catch (err) {
      console.error('[Biometric] Auth failed:', err);
    }
  };

  const handleNumberClick = (num: number) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      
      if (newPin.length === 4) {
        verifyPin(newPin);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  const verifyPin = async (enteredPin: string) => {
    // TODO: BACKEND INTEGRATION - Call verifyUserPin API
    // const isValid = await verifyUserPin(enteredPin);
    
    // Mock verification for now
    const storedPin = localStorage.getItem('kakeibo_user_pin');
    const isValid = storedPin ? btoa(enteredPin) === storedPin : enteredPin === '1234';

    if (isValid) {
      onUnlock();
    } else {
      setError('Incorrect PIN');
      setPin('');
      setAttempts(attempts + 1);

      if (attempts + 1 >= maxAttempts) {
        // TODO: BACKEND INTEGRATION - Lock account temporarily
        alert('Too many failed attempts. Please try again later.');
      }
    }
  };

  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'delete'];

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center ${
      isDarkMode ? 'bg-[#121212]' : 'bg-[#f5f5f7]'
    }`}>
      <div className="max-w-md w-full px-8">
        {/* Logo / Title */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#007aff] to-[#0051d5] flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-white" strokeWidth={2.5} />
          </div>
          <h1 className={`text-[34px] font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
            Kakeibo
          </h1>
          <p className={`text-[17px] ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
            Enter your PIN to unlock
          </p>
        </div>

        {/* PIN Dots */}
        <div className="flex justify-center gap-4 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all ${
                pin.length > i
                  ? isDarkMode 
                    ? 'bg-white' 
                    : 'bg-black'
                  : isDarkMode
                    ? 'bg-white/20'
                    : 'bg-black/20'
              }`}
            />
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-center text-red-500 text-[15px] font-semibold mb-4">
            {error}
          </p>
        )}

        {/* Number Pad */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {numbers.map((num, index) => {
            if (num === null) {
              return <div key={index} />; // Empty space
            }

            if (num === 'delete') {
              return (
                <button
                  key={index}
                  onClick={handleDelete}
                  disabled={pin.length === 0}
                  className={`h-20 rounded-[16px] flex items-center justify-center transition-all active:scale-95 ${
                    isDarkMode
                      ? 'bg-[#1c1c1e] hover:bg-[#2c2c2e] disabled:opacity-30'
                      : 'bg-white hover:bg-[#f5f5f7] disabled:opacity-30'
                  }`}
                >
                  <Delete className={`w-6 h-6 ${isDarkMode ? 'text-white' : 'text-black'}`} strokeWidth={2.5} />
                </button>
              );
            }

            return (
              <button
                key={index}
                onClick={() => handleNumberClick(num as number)}
                className={`h-20 rounded-[16px] text-[32px] font-bold transition-all active:scale-95 ${
                  isDarkMode
                    ? 'bg-[#1c1c1e] hover:bg-[#2c2c2e] text-white'
                    : 'bg-white hover:bg-[#f5f5f7] text-black'
                }`}
              >
                {num}
              </button>
            );
          })}
        </div>

        {/* Biometric Button */}
        <button
          onClick={handleBiometricAuth}
          className={`w-full py-4 rounded-[14px] font-semibold text-[17px] transition-colors ${
            isDarkMode
              ? 'text-[#0a84ff] hover:bg-[#1c1c1e]'
              : 'text-[#007aff] hover:bg-white'
          }`}
        >
          Use Face ID / Touch ID
        </button>

        <p className={`text-center text-[13px] mt-6 ${isDarkMode ? 'text-white/30' : 'text-black/30'}`}>
          {maxAttempts - attempts} attempts remaining
        </p>
      </div>
    </div>
  );
}
