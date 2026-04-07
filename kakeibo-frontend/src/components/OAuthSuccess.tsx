import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setAuthToken, getAuthToken } from "../services/api";

function OAuthSuccess() {
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
           
           // Fire the Custom Scheme intent first to attempt waking up the Native App
           window.location.href = schemeUrl;
           
           // Concurrently schedule a standard web login redirect.
           // If the Native App catches the intent above, it will close this Web Tab before this fires.
           // If the Native App isn't installed (real web user), this executes after 1 second, logging them in.
           setTimeout(async () => {
              try {
                 await setAuthToken(token);
                 window.location.replace("/");
              } catch (e) {
                 window.location.replace("/login");
              }
           }, 1000);
           return;
        }

        // Standard execution for local environment (or Desktop Web)
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
