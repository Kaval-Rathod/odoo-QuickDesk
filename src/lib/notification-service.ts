import { supabase } from '@/integrations/supabase/client';

export interface NotificationData {
  user_id: string;
  title: string;
  message: string;
  type: 'ticket_created' | 'ticket_updated' | 'ticket_commented' | 'ticket_assigned' | 'ticket_resolved';
  ticket_id?: string;
  metadata?: {
    ticket_title?: string;
    comment_author?: string;
    assigned_agent?: string;
    status?: string;
    priority?: string;
  };
}

export class NotificationService {
  static async createNotification(data: NotificationData) {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: data.user_id,
          title: data.title,
          message: data.message,
          type: data.type,
          ticket_id: data.ticket_id,
          metadata: data.metadata,
          read: false,
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error creating notification:', error);
      return false;
    }
  }

  static async createTicketCreatedNotification(ticketId: string, creatorId: string, ticketTitle: string) {
    const notificationData: NotificationData = {
      user_id: creatorId,
      title: 'Ticket Created',
      message: `Your ticket "${ticketTitle}" has been created successfully.`,
      type: 'ticket_created',
      ticket_id: ticketId,
      metadata: {
        ticket_title: ticketTitle,
      },
    };

    return this.createNotification(notificationData);
  }

  static async createTicketUpdatedNotification(
    ticketId: string, 
    userId: string, 
    ticketTitle: string, 
    updateType: 'status' | 'priority' | 'assignment',
    oldValue?: string,
    newValue?: string
  ) {
    let title = 'Ticket Updated';
    let message = `Your ticket "${ticketTitle}" has been updated.`;

    switch (updateType) {
      case 'status':
        title = 'Ticket Status Updated';
        message = `Your ticket "${ticketTitle}" status changed from "${oldValue}" to "${newValue}".`;
        break;
      case 'priority':
        title = 'Ticket Priority Updated';
        message = `Your ticket "${ticketTitle}" priority changed from "${oldValue}" to "${newValue}".`;
        break;
      case 'assignment':
        title = 'Ticket Assignment Updated';
        message = newValue 
          ? `Your ticket "${ticketTitle}" has been assigned to ${newValue}.`
          : `Your ticket "${ticketTitle}" assignment has been removed.`;
        break;
    }

    const notificationData: NotificationData = {
      user_id: userId,
      title,
      message,
      type: 'ticket_updated',
      ticket_id: ticketId,
      metadata: {
        ticket_title: ticketTitle,
        status: updateType === 'status' ? newValue : undefined,
        priority: updateType === 'priority' ? newValue : undefined,
        assigned_agent: updateType === 'assignment' ? newValue : undefined,
      },
    };

    return this.createNotification(notificationData);
  }

  static async createTicketCommentedNotification(
    ticketId: string,
    ticketCreatorId: string,
    commentAuthorId: string,
    ticketTitle: string,
    commentAuthorName: string
  ) {
    // Notify ticket creator (if comment is not from them)
    if (ticketCreatorId !== commentAuthorId) {
      const creatorNotification: NotificationData = {
        user_id: ticketCreatorId,
        title: 'New Comment on Your Ticket',
        message: `${commentAuthorName} commented on your ticket "${ticketTitle}".`,
        type: 'ticket_commented',
        ticket_id: ticketId,
        metadata: {
          ticket_title: ticketTitle,
          comment_author: commentAuthorName,
        },
      };

      await this.createNotification(creatorNotification);
    }

    // Notify assigned agent (if different from comment author and ticket creator)
    const ticket = await this.getTicketDetails(ticketId);
    if (ticket?.assigned_agent_id && 
        ticket.assigned_agent_id !== commentAuthorId && 
        ticket.assigned_agent_id !== ticketCreatorId) {
      
      const agentNotification: NotificationData = {
        user_id: ticket.assigned_agent_id,
        title: 'New Comment on Assigned Ticket',
        message: `${commentAuthorName} commented on ticket "${ticketTitle}" which is assigned to you.`,
        type: 'ticket_commented',
        ticket_id: ticketId,
        metadata: {
          ticket_title: ticketTitle,
          comment_author: commentAuthorName,
        },
      };

      await this.createNotification(agentNotification);
    }
  }

  static async createTicketAssignedNotification(
    ticketId: string,
    ticketCreatorId: string,
    assignedAgentId: string,
    ticketTitle: string,
    assignedAgentName: string
  ) {
    // Notify ticket creator
    const creatorNotification: NotificationData = {
      user_id: ticketCreatorId,
      title: 'Ticket Assigned',
      message: `Your ticket "${ticketTitle}" has been assigned to ${assignedAgentName}.`,
      type: 'ticket_assigned',
      ticket_id: ticketId,
      metadata: {
        ticket_title: ticketTitle,
        assigned_agent: assignedAgentName,
      },
    };

    await this.createNotification(creatorNotification);

    // Notify assigned agent
    const agentNotification: NotificationData = {
      user_id: assignedAgentId,
      title: 'New Ticket Assigned',
      message: `You have been assigned to ticket "${ticketTitle}".`,
      type: 'ticket_assigned',
      ticket_id: ticketId,
      metadata: {
        ticket_title: ticketTitle,
        assigned_agent: assignedAgentName,
      },
    };

    await this.createNotification(agentNotification);
  }

  static async createTicketResolvedNotification(
    ticketId: string,
    ticketCreatorId: string,
    ticketTitle: string,
    resolvedBy: string
  ) {
    const notificationData: NotificationData = {
      user_id: ticketCreatorId,
      title: 'Ticket Resolved',
      message: `Your ticket "${ticketTitle}" has been resolved by ${resolvedBy}.`,
      type: 'ticket_resolved',
      ticket_id: ticketId,
      metadata: {
        ticket_title: ticketTitle,
        assigned_agent: resolvedBy,
      },
    };

    return this.createNotification(notificationData);
  }

  private static async getTicketDetails(ticketId: string) {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('creator_id, assigned_agent_id, title')
        .eq('id', ticketId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching ticket details:', error);
      return null;
    }
  }

  static async getUnreadNotificationCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error fetching unread notification count:', error);
      return 0;
    }
  }

  static async markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  static async markAllNotificationsAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  static async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }
} 