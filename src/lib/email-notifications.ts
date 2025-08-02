import { supabase } from '@/integrations/supabase/client';

interface EmailNotification {
  to: string;
  subject: string;
  body: string;
}

export async function sendTicketNotification(
  ticketId: string,
  notificationType: 'created' | 'status_changed' | 'assigned' | 'commented'
) {
  try {
    // Fetch ticket details
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select(`
        *,
        profiles:creator_id (full_name, email),
        assigned_profiles:assigned_agent_id (full_name, email),
        categories (name)
      `)
      .eq('id', ticketId)
      .single();

    if (ticketError) throw ticketError;

    const notifications: EmailNotification[] = [];

    switch (notificationType) {
      case 'created':
        // Notify all support agents and admins about new ticket
        const { data: agents } = await supabase
          .from('profiles')
          .select('email, full_name')
          .in('role', ['support_agent', 'admin']);

        agents?.forEach(agent => {
          notifications.push({
            to: agent.email,
            subject: `New Ticket Created: ${ticket.title}`,
            body: `
              Hello ${agent.full_name},
              
              A new support ticket has been created:
              
              Title: ${ticket.title}
              Category: ${ticket.categories?.name || 'General'}
              Priority: ${ticket.priority}
              Created by: ${ticket.profiles?.full_name || 'Unknown'}
              
              Please review and assign this ticket as needed.
              
              Best regards,
              QuickDesk Support System
            `
          });
        });
        break;

      case 'status_changed':
        // Notify ticket creator about status change
        if (ticket.profiles?.email) {
          notifications.push({
            to: ticket.profiles.email,
            subject: `Ticket Status Updated: ${ticket.title}`,
            body: `
              Hello ${ticket.profiles.full_name},
              
              Your ticket status has been updated:
              
              Title: ${ticket.title}
              New Status: ${ticket.status.replace('_', ' ')}
              
              You can view the updated ticket at: ${window.location.origin}/tickets/${ticketId}
              
              Best regards,
              QuickDesk Support Team
            `
          });
        }
        break;

      case 'assigned':
        // Notify assigned agent
        if (ticket.assigned_profiles?.email) {
          notifications.push({
            to: ticket.assigned_profiles.email,
            subject: `Ticket Assigned: ${ticket.title}`,
            body: `
              Hello ${ticket.assigned_profiles.full_name},
              
              A ticket has been assigned to you:
              
              Title: ${ticket.title}
              Category: ${ticket.categories?.name || 'General'}
              Priority: ${ticket.priority}
              Status: ${ticket.status.replace('_', ' ')}
              
              Please review and update the ticket status as needed.
              
              Best regards,
              QuickDesk Support System
            `
          });
        }
        break;

      case 'commented':
        // Notify ticket creator and assigned agent about new comment
        const recipients = new Set<string>();
        
        if (ticket.profiles?.email) {
          recipients.add(ticket.profiles.email);
        }
        if (ticket.assigned_profiles?.email) {
          recipients.add(ticket.assigned_profiles.email);
        }

        recipients.forEach(email => {
          notifications.push({
            to: email,
            subject: `New Comment on Ticket: ${ticket.title}`,
            body: `
              Hello,
              
              A new comment has been added to your ticket:
              
              Title: ${ticket.title}
              Status: ${ticket.status.replace('_', ' ')}
              
              You can view the comment at: ${window.location.origin}/tickets/${ticketId}
              
              Best regards,
              QuickDesk Support System
            `
          });
        });
        break;
    }

    // In a real application, you would send these emails using a service like SendGrid, AWS SES, etc.
    // For now, we'll just log them to the console
    console.log('Email notifications to send:', notifications);
    
    // You can integrate with your preferred email service here
    // Example with a hypothetical email service:
    // for (const notification of notifications) {
    //   await emailService.send(notification);
    // }

    return { success: true, notifications };
  } catch (error) {
    console.error('Error sending email notifications:', error);
    return { success: false, error };
  }
}

export async function sendWelcomeEmail(userEmail: string, userName: string) {
  const notification: EmailNotification = {
    to: userEmail,
    subject: 'Welcome to QuickDesk Support System',
    body: `
      Hello ${userName},
      
      Welcome to QuickDesk! Your account has been created successfully.
      
      You can now:
      - Create support tickets
      - Track ticket status
      - Receive updates via email
      
      If you have any questions, please don't hesitate to contact our support team.
      
      Best regards,
      QuickDesk Support Team
    `
  };

  console.log('Welcome email to send:', notification);
  // Integrate with your email service here
} 