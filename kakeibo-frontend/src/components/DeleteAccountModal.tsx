import { X, AlertTriangle, Mail, ShieldAlert, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  requestAccountDeletion,
  confirmAccountDeletion,
} from "../services/api";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  isDarkMode?: boolean;
  themeMode?: "light" | "dark" | "oled";
  onSuccess: () => void;
}

type Step = "warning" | "request_otp" | "verify_otp" | "success";

function maskEmail(email: string) {
  if (!email) return "";
  const [local, domain] = email.split("@");
  if (!domain) return email;
  if (local.length <= 1) return `*@${domain}`;
  return `${local[0]}${"*".repeat(Math.max(1, local.length - 1))}@${domain}`;
}

export function DeleteAccountModal({
  isOpen,
  onClose,
  userEmail,
  isDarkMode,
  themeMode,
  onSuccess,
}: DeleteAccountModalProps) {
  console.log("DeleteAccountModal renders. isOpen =", isOpen);
  const [step, setStep] = useState<Step>("warning");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setStep("warning");
      setOtp("");
      setError("");
      setIsLoading(false);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestOtp = async () => {
    setIsLoading(true);
    setError("");
    try {
      await requestAccountDeletion(userEmail);
      setStep("verify_otp");
    } catch (err: any) {
      if (err?.response?.status === 429) {
        setError("Please wait 2 minutes before requesting another OTP.");
      } else {
        setError(
          err?.response?.data?.message ||
            "Failed to send OTP. Please try again.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Please enter a 6-digit OTP.");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      await confirmAccountDeletion(userEmail, otp);
      setStep("success");
    } catch (err: any) {
      if (err?.response?.status === 400 || err?.response?.status === 401) {
        setError(
          "Invalid OTP or maximum attempts (5) reached. Please request a new one.",
        );
      } else {
        setError(
          err?.response?.data?.message || "Invalid OTP. Please try again.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && step !== "success" && !isLoading) {
      onClose();
    }
  };

  const bgStyle =
    themeMode === "oled"
      ? "bg-black"
      : isDarkMode
        ? "bg-[#1c1c1e]"
        : "bg-white";
  const textStyle =
    isDarkMode || themeMode === "oled" ? "text-white" : "text-black";
  const subTextStyle =
    isDarkMode || themeMode === "oled" ? "text-white/60" : "text-black/60";
  const inputBgStyle =
    themeMode === "oled"
      ? "bg-[#121212]"
      : isDarkMode
        ? "bg-[#2c2c2e]"
        : "bg-[#f5f5f7]";

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 sm:p-6"
      style={{
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        zIndex: 99999,
      }}
      onClick={handleOverlayClick}
    >
      <div
        className={`rounded-[28px] w-full max-w-[440px] p-8 animate-modal-enter shadow-2xl relative overflow-hidden ${bgStyle}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Show close button except on success */}
        {step !== "success" && (
          <button
            onClick={onClose}
            disabled={isLoading}
            className={`absolute top-6 right-6 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isDarkMode || themeMode === "oled"
                ? "bg-white/10 hover:bg-white/20"
                : "bg-black/5 hover:bg-black/10"
            } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <X className={`w-4 h-4 ${textStyle}`} strokeWidth={2.5} />
          </button>
        )}

        {/* Step 1: Warning */}
        {step === "warning" && (
          <div className="flex flex-col mt-2">
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-6 shadow-sm">
              <AlertTriangle
                className="w-7 h-7 text-red-500"
                strokeWidth={2.5}
              />
            </div>
            <h2
              className={`text-[24px] font-bold mb-3 ${textStyle} tracking-tight`}
            >
              Delete Account
            </h2>
            <p className={`text-[15px] mb-6 ${subTextStyle} leading-relaxed`}>
              This action cannot be undone. All your data will be permanently
              removed.
            </p>

            <div
              className={`mb-8 border rounded-2xl overflow-hidden ${isDarkMode || themeMode === "oled" ? "bg-red-500/10 border-red-500/20" : "bg-red-50 border-red-100"}`}
            >
              <div
                className={`px-4 py-3 border-b ${isDarkMode || themeMode === "oled" ? "border-red-500/20 bg-red-500/20" : "border-red-100 bg-red-100/50"}`}
              >
                <p className="font-semibold text-red-500 text-[13px] uppercase tracking-wider">
                  Data to be erased
                </p>
              </div>
              <ul className="p-4 space-y-3">
                {[
                  "All recorded expenses and incomes",
                  "Configured monthly budgets",
                  "Savings goals and history",
                ].map((item, i) => (
                  <li
                    key={i}
                    className={`flex items-start gap-3 text-[14px] ${isDarkMode || themeMode === "oled" ? "text-red-200" : "text-red-900/80"}`}
                  >
                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                    <span className="leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="w-full flex flex-col gap-3 mt-auto">
              <button
                onClick={() => setStep("request_otp")}
                className="w-full py-4 rounded-[14px] font-semibold bg-[#ff3b30] hover:bg-[#ff453a] text-white transition-all text-[16px] shadow-sm active:scale-[0.98]"
              >
                Yes, delete my account
              </button>
              <button
                onClick={onClose}
                className={`w-full py-4 rounded-[14px] font-semibold transition-all text-[16px] active:scale-[0.98] ${
                  isDarkMode || themeMode === "oled"
                    ? "bg-[#2c2c2e] hover:bg-[#3c3c3e] text-white"
                    : "bg-[#f5f5f7] hover:bg-[#e5e5e7] text-black"
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Request OTP */}
        {step === "request_otp" && (
          <div className="flex flex-col mt-2">
            <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center mb-6 shadow-sm">
              <Mail className="w-7 h-7 text-blue-500" strokeWidth={2.5} />
            </div>
            <h2
              className={`text-[24px] font-bold mb-3 ${textStyle} tracking-tight`}
            >
              Request OTP
            </h2>
            <p className={`text-[15px] mb-8 ${subTextStyle} leading-relaxed`}>
              We'll send a one-time password to your registered email to verify
              your identity.
            </p>

            <div className="w-full mb-8 text-left">
              <label
                className={`block text-[13px] font-bold mb-2 ml-1 ${isDarkMode || themeMode === "oled" ? "text-white/50" : "text-black/50"} uppercase tracking-wider`}
              >
                Email Address
              </label>
              <div
                className={`w-full px-4 py-4 rounded-[16px] flex items-center gap-3 border ${
                  isDarkMode || themeMode === "oled"
                    ? "bg-[#2c2c2e]/50 border-white/10"
                    : "bg-[#f5f5f7] border-black/5"
                }`}
              >
                <Mail
                  className={`w-5 h-5 ${isDarkMode ? "text-white/40" : "text-black/40"}`}
                />
                <input
                  type="text"
                  value={maskEmail(userEmail)}
                  disabled
                  className={`w-full bg-transparent outline-none font-medium text-[16px] ${isDarkMode ? "text-white/80" : "text-black/80"}`}
                />
              </div>
            </div>

            {error && (
              <div className="w-full p-4 mb-6 rounded-[16px] bg-red-500/10 border border-red-500/20 text-red-500 text-[14px] font-medium flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            <button
              onClick={handleRequestOtp}
              disabled={isLoading}
              className="w-full py-4 rounded-[14px] font-semibold bg-[#007aff] hover:bg-[#0a84ff] text-white transition-all flex items-center justify-center disabled:opacity-70 text-[16px] shadow-sm active:scale-[0.98] mt-auto"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Send Verification Code"
              )}
            </button>
          </div>
        )}

        {/* Step 3: Verify OTP */}
        {step === "verify_otp" && (
          <div className="flex flex-col mt-2">
            <div className="w-14 h-14 rounded-full bg-yellow-500/10 flex items-center justify-center mb-6 shadow-sm">
              <ShieldAlert
                className="w-7 h-7 text-yellow-500"
                strokeWidth={2.5}
              />
            </div>
            <h2
              className={`text-[24px] font-bold mb-3 ${textStyle} tracking-tight`}
            >
              Verify Deletion
            </h2>
            <p className={`text-[15px] mb-2 ${subTextStyle} leading-relaxed`}>
              Please enter the 6-digit code sent to{" "}
              <span className="font-medium text-[15px]">
                {maskEmail(userEmail)}
              </span>
              .
            </p>
            <p
              className={`text-[13px] mb-8 font-semibold flex items-center gap-2 ${isDarkMode ? "text-yellow-500/80" : "text-yellow-600/90"}`}
            >
              <AlertTriangle className="w-4 h-4" />
              Expires in 10 minutes. Max 5 attempts.
            </p>

            <form
              onSubmit={handleVerifyOtp}
              className="w-full flex flex-col flex-1"
            >
              <div className="w-full mb-8">
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  placeholder="------"
                  className={`w-full text-center tracking-[0.5em] text-[32px] font-bold py-5 rounded-[16px] outline-none border transition-all ${
                    isDarkMode || themeMode === "oled"
                      ? "bg-[#2c2c2e]/50 border-white/10 focus:border-[#ff3b30]/50 focus:bg-[#2c2c2e]"
                      : "bg-[#f5f5f7] border-black/5 focus:border-[#ff3b30]/50 focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,59,48,0.1)]"
                  } ${textStyle}`}
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              {error && (
                <div className="w-full p-4 mb-6 rounded-[16px] bg-red-500/10 border border-red-500/20 text-red-500 text-[14px] font-medium flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span className="leading-snug">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full mt-auto py-4 rounded-[14px] font-semibold bg-[#ff3b30] hover:bg-[#ff453a] text-white transition-all flex items-center justify-center disabled:opacity-50 text-[16px] shadow-sm active:scale-[0.98]"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Confirm Deletion"
                )}
              </button>
            </form>
          </div>
        )}

        {/* Step 4: Success */}
        {step === "success" && (
          <div className="flex flex-col items-center text-center mt-2 py-4">
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-6 shadow-sm">
              <CheckCircle
                className="w-10 h-10 text-[#34c759]"
                strokeWidth={2.5}
              />
            </div>
            <h2
              className={`text-[24px] font-bold mb-3 ${textStyle} tracking-tight`}
            >
              Account Deleted
            </h2>
            <p className={`text-[15px] mb-10 ${subTextStyle} leading-relaxed`}>
              Your account has been successfully deleted. We're sorry to see you
              go.
            </p>

            <button
              onClick={() => {
                onClose();
                onSuccess();
              }}
              className={`w-full py-4 rounded-[14px] font-semibold text-[16px] transition-all active:scale-[0.98] shadow-sm ${
                isDarkMode || themeMode === "oled"
                  ? "bg-white text-black hover:bg-gray-100"
                  : "bg-black text-white hover:bg-gray-900"
              }`}
            >
              Return to login screen
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
