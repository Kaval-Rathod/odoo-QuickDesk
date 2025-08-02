import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  Paperclip, 
  Clock,
  User,
  Calendar
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: {
    name: string;
    color: string;
  };
  creator: {
    full_name: string;
    email: string;
  };
  assigned_agent?: {
    full_name: string;
  };
  created_at: string;
  updated_at: string;
  comment_count?: number;
  upvotes?: number;
  downvotes?: number;
  has_attachments?: boolean;
}

interface TicketCardProps {
  ticket: Ticket;
  showActions?: boolean;
}

const statusConfig = {
  open: { color: 'bg-blue-500', label: 'Open' },
  in_progress: { color: 'bg-yellow-500', label: 'In Progress' },
  resolved: { color: 'bg-green-500', label: 'Resolved' },
  closed: { color: 'bg-gray-500', label: 'Closed' },
};

const priorityConfig = {
  low: { color: 'bg-green-100 text-green-800', label: 'Low' },
  medium: { color: 'bg-blue-100 text-blue-800', label: 'Medium' },
  high: { color: 'bg-orange-100 text-orange-800', label: 'High' },
  urgent: { color: 'bg-red-100 text-red-800', label: 'Urgent' },
};

export default function TicketCard({ ticket, showActions = true }: TicketCardProps) {
  const status = statusConfig[ticket.status];
  const priority = priorityConfig[ticket.priority];

  return (
    <Card className="hover:shadow-md transition-smooth">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <Link 
            to={`/tickets/${ticket.id}`}
            className="text-lg font-semibold hover:text-primary transition-smooth line-clamp-2"
          >
            {ticket.title}
          </Link>
          <div className="flex items-center space-x-2 ml-4">
            <Badge variant="status" className={`${status.color} text-white`}>
              {status.label}
            </Badge>
            <Badge variant="status" className={priority.color}>
              {priority.label}
            </Badge>
          </div>
        </div>
        
        <p className="text-muted-foreground text-sm line-clamp-2 mt-2">
          {ticket.description}
        </p>
      </CardHeader>

      <CardContent className="py-3">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <User className="h-4 w-4" />
              <span>{ticket.creator.full_name}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}</span>
            </div>

            {ticket.assigned_agent && (
              <div className="flex items-center space-x-1">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-xs">
                    {ticket.assigned_agent.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span>Assigned to {ticket.assigned_agent.full_name}</span>
              </div>
            )}
          </div>

          <Badge 
            variant="status" 
            style={{ backgroundColor: `${ticket.category.color}20`, borderColor: ticket.category.color }}
          >
            {ticket.category.name}
          </Badge>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            {ticket.comment_count !== undefined && (
              <div className="flex items-center space-x-1">
                <MessageSquare className="h-4 w-4" />
                <span>{ticket.comment_count}</span>
              </div>
            )}
            
            {ticket.has_attachments && (
              <div className="flex items-center space-x-1">
                <Paperclip className="h-4 w-4" />
                <span>Attachments</span>
              </div>
            )}

            {ticket.upvotes !== undefined && (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <ThumbsUp className="h-4 w-4 text-green-600" />
                  <span>{ticket.upvotes}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <ThumbsDown className="h-4 w-4 text-red-600" />
                  <span>{ticket.downvotes}</span>
                </div>
              </div>
            )}

            {ticket.updated_at !== ticket.created_at && (
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>Updated {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}</span>
              </div>
            )}
          </div>

          {showActions && (
            <Button asChild size="sm" variant="outline">
              <Link to={`/tickets/${ticket.id}`}>
                View Details
              </Link>
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}