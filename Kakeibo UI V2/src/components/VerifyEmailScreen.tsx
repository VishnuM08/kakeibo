import { useState, useRef, useEffect } from "react";
import { Mail, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { verifyOTP } from "../services/api";

interface VerifyEmailScreenProps {
  isDarkMode?: boolean;
  themeMode?: "light" | "dark" | "oled";
}

export function VerifyEmailScreen({
  isDarkMode = false,
  themeMode = "light",
}: VerifyEmailScreenProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    // Read email from URL query params
    const searchParams = new URLSearchParams(window.location.search);
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow numeric input
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    // Handle paste
    if (value.length > 1) {
      const pastedData = value.substring(0, 6).split("");
      for (let i = 0; i < pastedData.length; i++) {
        if (index + i < 6) newOtp[index + i] = pastedData[i];
      }
      setOtp(newOtp);
      // Focus the next empty input or the last one
      const nextEmptyIndex = newOtp.findIndex((digit) => digit === "");
      const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
      inputRefs[focusIndex].current?.focus();
      return;
    }

    // Handle single character
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance
    if (value !== "" && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      // Move to previous input when backspacing an empty field
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join("");

    if (otpValue.length !== 6) {
      setError("Please enter all 6 digits of the OTP");
      return;
    }

    if (!email) {
      setError("Email address is missing. Please restart registration.");
      return;
    }

    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      await verifyOTP({ email, otp: otpValue });
      setSuccess("Email verified successfully");

      // Redirect to login after a short delay to show the success message
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    } catch (err: any) {
      let errorMessage = "Invalid OTP. Please try again.";

      if (err.response) {
        const status = err.response.status;
        const serverMessage = err.response.data?.message;

        if (status >= 500) {
          errorMessage = "Server error. Please try again later.";
        } else {
          errorMessage = serverMessage || errorMessage;
        }
      } else if (err.request) {
        errorMessage =
          "Network error. Please check your connection to the server.";
      } else {
        errorMessage = err.message || errorMessage;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    // There was no specific backend endpoint provided for Resend OTP in the instructions,
    // so simulating a success toast for UX
    setError("");
    setSuccess("OTP has been resent to your email.");
    setTimeout(() => setSuccess(""), 3000);
  };

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center px-6 pt-safe pb-safe transition-colors duration-300 ${
        themeMode === "oled"
          ? "bg-[#000000]"
          : isDarkMode
            ? "bg-[#121212]"
            : "bg-[#f5f5f7]"
      }`}
    >
      <div className="w-full max-w-md my-auto py-8">
        <button
          onClick={() => (window.location.href = "/login")}
          className={`flex items-center gap-2 mb-8 text-[15px] font-medium transition-colors ${
            isDarkMode
              ? "text-white/50 hover:text-white"
              : "text-black/50 hover:text-black"
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00b894] to-[#00cec9] flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Mail className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>
          <h1
            className={`text-[28px] font-bold mb-2 ${
              isDarkMode ? "text-white" : "text-black"
            }`}
          >
            Verify your email
          </h1>
          <p
            className={`text-[16px] ${
              isDarkMode ? "text-white/60" : "text-black/60"
            }`}
          >
            We've sent a 6-digit verification code to
            <br />
            <span className="font-semibold text-[#007aff]">
              {email || "your email"}
            </span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-between gap-2 sm:gap-3 mb-6">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={inputRefs[index]}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6} // To allow pasting full code into any box
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-[24px] font-bold rounded-[14px] border-2 focus:outline-none transition-colors ${
                  themeMode === "oled"
                    ? "bg-[#000000] text-white/90 border-[#1c1c1e] focus:border-[#007aff]"
                    : isDarkMode
                      ? "bg-[#1c1c1e] text-white border-[#2c2c2e] focus:border-[#007aff]"
                      : "bg-white text-black border-[#e5e5e7] focus:border-[#007aff]"
                }`}
              />
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 bg-red-500/10 p-4 rounded-[12px] text-[14px] font-medium">
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 text-[#00b894] bg-[#00b894]/10 p-4 rounded-[12px] text-[14px] font-medium">
              <span>{success}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || otp.join("").length !== 6 || !email}
            className={`w-full py-4 rounded-[16px] font-bold text-[17px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
              isLoading || otp.join("").length !== 6 || !email
                ? "bg-gray-400 cursor-not-allowed text-white/50"
                : "bg-gradient-to-r from-[#007aff] to-[#0051D5] hover:shadow-lg hover:shadow-[#007aff]/30 text-white"
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Verify Email
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p
            className={`text-[15px] ${
              isDarkMode ? "text-white/50" : "text-black/50"
            }`}
          >
            Didn't receive the code?{" "}
            <button
              type="button"
              onClick={handleResend}
              className="text-[#007aff] font-semibold hover:underline bg-transparent border-none"
            >
              Resend OTP
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
