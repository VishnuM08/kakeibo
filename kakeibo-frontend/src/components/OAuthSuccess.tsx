import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { setAuthToken, getAuthToken } from "../services/api";

function OAuthSuccess() {
  const navigate = useNavigate();
  const [showFallback, setShowFallback] = useState(false);
  const [customSchemeUrl, setCustomSchemeUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleLogin = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      console.log("TOKEN FROM URL:", token);

      if (token) {
        // Detect if running on remote web domain (usually Capacitor Custom Tab or pure web browser)
        const hostname = window.location.hostname;
        const isWebApp = hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.includes('192.168');
        
        if (isWebApp && /android|iphone|ipad|ipod/i.test(navigator.userAgent)) {
           const schemeUrl = `com.aignite.kakeibo://oauth-success?token=${token}`;
           setCustomSchemeUrl(schemeUrl);
           
           // Attempt to force jump back to native app via Custom Scheme intent first
           window.location.href = schemeUrl;
           
           // If they are still on this page after a delay, it means the auto-intent was blocked 
           // by the browser (requires user gesture) or they don't have the app installed.
           // We show them a manual button to try again, rather than trapping them silently.
           setTimeout(() => {
              setShowFallback(true);
              setIsLoading(false);
           }, 1500);
           return;
        }

        // If local (inside the true Capacitor WebView, not the overlay)
        try {
           await setAuthToken(token);
           window.location.replace("/");
        } catch (error) {
           console.error("Failed to store auth token:", error);
           window.location.replace("/login");
        }
      } else {
        console.warn("No token found in OAuth success URL");
        window.location.replace("/login");
      }
    };

    handleLogin();
  }, []);

  if (showFallback) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm max-w-sm w-full">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#007aff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Almost there!</h2>
          <p className="text-gray-500 mb-6 text-sm">
            Your login was successful, but we couldn't automatically return you to the app.
          </p>
          <a 
            href={customSchemeUrl}
            className="block w-full bg-[#007aff] hover:bg-[#007aff]/90 text-white font-semibold py-3 px-4 rounded-xl transition-colors mb-3"
          >
            Return to App
          </a>
          <button 
            onClick={async () => {
              const params = new URLSearchParams(window.location.search);
              const token = params.get("token");
              if (token) {
                 await setAuthToken(token);
                 window.location.replace("/");
              }
            }}
            className="text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            Continue in browser instead
          </button>
        </div>
      </div>
    );
  }

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
