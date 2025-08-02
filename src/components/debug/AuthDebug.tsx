import { useAuth } from '@/hooks/useAuth';

export default function AuthDebug() {
  const { user, session, profile, loading } = useAuth();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <div className="font-bold mb-2">Auth Debug</div>
      <div>Loading: {loading ? 'Yes' : 'No'}</div>
      <div>User: {user ? 'Yes' : 'No'}</div>
      <div>Session: {session ? 'Yes' : 'No'}</div>
      <div>Profile: {profile ? profile.role : 'No'}</div>
      <div>Email: {user?.email || 'None'}</div>
    </div>
  );
} 