import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Sidebar from './Sidebar';
import { Loader2 } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  requireAuth?: boolean;
  allowedRoles?: Array<'end_user' | 'support_agent' | 'admin'>;
}

export default function Layout({ children, requireAuth = true, allowedRoles }: LayoutProps) {
  const { user, profile, loading } = useAuth();

  // Show loading spinner while auth state is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Only redirect to auth if we're sure there's no user and auth is required
  if (requireAuth && !user && !loading) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (!requireAuth) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:pl-64">
        <div className="px-4 py-8 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}