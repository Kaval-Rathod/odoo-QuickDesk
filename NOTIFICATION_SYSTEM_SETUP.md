# Notification System Setup Guide

This guide will help you set up a complete notification system for your ticket management application.

## 🎯 Features

- **Real-time notifications** using Supabase real-time subscriptions
- **In-app notification bell** with unread count badge
- **Email notifications** (integrated with existing email system)
- **Notification preferences** for users to customize their experience
- **Multiple notification types**: ticket created, updated, commented, assigned, resolved
- **Notification management**: mark as read, delete, mark all as read

## 📋 Database Setup

### 1. Run the Migration

Execute the SQL migration to create the notifications table:

```sql
-- Run the migration file: supabase/migrations/20250101000000_create_notifications_table.sql
```

### 2. Update Profiles Table (Optional)

Add notification settings to the profiles table:

```sql
-- Add notification_settings column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{
  "email_notifications": true,
  "in_app_notifications": true,
  "ticket_created": true,
  "ticket_updated": true,
  "ticket_commented": true,
  "ticket_assigned": true,
  "ticket_resolved": true
}';
```

## 🔧 Components Overview

### 1. NotificationBell Component (`src/components/ui/notification-bell.tsx`)
- Displays notification count badge
- Shows notification popover with list
- Handles mark as read/delete actions
- Real-time updates via Supabase subscriptions

### 2. NotificationService (`src/lib/notification-service.ts`)
- Centralized service for creating notifications
- Handles different notification types
- Manages notification preferences
- Database operations for notifications

### 3. NotificationSettings Component (`src/components/ui/notification-settings.tsx`)
- User interface for managing notification preferences
- Toggle switches for different notification types
- Save/reset functionality

## 🚀 Integration Points

### 1. Sidebar Integration
The notification bell is automatically added to the sidebar header.

### 2. Ticket Operations
Notifications are automatically sent for:
- **Ticket Creation**: When a user creates a new ticket
- **Ticket Updates**: When status/priority changes
- **Comments**: When someone comments on a ticket
- **Assignments**: When tickets are assigned to agents
- **Resolution**: When tickets are resolved

### 3. Real-time Updates
The system uses Supabase real-time subscriptions to:
- Show new notifications instantly
- Update unread count in real-time
- Display toast notifications for new events

## 📱 User Experience

### Notification Bell Features:
- **Badge**: Shows unread count (99+ for large numbers)
- **Popover**: Displays recent notifications with actions
- **Icons**: Different emojis for different notification types
- **Timestamps**: Relative time display (e.g., "2 hours ago")
- **Actions**: Mark as read, delete individual notifications
- **Bulk Actions**: Mark all as read

### Notification Types:
- 🎫 **Ticket Created**: Confirmation when ticket is created
- 📝 **Ticket Updated**: Status/priority changes
- 💬 **Ticket Commented**: New comments on tickets
- 👤 **Ticket Assigned**: Assignment notifications
- ✅ **Ticket Resolved**: Resolution confirmations

## ⚙️ Configuration

### Environment Variables
No additional environment variables required - uses existing Supabase configuration.

### Notification Preferences
Users can customize their notification experience:
- Enable/disable email notifications
- Enable/disable in-app notifications
- Choose specific notification types
- Reset to default settings

## 🔒 Security

### Row Level Security (RLS)
The notifications table has RLS policies:
- Users can only view their own notifications
- Users can update/delete their own notifications
- System can insert notifications for users

### Data Privacy
- Notifications are user-specific
- No cross-user data access
- Automatic cleanup of old notifications (90 days)

## 🧪 Testing

### Manual Testing Checklist:
1. **Create a ticket** → Should show notification to creator
2. **Update ticket status** → Should notify ticket creator
3. **Add comment** → Should notify ticket creator and assigned agent
4. **Assign ticket** → Should notify both creator and assigned agent
5. **Mark notifications as read** → Should update unread count
6. **Delete notifications** → Should remove from list
7. **Real-time updates** → Should show new notifications instantly

### Test Scenarios:
```javascript
// Test notification creation
await NotificationService.createTicketCreatedNotification(
  'ticket-id',
  'user-id',
  'Ticket Title'
);

// Test notification preferences
const settings = await fetchNotificationSettings();
console.log(settings);
```

## 🐛 Troubleshooting

### Common Issues:

1. **Notifications not appearing**
   - Check Supabase real-time is enabled
   - Verify RLS policies are correct
   - Check browser console for errors

2. **Real-time not working**
   - Ensure Supabase project has real-time enabled
   - Check network connectivity
   - Verify subscription channel name

3. **Permission errors**
   - Check user authentication
   - Verify RLS policies
   - Ensure user has proper role

### Debug Commands:
```javascript
// Check notification count
const count = await NotificationService.getUnreadNotificationCount(userId);
console.log('Unread count:', count);

// Check user settings
const { data } = await supabase
  .from('profiles')
  .select('notification_settings')
  .eq('id', userId)
  .single();
console.log('Settings:', data.notification_settings);
```

## 📈 Performance Considerations

### Optimization Tips:
1. **Limit notifications**: Only fetch last 50 notifications
2. **Cleanup old data**: Automatic cleanup after 90 days
3. **Index optimization**: Proper database indexes for queries
4. **Real-time efficiency**: Single subscription per user

### Database Indexes:
- `user_id` for user-specific queries
- `created_at DESC` for chronological ordering
- `read` for unread count queries
- `ticket_id` for ticket-related notifications

## 🔄 Future Enhancements

### Potential Features:
1. **Push notifications** for mobile devices
2. **Notification templates** for custom messages
3. **Bulk notification actions** (delete all, mark all read)
4. **Notification history** with advanced filtering
5. **Email digest** for multiple notifications
6. **Notification analytics** for admin insights

### Integration Possibilities:
1. **Slack/Discord** webhook notifications
2. **SMS notifications** for urgent tickets
3. **Browser push notifications** for desktop
4. **Mobile app notifications** via FCM/APNS

## 📚 API Reference

### NotificationService Methods:
```typescript
// Create notifications
createTicketCreatedNotification(ticketId, creatorId, title)
createTicketUpdatedNotification(ticketId, userId, title, type, oldValue, newValue)
createTicketCommentedNotification(ticketId, creatorId, authorId, title, authorName)
createTicketAssignedNotification(ticketId, creatorId, agentId, title, agentName)
createTicketResolvedNotification(ticketId, creatorId, title, resolvedBy)

// Manage notifications
getUnreadNotificationCount(userId)
markNotificationAsRead(notificationId)
markAllNotificationsAsRead(userId)
deleteNotification(notificationId)
```

## ✅ Setup Complete!

Your notification system is now fully functional. Users will receive real-time notifications for all ticket-related activities, and they can customize their notification preferences through the settings interface.

The system is designed to be:
- **Scalable**: Handles multiple users efficiently
- **Secure**: Proper RLS policies and user isolation
- **User-friendly**: Intuitive interface and clear notifications
- **Maintainable**: Well-structured code and comprehensive documentation 