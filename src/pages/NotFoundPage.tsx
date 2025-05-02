
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";

const NotFoundPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-md shadow-sm text-center max-w-md w-full">
        <h1 className="text-6xl font-bold text-primary mb-6">404</h1>
        <p className="text-xl text-gray-600 mb-6">
          Sorry, the page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
          <Button onClick={() => navigate("/")}>
            <Home className="mr-2 h-4 w-4" /> Return to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
