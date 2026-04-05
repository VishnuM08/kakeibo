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
        try {
          await setAuthToken(token);
          
          const stored = await getAuthToken();
          console.log("TOKEN AFTER SAVE:", stored);

          // Force fresh bootstrap of the app with the new credentials
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

  return <div>Logging you in...</div>;
}

export default OAuthSuccess;
