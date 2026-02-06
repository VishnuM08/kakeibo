import { useState } from "react";
import { Lock, Mail, User, Eye, EyeOff } from "lucide-react";
import { login, register } from "../services/api";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isLogin) {
        // TODO: BACKEND INTEGRATION - Call login API
        const response = await login({ email, password });

        localStorage.setItem("jwt_token", response.token);

        // user info will come later from /me or /profile
        onAuthSuccess(response.token, null);
      } else {
        // TODO: BACKEND INTEGRATION - Call register API
        if (!name.trim()) {
          setError("Please enter your name");
          setIsLoading(false);
          return;
        }

        const response = await register({ email, password, name });

        // Store token and user data
        localStorage.setItem("jwt_token", response.token);
        localStorage.setItem("user_data", JSON.stringify(response.user));

        onAuthSuccess(response.token, response.user);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center px-5 ${
        isDarkMode ? "bg-[#121212]" : "bg-[#f5f5f7]"
      }`}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#007aff] to-[#0051d5] flex items-center justify-center mx-auto mb-6 shadow-lg">
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
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
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-[12px] p-4">
                <p className="text-red-500 text-[15px] font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-[15px] px-6 rounded-[14px] transition-all duration-150 font-semibold text-[17px] active:scale-[0.97] ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              } ${
                isDarkMode
                  ? "bg-white hover:bg-white/90 text-black"
                  : "bg-black hover:bg-black/90 text-white"
              }`}
            >
              {isLoading
                ? "Please wait..."
                : isLogin
                  ? "Login"
                  : "Create Account"}
            </button>
          </form>

          {/* Demo Credentials */}
          <div
            className={`mt-6 p-4 rounded-[12px] ${
              isDarkMode ? "bg-[#2c2c2e]" : "bg-[#f5f5f7]"
            }`}
          >
            <p
              className={`text-[13px] font-semibold mb-2 ${
                isDarkMode ? "text-white/70" : "text-black/70"
              }`}
            >
              Hey There!
            </p>
            <p
              className={`text-[13px] ${
                isDarkMode ? "text-white/50" : "text-black/50"
              }`}
            >
              Don't forget password because that functionality is not ready yet
            </p>
          </div>
        </div>

        {/* Footer */}
        <p
          className={`text-center text-[13px] mt-6 ${
            isDarkMode ? "text-white/30" : "text-black/30"
          }`}
        >
          By continuing, you agree to our Terms & Privacy Policy
        </p>
      </div>
    </div>
  );
}
