import { useState } from "react";
import { Lock, Mail, User, Eye, EyeOff } from "lucide-react";
import { login, register, setAuthToken, forgotPassword } from "../services/api";
import { clearAllLocalData } from "../utils/syncUtils";
import { Preferences } from "@capacitor/preferences";

/**
 * Authentication Screen Component
 * Handles both Login and Registration
 *
 * BACKEND INTEGRATION:
 * - Calls POST /api/auth/login for login
 * - Calls POST /api/auth/register for registration
 * - Stores JWT token in localStorage
 * - Redirects to main app on success
 */

interface AuthScreenProps {
  onAuthSuccess: (token: string, user: any) => void;
  isDarkMode?: boolean;
}

export function AuthScreen({
  onAuthSuccess,
  isDarkMode = false,
}: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isForgotPassword) {
        if (!email.trim()) {
          setError("Please enter your email");
          setIsLoading(false);
          return;
        }
        await forgotPassword(email);
        setResetSent(true);
        setIsLoading(false);
        return;
      }

      if (isLogin) {
        // TODO: BACKEND INTEGRATION - Call login API
        const response = await login({ email, password });

        // Normalize user data (handle nested or top-level response)
        const baseUser = response.user || response;
        const userData = {
          name:
            baseUser.name ||
            baseUser.username ||
            baseUser.fullName ||
            baseUser.email ||
            "User",
          email: baseUser.email,
          id: baseUser.id,
        };

        // Store token and user data
        await setAuthToken(response.token);
        await Preferences.set({
          key: "user_data",
          value: JSON.stringify(userData),
        });

        onAuthSuccess(response.token, userData);
      } else {
        // TODO: BACKEND INTEGRATION - Call register API
        if (!name.trim()) {
          setError("Please enter your name");
          setIsLoading(false);
          return;
        }

        await register({ email, password, name });

        clearAllLocalData();
        // Redirect user to the OTP verification screen
        window.location.href = `/verify-email?email=${encodeURIComponent(email)}`;
        return;
      }
    } catch (err: any) {
      console.error("Auth Error:", err);

      let errorMessage = "Authentication failed. Please try again.";

      if (err.response) {
        // Backend returned an error response
        const status = err.response.status;
        const serverMessage = err.response.data?.message;

        if (status === 401 || status === 404 || status === 400) {
          errorMessage = serverMessage || "Invalid email or password.";
        } else if (status >= 500) {
          errorMessage = "Server error. Please try again later.";
        } else {
          errorMessage = serverMessage || errorMessage;
        }
      } else if (err.request) {
        // Request made but no response received
        errorMessage =
          "Network error. Please check your connection to the server.";
      } else {
        errorMessage = err.message || errorMessage;
      }

      setError(errorMessage);
      setIsLoading(false);
    }
  };

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
            Mindful spending, better saving
          </p>
        </div>

        {/* Auth Form */}
        <div
          className={`rounded-[28px] p-8 shadow-lg ${
            isDarkMode ? "bg-[#1c1c1e]" : "bg-white"
          }`}
        >
          {!isForgotPassword ? (
            <div className="flex gap-2 mb-8">
              <button
                onClick={() => {
                  setIsLogin(true);
                  setError("");
                }}
                className={`flex-1 py-3 rounded-[12px] font-semibold text-[17px] transition-all ${
                  isLogin
                    ? isDarkMode
                      ? "bg-white text-black"
                      : "bg-black text-white"
                    : isDarkMode
                      ? "bg-[#2c2c2e] text-white/50"
                      : "bg-[#f5f5f7] text-black/50"
                }`}
              >
                Login
              </button>
              <button
                onClick={() => {
                  setIsLogin(false);
                  setError("");
                }}
                className={`flex-1 py-3 rounded-[12px] font-semibold text-[17px] transition-all ${
                  !isLogin
                    ? isDarkMode
                      ? "bg-white text-black"
                      : "bg-black text-white"
                    : isDarkMode
                      ? "bg-[#2c2c2e] text-white/50"
                      : "bg-[#f5f5f7] text-black/50"
                }`}
              >
                Register
              </button>
            </div>
          ) : (
            <div className="mb-8 text-center">
              <h2
                className={`text-[22px] font-bold ${isDarkMode ? "text-white" : "text-black"}`}
              >
                Reset Password
              </h2>
              <p
                className={`mt-2 text-[15px] ${isDarkMode ? "text-white/60" : "text-black/60"}`}
              >
                Enter your email address to receive a password reset link.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && !isForgotPassword && (
              <div>
                <label
                  className={`block text-[15px] font-semibold mb-2 ${
                    isDarkMode ? "text-white" : "text-black"
                  }`}
                >
                  Full Name
                </label>
                <div className="relative">
                  <User
                    className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${
                      isDarkMode ? "text-white/40" : "text-black/40"
                    }`}
                  />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className={`w-full pl-12 pr-4 py-3.5 rounded-[12px] text-[17px] focus:outline-none focus:ring-2 ${
                      isDarkMode
                        ? "bg-[#2c2c2e] text-white placeholder:text-white/30 focus:ring-[#0a84ff]"
                        : "bg-[#f5f5f7] text-black placeholder:text-black/30 focus:ring-[#007aff]"
                    }`}
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div>
              <label
                className={`block text-[15px] font-semibold mb-2 ${
                  isDarkMode ? "text-white" : "text-black"
                }`}
              >
                Email
              </label>
              <div className="relative">
                <Mail
                  className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${
                    isDarkMode ? "text-white/40" : "text-black/40"
                  }`}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className={`w-full pl-12 pr-4 py-3.5 rounded-[12px] text-[17px] focus:outline-none focus:ring-2 ${
                    isDarkMode
                      ? "bg-[#2c2c2e] text-white placeholder:text-white/30 focus:ring-[#0a84ff]"
                      : "bg-[#f5f5f7] text-black placeholder:text-black/30 focus:ring-[#007aff]"
                  }`}
                  required
                />
              </div>
            </div>

            {!isForgotPassword && (
              <div>
                <label
                  className={`block text-[15px] font-semibold mb-2 ${
                    isDarkMode ? "text-white" : "text-black"
                  }`}
                >
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${
                      isDarkMode ? "text-white/40" : "text-black/40"
                    }`}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
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
                {isLogin && (
                  <div className="text-right mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setError("");
                        setResetSent(false);
                      }}
                      className="text-[#007aff] text-[14px] font-semibold hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-[12px] p-4">
                <p className="text-red-500 text-[15px] font-medium">{error}</p>
              </div>
            )}
            {resetSent && isForgotPassword && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-[12px] p-4 text-center">
                <p className="text-green-500 text-[15px] font-medium mb-1">
                  Reset link sent!
                </p>
                <p
                  className={`text-[13px] ${isDarkMode ? "text-white/70" : "text-black/70"}`}
                >
                  Please check your email for the reset instructions.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || (resetSent && isForgotPassword)}
              className={`w-full py-[15px] px-6 rounded-[14px] transition-all duration-150 font-semibold text-[17px] active:scale-[0.97] ${
                isLoading || (resetSent && isForgotPassword)
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              } ${
                isDarkMode
                  ? "bg-white hover:bg-white/90 text-black"
                  : "bg-black hover:bg-black/90 text-white"
              }`}
            >
              {isLoading
                ? "Please wait..."
                : isForgotPassword
                  ? "Send Reset Link"
                  : isLogin
                    ? "Login"
                    : "Create Account"}
            </button>
          </form>

          {isForgotPassword && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setError("");
                  setResetSent(false);
                }}
                className={`text-[15px] font-medium transition-colors ${isDarkMode ? "text-white/70 hover:text-white" : "text-black/70 hover:text-black"}`}
              >
                Back to Login
              </button>
            </div>
          )}

          {/* Demo Credentials
          <div className={`mt-6 p-4 rounded-[12px] text-center ${
            isDarkMode ? 'bg-[#2c2c2e]' : 'bg-[#f5f5f7]'
          }`}>
            <p className={`text-[13px] font-semibold mb-2 ${
              isDarkMode ? 'text-white/70' : 'text-black/70'
            }`}>
              Welcome to Kakeibo!
            </p>
            <p className={`text-[13px] ${
              isDarkMode ? 'text-white/50' : 'text-black/50'
            }`}>
              Track today. Plan tomorrow.
            </p>
          </div> */}
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
          <p
            className={`text-[11px] ${
              isDarkMode ? "text-white/40" : "text-black/55"
            }`}
          >
            Designed and engineered by Lavish.
          </p>
        </div>
      </div>
    </div>
  );
}
