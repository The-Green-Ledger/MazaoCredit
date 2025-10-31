import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type ProtectedRouteProps = {
  children: ReactNode;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setIsAuthed(!!session?.user);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  if (loading) return null;
  if (!isAuthed) return <Navigate to="/auth" replace state={{ from: location }} />;
  return <>{children}</>;
};

export default ProtectedRoute;


