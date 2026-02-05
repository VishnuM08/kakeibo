import Card from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";
import { useNavigate } from "react-router-dom";



export default function Login() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card>
        <h1 className="text-3xl font-semibold text-center mb-1">
          Kakeibo 🌿
        </h1>

        <p className="text-gray-500 text-center mb-6">
          Track today. Plan tomorrow.
        </p>

        <div className="space-y-4">
          <Input placeholder="Email address" />
          <Input type="password" placeholder="Password" />
          <Button onClick={() => navigate("/dashboard")}>
            Continue
          </Button>
        </div>
      </Card>
    </div>
  );
}
