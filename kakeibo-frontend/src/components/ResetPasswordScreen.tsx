import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { resetPassword } from "../services/api";

interface ResetPasswordScreenProps {
  token: string;
  onResetSuccess: () => void;
  isDarkMode?: boolean;
}

export function ResetPasswordScreen({
  token,
  onResetSuccess,
  isDarkMode = false,
}: ResetPasswordScreenProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      setError(
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      );
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword(token, newPassword);
      onResetSuccess();
    } catch (err: any) {
      // Do NOT log the token or the full error object that might contain config.data (token)
      console.error("Reset Password API Error occurred");

      if (err.response) {
        const status = err.response.status;
        const serverMessage = err.response.data?.message;

        if (status === 429) {
          setError("Too many attempts, please try later.");
        } else if (status === 400) {
          setError(
            serverMessage ||
              "Invalid request. The link might be expired or invalid.",
          );
        } else if (status >= 500) {
          setError("Server error. Please try again later.");
        } else {
          setError(serverMessage || "Failed to reset password.");
        }
      } else if (err.request) {
        setError("Network error. Please check your connection to the server.");
      } else {
        setError(
          err.message || "Failed to reset password. The link might be expired.",
        );
      }

      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center px-6 pt-safe pb-safe ${
          isDarkMode ? "bg-[#121212]" : "bg-[#f5f5f7]"
        }`}
      >
        <div className="w-full max-w-md my-auto py-8 text-center">
          <div
            className={`rounded-[28px] p-8 shadow-lg ${isDarkMode ? "bg-[#1c1c1e]" : "bg-white"}`}
          >
            <h2 className={`text-[22px] font-bold text-red-500 mb-4`}>
              Invalid Reset Link
            </h2>
            <p
              className={`text-[15px] ${isDarkMode ? "text-white/60" : "text-black/60"} mb-6`}
            >
              The reset token is missing from the URL. Please ensure you clicked
              the full link provided in your email.
            </p>
            <button
              onClick={onResetSuccess}
              className={`w-full py-[15px] px-6 rounded-[14px] transition-all duration-150 font-semibold text-[17px] active:scale-[0.97] ${
                isDarkMode
                  ? "bg-white hover:bg-white/90 text-black"
                  : "bg-black hover:bg-black/90 text-white"
              }`}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center px-6 pt-safe pb-safe ${
        isDarkMode ? "bg-[#121212]" : "bg-[#f5f5f7]"
      }`}
    >
      <div className="w-full max-w-md my-auto py-8">
        {/* Logo */}
        <div className="text-center mb-10">
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
            Secure Password Reset
          </p>
        </div>

        {/* Form */}
        <div
          className={`rounded-[28px] p-8 shadow-lg ${
            isDarkMode ? "bg-[#1c1c1e]" : "bg-white"
          }`}
        >
          <div className="mb-8 text-center">
            <h2
              className={`text-[22px] font-bold ${isDarkMode ? "text-white" : "text-black"}`}
            >
              Create New Password
            </h2>
            <p
              className={`mt-2 text-[15px] ${isDarkMode ? "text-white/60" : "text-black/60"}`}
            >
              Please enter your new password below.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className={`block text-[15px] font-semibold mb-2 ${
                  isDarkMode ? "text-white" : "text-black"
                }`}
              >
                New Password
              </label>
              <div className="relative">
                <Lock
                  className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${
                    isDarkMode ? "text-white/40" : "text-black/40"
                  }`}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className={`w-full pl-12 pr-12 py-3.5 rounded-[12px] text-[17px] focus:outline-none focus:ring-2 ${
                    isDarkMode
                      ? "bg-[#2c2c2e] text-white placeholder:text-white/30 focus:ring-[#0a84ff]"
                      : "bg-[#f5f5f7] text-black placeholder:text-black/30 focus:ring-[#007aff]"
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff
                      className={`w-5 h-5 ${isDarkMode ? "text-white/40" : "text-black/40"}`}
                    />
                  ) : (
                    <Eye
                      className={`w-5 h-5 ${isDarkMode ? "text-white/40" : "text-black/40"}`}
                    />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label
                className={`block text-[15px] font-semibold mb-2 ${
                  isDarkMode ? "text-white" : "text-black"
                }`}
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock
                  className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${
                    isDarkMode ? "text-white/40" : "text-black/40"
                  }`}
                />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className={`w-full pl-12 pr-12 py-3.5 rounded-[12px] text-[17px] focus:outline-none focus:ring-2 ${
                    isDarkMode
                      ? "bg-[#2c2c2e] text-white placeholder:text-white/30 focus:ring-[#0a84ff]"
                      : "bg-[#f5f5f7] text-black placeholder:text-black/30 focus:ring-[#007aff]"
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  {showConfirmPassword ? (
                    <EyeOff
                      className={`w-5 h-5 ${isDarkMode ? "text-white/40" : "text-black/40"}`}
                    />
                  ) : (
                    <Eye
                      className={`w-5 h-5 ${isDarkMode ? "text-white/40" : "text-black/40"}`}
                    />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-[12px] p-4 text-center">
                <p className="text-red-500 text-[15px] font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-[15px] px-6 rounded-[14px] transition-all duration-150 font-semibold text-[17px] active:scale-[0.97] mt-4 ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              } ${
                isDarkMode
                  ? "bg-white hover:bg-white/90 text-black"
                  : "bg-black hover:bg-black/90 text-white"
              }`}
            >
              {isLoading ? "Please wait..." : "Reset Password"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={onResetSuccess}
              className={`text-[15px] font-medium transition-colors ${isDarkMode ? "text-white/70 hover:text-white" : "text-black/70 hover:text-black"}`}
            >
              Back to Login
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center space-y-1">
          <p
            className={`text-[11px] ${
              isDarkMode ? "text-white/50" : "text-black/60"
            }`}
          >
            © 2026 Aignite Technologies. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
