import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setAuthToken, getAuthToken } from "../services/api";

function OAuthSuccess({ onAuthSuccess }: { onAuthSuccess?: (token: string, userData: any) => void }) {
  const navigate = useNavigate();

  useEffect(() => {
    const handleLogin = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      console.log("TOKEN FROM URL:", token);

      if (token) {
        // Detect if running on remote web domain (Custom Tab or pure Web)
        const hostname = window.location.hostname;
        const isWebApp = hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.includes('192.168');
        
        if (isWebApp && /android|iphone|ipad|ipod/i.test(navigator.userAgent)) {
           const schemeUrl = `com.aignite.kakeibo://oauth-success?token=${token}`;
           
           // Fire the Custom Scheme intent via a hidden iframe.
           // This prevents the browser from navigating to an ERR_UNKNOWN_URL_SCHEME page
           // if the native app is not installed, keeping our javascript context alive!
           const iframe = document.createElement("iframe");
           iframe.style.display = "none";
           iframe.src = schemeUrl;
           document.body.appendChild(iframe);
           
           setTimeout(async () => {
              try {
                 await setAuthToken(token);
                 if (onAuthSuccess) {
                    onAuthSuccess(token, { name: "User" });
                    navigate("/", { replace: true });
                 } else {
                    setTimeout(() => window.location.replace("/"), 500);
                 }
              } catch (e) {
                 setTimeout(() => window.location.replace("/login"), 500);
              }
           }, 1000);
           return;
        }

        // Standard execution for local environment (or Desktop Web)
        try {
           await setAuthToken(token);
           if (onAuthSuccess) {
              onAuthSuccess(token, { name: "User" });
              navigate("/", { replace: true });
           } else {
              setTimeout(() => window.location.replace("/"), 500);
         }
        } catch (error) {
           console.error("Failed to store auth token:", error);
           setTimeout(() => window.location.replace("/login"), 500);
        }
      } else {
        console.warn("No token found in OAuth success URL");
        if (onAuthSuccess) {
           navigate("/login", { replace: true });
        } else {
           window.location.replace("/login");
        }
      }
    };

    handleLogin();
  }, [navigate, onAuthSuccess]);

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-[#007aff] rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium tracking-tight">Completing sign in...</p>
      </div>
    </div>
  );
}

export default OAuthSuccess;
