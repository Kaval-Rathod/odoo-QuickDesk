import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, User, Shield, LogOut } from 'lucide-react';

export default function SessionDebug() {
  const { user, session, profile, loading, signOut } = useAuth();

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Session Debug
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status:</span>
            <Badge variant={loading ? "secondary" : user ? "default" : "destructive"}>
              {loading ? "Loading..." : user ? "Authenticated" : "Not Authenticated"}
            </Badge>
          </div>
          
          {user && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">User:</span>
                <span className="text-sm text-muted-foreground">{user.email}</span>
              </div>
              
              {profile && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Name:</span>
                  <span className="text-sm text-muted-foreground">{profile.full_name}</span>
                </div>
              )}
              
              {profile && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Role:</span>
                  <Badge variant="outline">{profile.role}</Badge>
                </div>
              )}
              
              {session && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Session Expires:</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(session.expires_at! * 1000).toLocaleString()}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleRefresh} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          {user && (
            <Button onClick={handleSignOut} size="sm" variant="destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 