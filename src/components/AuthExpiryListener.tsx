import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AUTH_EXPIRED_EVENT } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const PUBLIC_PATHS = ["/login", "/signup"];

export function AuthExpiryListener() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const handleSessionExpired = () => {
      if (PUBLIC_PATHS.includes(location.pathname)) return;

      toast({
        title: "Session expired",
        description: "Please log in again to continue.",
        variant: "destructive",
      });
      navigate("/login", { replace: true });
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleSessionExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleSessionExpired);
  }, [navigate, location.pathname, toast]);

  return null;
}
