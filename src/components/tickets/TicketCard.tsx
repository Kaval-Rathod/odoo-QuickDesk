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
  category?: {
    name: string;
    color: string;
  } | null;
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
    <Card className="hover:shadow-lg transition-all duration-200 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <Link 
            to={`/tickets/${ticket.id}`}
            className="text-lg font-semibold hover:text-primary transition-colors line-clamp-2 flex-1"
          >
            {ticket.title}
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="status" className={`${status.color} text-white`}>
              {status.label}
            </Badge>
            <Badge variant="status" className={priority.color}>
              {priority.label}
            </Badge>
          </div>
        </div>
        
        <p className="text-muted-foreground text-sm line-clamp-2 mt-3 leading-relaxed">
          {ticket.description}
        </p>
      </CardHeader>

      <CardContent className="py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium">{ticket.creator.full_name}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span>{formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}</span>
            </div>

            {ticket.assigned_agent && (
              <div className="flex items-center space-x-2">
                <Avatar className="h-5 w-5 flex-shrink-0">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {ticket.assigned_agent.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline">Assigned to {ticket.assigned_agent.full_name}</span>
                <span className="sm:hidden">{ticket.assigned_agent.full_name}</span>
              </div>
            )}
          </div>

          {ticket.category ? (
            <Badge 
              variant="status" 
              style={{ backgroundColor: `${ticket.category.color}20`, borderColor: ticket.category.color }}
              className="self-start sm:self-center"
            >
              {ticket.category.name}
            </Badge>
          ) : (
            <Badge 
              variant="status" 
              className="bg-gray-100 text-gray-600 border-gray-300 self-start sm:self-center"
            >
              No Category
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-4 border-t">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4">
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {ticket.comment_count !== undefined && (
              <div className="flex items-center space-x-1">
                <MessageSquare className="h-4 w-4" />
                <span>{ticket.comment_count}</span>
              </div>
            )}
            
            {ticket.has_attachments && (
              <div className="flex items-center space-x-1">
                <Paperclip className="h-4 w-4" />
                <span className="hidden sm:inline">Attachments</span>
                <span className="sm:hidden">Files</span>
              </div>
            )}

            {ticket.upvotes !== undefined && (
              <div className="flex items-center space-x-3">
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
                <span className="hidden sm:inline">Updated {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}</span>
                <span className="sm:hidden">Updated</span>
              </div>
            )}
          </div>

          {showActions && (
            <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
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