import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Bell, BellOff, Settings } from 'lucide-react';

interface NotificationSettings {
  email_notifications: boolean;
  in_app_notifications: boolean;
  ticket_created: boolean;
  ticket_updated: boolean;
  ticket_commented: boolean;
  ticket_assigned: boolean;
  ticket_resolved: boolean;
}

export default function NotificationSettings() {
  const { profile } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>({
    email_notifications: true,
    in_app_notifications: true,
    ticket_created: true,
    ticket_updated: true,
    ticket_commented: true,
    ticket_assigned: true,
    ticket_resolved: true,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchNotificationSettings();
    }
  }, [profile]);

  const fetchNotificationSettings = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('notification_settings')
        .eq('id', profile.id)
        .single();

      if (error) throw error;

      if (data?.notification_settings) {
        setSettings({
          ...settings,
          ...data.notification_settings,
        });
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    }
  };

  const updateSetting = async (key: keyof NotificationSettings, value: boolean) => {
    if (!profile) return;

    setSaving(true);
    try {
      const updatedSettings = { ...settings, [key]: value };
      
      const { error } = await supabase
        .from('profiles')
        .update({
          notification_settings: updatedSettings,
        })
        .eq('id', profile.id);

      if (error) throw error;

      setSettings(updatedSettings);
      
      toast({
        title: "Settings Updated",
        description: "Your notification preferences have been saved.",
      });
    } catch (error) {
      console.error('Error updating notification settings:', error);
      toast({
        title: "Error",
        description: "Failed to update notification settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      const defaultSettings: NotificationSettings = {
        email_notifications: true,
        in_app_notifications: true,
        ticket_created: true,
        ticket_updated: true,
        ticket_commented: true,
        ticket_assigned: true,
        ticket_resolved: true,
      };

      const { error } = await supabase
        .from('profiles')
        .update({
          notification_settings: defaultSettings,
        })
        .eq('id', profile.id);

      if (error) throw error;

      setSettings(defaultSettings);
      
      toast({
        title: "Settings Reset",
        description: "Your notification preferences have been reset to defaults.",
      });
    } catch (error) {
      console.error('Error resetting notification settings:', error);
      toast({
        title: "Error",
        description: "Failed to reset notification settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Settings className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Notification Settings</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>General Notifications</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={settings.email_notifications}
              onCheckedChange={(checked) => updateSetting('email_notifications', checked)}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="in-app-notifications">In-App Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications within the application
              </p>
            </div>
            <Switch
              id="in-app-notifications"
              checked={settings.in_app_notifications}
              onCheckedChange={(checked) => updateSetting('in_app_notifications', checked)}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BellOff className="h-5 w-5" />
            <span>Ticket Notifications</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="ticket-created">Ticket Created</Label>
              <p className="text-sm text-muted-foreground">
                When a new ticket is created
              </p>
            </div>
            <Switch
              id="ticket-created"
              checked={settings.ticket_created}
              onCheckedChange={(checked) => updateSetting('ticket_created', checked)}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="ticket-updated">Ticket Updated</Label>
              <p className="text-sm text-muted-foreground">
                When ticket status or priority changes
              </p>
            </div>
            <Switch
              id="ticket-updated"
              checked={settings.ticket_updated}
              onCheckedChange={(checked) => updateSetting('ticket_updated', checked)}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="ticket-commented">New Comments</Label>
              <p className="text-sm text-muted-foreground">
                When someone comments on your ticket
              </p>
            </div>
            <Switch
              id="ticket-commented"
              checked={settings.ticket_commented}
              onCheckedChange={(checked) => updateSetting('ticket_commented', checked)}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="ticket-assigned">Ticket Assigned</Label>
              <p className="text-sm text-muted-foreground">
                When a ticket is assigned to you
              </p>
            </div>
            <Switch
              id="ticket-assigned"
              checked={settings.ticket_assigned}
              onCheckedChange={(checked) => updateSetting('ticket_assigned', checked)}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="ticket-resolved">Ticket Resolved</Label>
              <p className="text-sm text-muted-foreground">
                When your ticket is resolved
              </p>
            </div>
            <Switch
              id="ticket-resolved"
              checked={settings.ticket_resolved}
              onCheckedChange={(checked) => updateSetting('ticket_resolved', checked)}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={resetToDefaults}
          disabled={loading}
        >
          {loading ? 'Resetting...' : 'Reset to Defaults'}
        </Button>
      </div>
    </div>
  );
} 