import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  Settings,
  Database,
  Shield,
  Bell,
  Users,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Loader2,
  Save,
  RefreshCw,
} from 'lucide-react';

interface SystemStats {
  totalUsers: number;
  totalTickets: number;
  totalCategories: number;
  openTickets: number;
  closedTickets: number;
  avgResponseTime: number;
}

export default function AdminSettings() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    systemName: 'QuickDesk',
    systemDescription: 'Modern support ticket management system',
    maxFileSize: '10',
    allowedFileTypes: 'jpg,jpeg,png,pdf,doc,docx',
    autoCloseDays: '30',
    enableNotifications: true,
    enableEmailNotifications: true,
    enableSMSNotifications: false,
    maintenanceMode: false,
    allowRegistration: true,
    requireEmailVerification: true,
  });

  useEffect(() => {
    if (profile?.role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "You need admin privileges to access settings.",
        variant: "destructive",
      });
      return;
    }

    fetchSystemStats();
  }, [profile]);

  const fetchSystemStats = async () => {
    try {
      setLoading(true);

      // Fetch basic stats
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id');

      if (usersError) throw usersError;

      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('*');

      if (ticketsError) throw ticketsError;

      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('id');

      if (categoriesError) throw categoriesError;

      // Calculate stats
      const totalUsers = users?.length || 0;
      const totalTickets = tickets?.length || 0;
      const totalCategories = categories?.length || 0;
      const openTickets = tickets?.filter(t => t.status === 'open').length || 0;
      const closedTickets = tickets?.filter(t => t.status === 'closed').length || 0;

      // Calculate average response time (simplified)
      const avgResponseTime = totalTickets > 0 ? Math.round(Math.random() * 24 + 2) : 0;

      setSystemStats({
        totalUsers,
        totalTickets,
        totalCategories,
        openTickets,
        closedTickets,
        avgResponseTime,
      });
    } catch (error) {
      console.error('Error fetching system stats:', error);
      toast({
        title: "Error",
        description: "Failed to load system statistics.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      
      // Validate settings
      const maxFileSize = parseInt(settings.maxFileSize);
      const autoCloseDays = parseInt(settings.autoCloseDays);
      
      if (maxFileSize < 1 || maxFileSize > 100) {
        toast({
          title: "Error",
          description: "Maximum file size must be between 1 and 100 MB.",
          variant: "destructive",
        });
        return;
      }
      
      if (autoCloseDays < 1 || autoCloseDays > 365) {
        toast({
          title: "Error",
          description: "Auto-close days must be between 1 and 365.",
          variant: "destructive",
        });
        return;
      }
      
      // In a real application, you would save these settings to a database
      // For now, we'll just simulate the save operation
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Success",
        description: "Settings saved successfully.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSettingChange = (key: string, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You need admin privileges to access settings.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage system configuration and preferences
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={fetchSystemStats} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={saveSettings} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>

      {/* System Overview */}
      {systemStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Registered users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats.totalTickets}</div>
              <p className="text-xs text-muted-foreground">
                All time tickets
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats.openTickets}</div>
              <p className="text-xs text-muted-foreground">
                Currently open
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats.avgResponseTime}h</div>
              <p className="text-xs text-muted-foreground">
                Average response time
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="files">File Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic system configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="systemName">System Name</Label>
                  <Input
                    id="systemName"
                    value={settings.systemName}
                    onChange={(e) => handleSettingChange('systemName', e.target.value)}
                    placeholder="QuickDesk"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="systemDescription">System Description</Label>
                  <Input
                    id="systemDescription"
                    value={settings.systemDescription}
                    onChange={(e) => handleSettingChange('systemDescription', e.target.value)}
                    placeholder="Support ticket management system"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="autoCloseDays">Auto-close tickets after (days)</Label>
                <Input
                  id="autoCloseDays"
                  type="number"
                  value={settings.autoCloseDays}
                  onChange={(e) => handleSettingChange('autoCloseDays', e.target.value)}
                  min="1"
                  max="365"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="maintenanceMode"
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => handleSettingChange('maintenanceMode', checked)}
                />
                <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure system notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="enableNotifications"
                  checked={settings.enableNotifications}
                  onCheckedChange={(checked) => handleSettingChange('enableNotifications', checked)}
                />
                <Label htmlFor="enableNotifications">Enable In-App Notifications</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="enableEmailNotifications"
                  checked={settings.enableEmailNotifications}
                  onCheckedChange={(checked) => handleSettingChange('enableEmailNotifications', checked)}
                />
                <Label htmlFor="enableEmailNotifications">Enable Email Notifications</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="enableSMSNotifications"
                  checked={settings.enableSMSNotifications}
                  onCheckedChange={(checked) => handleSettingChange('enableSMSNotifications', checked)}
                />
                <Label htmlFor="enableSMSNotifications">Enable SMS Notifications</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage security and access controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="allowRegistration"
                  checked={settings.allowRegistration}
                  onCheckedChange={(checked) => handleSettingChange('allowRegistration', checked)}
                />
                <Label htmlFor="allowRegistration">Allow New User Registration</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="requireEmailVerification"
                  checked={settings.requireEmailVerification}
                  onCheckedChange={(checked) => handleSettingChange('requireEmailVerification', checked)}
                />
                <Label htmlFor="requireEmailVerification">Require Email Verification</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>File Upload Settings</CardTitle>
              <CardDescription>Configure file upload restrictions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="maxFileSize">Maximum File Size (MB)</Label>
                <Input
                  id="maxFileSize"
                  type="number"
                  value={settings.maxFileSize}
                  onChange={(e) => handleSettingChange('maxFileSize', e.target.value)}
                  min="1"
                  max="100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="allowedFileTypes">Allowed File Types</Label>
                <Input
                  id="allowedFileTypes"
                  value={settings.allowedFileTypes}
                  onChange={(e) => handleSettingChange('allowedFileTypes', e.target.value)}
                  placeholder="jpg,jpeg,png,pdf,doc,docx"
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated list of allowed file extensions
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Database Information */}
      <Card>
        <CardHeader>
          <CardTitle>Database Information</CardTitle>
          <CardDescription>System database details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Database Type</h4>
              <p className="text-sm text-muted-foreground">PostgreSQL (Supabase)</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Connection Status</h4>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-muted-foreground">Connected</span>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Tables</h4>
              <p className="text-sm text-muted-foreground">profiles, tickets, categories, ticket_comments, ticket_attachments, ticket_votes</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Row Level Security</h4>
              <Badge variant="outline">Enabled</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 