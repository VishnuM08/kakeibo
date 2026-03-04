import { Lock, Delete } from "lucide-react";
import { useState, useEffect } from "react";
import { Preferences } from "@capacitor/preferences";

/**
 * PIN Lock Screen Component
 */

interface PINLockScreenProps {
  onUnlock: () => void;
  isDarkMode?: boolean;
}

export function PINLockScreen({
  onUnlock,
  isDarkMode = false,
}: PINLockScreenProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);

  const maxAttempts = 5;

  const handleBiometricAuth = async () => {
    try {
      console.log("[Biometric] Auth attempted");
    } catch (err) {
      console.error("[Biometric] Auth failed:", err);
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
    setError("");
  };

  const verifyPin = async (enteredPin: string) => {
    // Check Preferences instead of localStorage
    const { value: storedPin } = await Preferences.get({
      key: "kakeibo_user_pin",
    });

    // Default to '1234' for easier testing if none saved
    const isValid = storedPin
      ? btoa(enteredPin) === storedPin
      : enteredPin === "1234";

    if (isValid) {
      onUnlock();
    } else {
      setError("Incorrect PIN");
      setPin("");
      setAttempts(attempts + 1);

      if (attempts + 1 >= maxAttempts) {
        alert("Too many failed attempts. Please try again later.");
      }
    }
  };

  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, "delete"];

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-colors duration-500 ${
        isDarkMode ? "bg-[#121212]" : "bg-[#f5f5f7]"
      }`}
    >
      <div className="max-w-md w-full px-8">
        {/* Logo / Title */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#007aff] to-[#0051D5] flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Lock className="w-10 h-10 text-white" strokeWidth={2.5} />
          </div>
          <h1
            className={`text-[34px] font-bold mb-2 ${isDarkMode ? "text-white" : "text-black"}`}
          >
            Kakeibo
          </h1>
          <p
            className={`text-[17px] ${isDarkMode ? "text-white/50" : "text-black/50"}`}
          >
            Enter your PIN to unlock
          </p>
        </div>

        {/* PIN Dots */}
        <div className="flex justify-center gap-4 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-300 ${
                pin.length > i
                  ? isDarkMode
                    ? "bg-white scale-110"
                    : "bg-black scale-110"
                  : isDarkMode
                    ? "bg-white/20"
                    : "bg-black/20"
              }`}
            />
          ))}
        </div>

        {/* Error Message */}
        <div className="h-6 mb-4">
          {error && (
            <p className="text-center text-red-500 text-[15px] font-semibold animate-pulse">
              {error}
            </p>
          )}
        </div>

        {/* Number Pad */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {numbers.map((num, index) => {
            if (num === null) {
              return <div key={index} />; // Empty space
            }

            if (num === "delete") {
              return (
                <button
                  key={index}
                  onClick={handleDelete}
                  disabled={pin.length === 0}
                  className={`h-20 rounded-[20px] flex items-center justify-center transition-all active:scale-90 ${
                    isDarkMode
                      ? "bg-[#1c1c1e] hover:bg-[#2c2c2e] disabled:opacity-10"
                      : "bg-white hover:bg-[#e5e5e7] disabled:opacity-10"
                  } shadow-sm`}
                >
                  <Delete
                    className={`w-6 h-6 ${isDarkMode ? "text-white" : "text-black"}`}
                    strokeWidth={2.5}
                  />
                </button>
              );
            }

            return (
              <button
                key={index}
                onClick={() => handleNumberClick(num as number)}
                className={`h-20 rounded-[20px] text-[32px] font-semibold transition-all active:scale-95 ${
                  isDarkMode
                    ? "bg-[#1c1c1e] hover:bg-[#2c2c2e] text-white"
                    : "bg-white hover:bg-[#e5e5e7] text-black"
                } shadow-sm`}
              >
                {num}
              </button>
            );
          })}
        </div>

        {/* Biometric Button */}
        <button
          onClick={handleBiometricAuth}
          className={`w-full py-4 rounded-[14px] font-semibold text-[17px] transition-all active:scale-[0.98] ${
            isDarkMode
              ? "text-[#0a84ff] hover:bg-white/5"
              : "text-[#007aff] hover:bg-black/5"
          }`}
        >
          Use Face ID / Touch ID
        </button>

        <p
          className={`text-center text-[13px] mt-6 ${isDarkMode ? "text-white/30" : "text-black/30"}`}
        >
          {maxAttempts - attempts} attempts remaining
        </p>
      </div>
    </div>
  );
}
