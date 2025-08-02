import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, MessageSquare, FileText, Clock, User, ThumbsUp, ThumbsDown, Loader2, Download, Share2, Copy, Check } from 'lucide-react';
import { sendTicketNotification } from '@/lib/email-notifications';
import { NotificationService } from '@/lib/notification-service';

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  category_id: string;
  creator_id: string;
  assigned_agent_id: string | null;
  categories?: {
    name: string;
    color: string;
  };
  profiles?: {
    full_name: string;
    email: string;
  };
  assigned_profiles?: {
    full_name: string;
  };
  ticket_attachments?: Attachment[];
}

interface Attachment {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  uploaded_by: string;
  created_at: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  profiles?: {
    full_name: string;
  };
}

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);
  const [userVote, setUserVote] = useState<'upvote' | 'downvote' | null>(null);
  const [voteCounts, setVoteCounts] = useState({ upvotes: 0, downvotes: 0 });
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [assigningAgent, setAssigningAgent] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string>('');
  const [pendingAgent, setPendingAgent] = useState<string>('');

  useEffect(() => {
    if (id) {
      fetchTicket();
      fetchComments();
      fetchAgents();
      fetchVotes();
    }
  }, [id]);

  // Initialize pending values when ticket loads
  useEffect(() => {
    if (ticket) {
      setPendingStatus(ticket.status);
      setPendingAgent(ticket.assigned_agent_id || 'unassigned');
    }
  }, [ticket]);

  const fetchTicket = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          categories (name, color),
          profiles:creator_id (full_name, email),
          assigned_profiles:assigned_agent_id (full_name),
          ticket_attachments (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Check access control - end users can only see their own tickets
      if (profile?.role === 'end_user' && data.creator_id !== profile.id) {
        toast({
          title: "Access Denied",
          description: "You can only view your own tickets.",
          variant: "destructive",
        });
        navigate('/tickets');
        return;
      }

      // Check if user is assigned agent for this ticket
      const isAssignedAgent = profile?.role === 'support_agent' && data.assigned_agent_id === profile.id;
      const isAdmin = profile?.role === 'admin';
      const isCreator = data.creator_id === profile?.id;
      
      // Only allow access if user is creator, assigned agent, or admin
      if (!isCreator && !isAssignedAgent && !isAdmin) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to view this ticket.",
          variant: "destructive",
        });
        navigate('/tickets');
        return;
      }
      
      console.log('Fetched ticket data:', data);
      console.log('Attachments:', data?.ticket_attachments);
      
      setTicket(data);
    } catch (error: any) {
      console.error('Error fetching ticket:', error);
      toast({
        title: "Error",
        description: "Failed to load ticket details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('ticket_comments')
        .select(`
          *,
          profiles:author_id (full_name)
        `)
        .eq('ticket_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error: any) {
      console.error('Error fetching comments:', error);
    }
  };

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('role', ['support_agent', 'admin']);
      
      if (error) throw error;
      setAgents(data || []);
    } catch (error: any) {
      console.error('Error fetching agents:', error);
    }
  };

  const fetchVotes = async () => {
    if (!profile) return;
    
    try {
      // Get vote counts
      const { data: votes, error: votesError } = await supabase
        .from('ticket_votes')
        .select('vote_type')
        .eq('ticket_id', id);

      if (votesError) {
        console.error('Error fetching votes:', votesError);
        return;
      }

      const upvotes = votes?.filter(v => v.vote_type === 'upvote').length || 0;
      const downvotes = votes?.filter(v => v.vote_type === 'downvote').length || 0;
      setVoteCounts({ upvotes, downvotes });

      // Get user's vote
      const { data: userVoteData, error: userVoteError } = await supabase
        .from('ticket_votes')
        .select('vote_type')
        .eq('ticket_id', id)
        .eq('user_id', profile.id)
        .maybeSingle();

      if (userVoteError) {
        console.error('Error fetching user vote:', userVoteError);
      }

      setUserVote(userVoteData?.vote_type || null);
    } catch (error: any) {
      console.error('Error fetching votes:', error);
      // Set default values to prevent UI issues
      setVoteCounts({ upvotes: 0, downvotes: 0 });
      setUserVote(null);
    }
  };

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (!profile) return;

    try {
      if (userVote === voteType) {
        // Remove vote
        const { error } = await supabase
          .from('ticket_votes')
          .delete()
          .eq('ticket_id', id)
          .eq('user_id', profile.id);

        if (error) {
          console.error('Error removing vote:', error);
          throw error;
        }
        setUserVote(null);
      } else {
        // Add or update vote
        const { error } = await supabase
          .from('ticket_votes')
          .upsert({
            ticket_id: id,
            user_id: profile.id,
            vote_type: voteType
          });

        if (error) {
          console.error('Error adding vote:', error);
          throw error;
        }
        setUserVote(voteType);
      }

      await fetchVotes();
      toast({
        title: "Vote Updated",
        description: "Your vote has been recorded.",
      });
    } catch (error: any) {
      console.error('Error voting:', error);
      toast({
        title: "Error",
        description: "Failed to record vote. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStatusUpdate = async () => {
    if (!profile || !['support_agent', 'admin'].includes(profile.role) || !pendingStatus) return;

    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: pendingStatus })
        .eq('id', id);

      if (error) throw error;

      await fetchTicket();
      
      // Send notification for status change
      if (ticket) {
        await NotificationService.createTicketUpdatedNotification(
          id!,
          ticket.creator_id,
          ticket.title,
          'status',
          ticket.status,
          pendingStatus
        );
      }
      
      toast({
        title: "Status Updated",
        description: `Ticket status changed to ${pendingStatus.replace('_', ' ')}.`,
      });
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update ticket status.",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAgentAssignment = async () => {
    if (!profile || !['support_agent', 'admin'].includes(profile.role)) return;

    setAssigningAgent(true);
    try {
      const actualAgentId = pendingAgent === 'unassigned' ? null : pendingAgent;
      
      const { error } = await supabase
        .from('tickets')
        .update({ assigned_agent_id: actualAgentId })
        .eq('id', id);

      if (error) throw error;

      await fetchTicket();
      
      // Send notification for agent assignment
      if (ticket && actualAgentId) {
        const assignedAgent = agents.find(a => a.id === actualAgentId);
        if (assignedAgent) {
          await NotificationService.createTicketAssignedNotification(
            id!,
            ticket.creator_id,
            actualAgentId,
            ticket.title,
            assignedAgent.full_name
          );
        }
      } else if (ticket) {
        // Notification for removing assignment
        await NotificationService.createTicketUpdatedNotification(
          id!,
          ticket.creator_id,
          ticket.title,
          'assignment',
          ticket.assigned_profiles?.full_name || 'Assigned',
          'Unassigned'
        );
      }
      
      toast({
        title: "Agent Assigned",
        description: actualAgentId ? "Agent has been assigned to this ticket." : "Agent assignment removed.",
      });
    } catch (error: any) {
      console.error('Error assigning agent:', error);
      toast({
        title: "Error",
        description: "Failed to assign agent.",
        variant: "destructive",
      });
    } finally {
      setAssigningAgent(false);
    }
  };

  const handleShareTicket = () => {
    const link = `${window.location.origin}/tickets/${ticket?.id}`;
    setShareLink(link);
    setShowShareModal(true);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Ticket link copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link.",
        variant: "destructive",
      });
    }
  };

  const getDownloadUrl = (filePath: string) => {
    const { data } = supabase.storage
      .from('attachments')
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const fetchAttachments = async () => {
    try {
      const { data, error } = await supabase
        .from('ticket_attachments')
        .select('*')
        .eq('ticket_id', id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching attachments:', error);
        return;
      }

      console.log('Fetched attachments directly:', data);
      
      // Update ticket with attachments if they exist
      if (data && data.length > 0) {
        setTicket(prev => prev ? { ...prev, ticket_attachments: data } : null);
      }
    } catch (error: any) {
      console.error('Error fetching attachments:', error);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !profile) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('ticket_comments')
        .insert({
          ticket_id: id,
          author_id: profile.id,
          content: newComment.trim(),
        });

      if (error) throw error;

      setNewComment('');
      await fetchComments();
      
      // Send notification for new comment
      if (ticket) {
        await NotificationService.createTicketCommentedNotification(
          id!,
          ticket.creator_id,
          profile.id,
          ticket.title,
          profile.full_name || 'Unknown User'
        );
      }
      
      toast({
        title: "Comment Added",
        description: "Your comment has been added successfully.",
      });
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/tickets')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tickets
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/tickets')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tickets
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Ticket Not Found</h2>
            <p className="text-muted-foreground">The ticket you're looking for doesn't exist.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with back button */}
      <div className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/tickets')}
          className="flex items-center space-x-2 hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to Tickets</span>
        </Button>
      </div>

      {/* Main Ticket Card */}
      <Card className="shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-3">
              <CardTitle className="text-xl sm:text-2xl leading-tight">{ticket.title}</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="status" className={getStatusColor(ticket.status)}>
                  {ticket.status.replace('_', ' ')}
                </Badge>
                <Badge variant="status" className={getPriorityColor(ticket.priority)}>
                  {ticket.priority}
                </Badge>
                {ticket.categories && (
                  <Badge variant="status" style={{ backgroundColor: ticket.categories.color + '20', color: ticket.categories.color }}>
                    {ticket.categories.name}
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Share button - Only for assigned agents and admins */}
            {profile && (
              (profile.role === 'admin') || 
              (profile.role === 'support_agent' && ticket?.assigned_agent_id === profile.id)
            ) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareTicket}
                className="self-start"
              >
                <Share2 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Share Ticket</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Ticket Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">Created by:</span>
              <span className="font-medium">{ticket.profiles?.full_name || 'Unknown'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">Created:</span>
              <span className="font-medium">{new Date(ticket.created_at).toLocaleDateString()}</span>
            </div>
            {ticket.assigned_profiles && (
              <div className="flex items-center space-x-2 sm:col-span-2">
                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">Assigned to:</span>
                <span className="font-medium">{ticket.assigned_profiles.full_name}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Description</h3>
            <div className="bg-muted/30 rounded-lg p-4">
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
            </div>
          </div>

          {/* Attachments Section */}
          {ticket.ticket_attachments && ticket.ticket_attachments.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Attachments ({ticket.ticket_attachments.length})</h3>
              <div className="space-y-3">
                {ticket.ticket_attachments.map((attachment) => (
                  <div key={attachment.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg bg-card">
                    <div className="flex items-center space-x-3 mb-3 sm:mb-0">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{attachment.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(attachment.file_size)} • {attachment.file_type}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(getDownloadUrl(attachment.file_path), '_blank')}
                      className="self-start sm:self-center"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Debug info - remove this later */}
          <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
            Debug: Ticket ID: {ticket.id}, Attachments: {ticket.ticket_attachments?.length || 0}
          </div>

          {/* Voting Section */}
          <div className="flex items-center space-x-4 pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Button
                variant={userVote === 'upvote' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleVote('upvote')}
                disabled={!profile}
                className="h-9 px-3"
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                {voteCounts.upvotes}
              </Button>
              <Button
                variant={userVote === 'downvote' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleVote('downvote')}
                disabled={!profile}
                className="h-9 px-3"
              >
                <ThumbsDown className="h-4 w-4 mr-2" />
                {voteCounts.downvotes}
              </Button>
            </div>
          </div>

          {/* Agent Controls - Only for support agents and admins */}
          {profile && ['support_agent', 'admin'].includes(profile.role) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Update Status</Label>
                  <Select
                    value={pendingStatus}
                    onValueChange={setPendingStatus}
                    disabled={updatingStatus}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleStatusUpdate}
                  disabled={updatingStatus || pendingStatus === ticket?.status}
                  className="w-full"
                >
                  {updatingStatus ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Save Status'
                  )}
                </Button>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Assign Agent</Label>
                  <Select
                    value={pendingAgent}
                    onValueChange={setPendingAgent}
                    disabled={assigningAgent}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleAgentAssignment}
                  disabled={assigningAgent || pendingAgent === (ticket?.assigned_agent_id || 'unassigned')}
                  className="w-full"
                >
                  {assigningAgent ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    'Save Assignment'
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comments Section */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Comments ({comments.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="border-b pb-4 last:border-b-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                    <span className="font-medium text-sm">{comment.profiles?.full_name || 'Unknown'}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground leading-relaxed">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
            </div>
          )}

          {/* Only show comment form for ticket creator or agents/admins */}
          {(profile?.id === ticket.creator_id || 
            (profile && ['support_agent', 'admin'].includes(profile.role))) && (
            <form onSubmit={handleAddComment} className="space-y-3 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="comment" className="text-sm font-medium">Add a comment</Label>
                <Textarea
                  id="comment"
                  placeholder="Type your comment here..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
              <Button 
                type="submit" 
                disabled={!newComment.trim() || submitting}
                className="w-full sm:w-auto"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Comment'
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Share Ticket</CardTitle>
              <CardDescription>
                Share this ticket with others by copying the link below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="share-link">Ticket Link</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="share-link"
                    value={shareLink}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground space-y-2">
                <p>Share this link with the ticket creator or assigned support agent.</p>
                <p className="text-xs">
                  <strong>Security Note:</strong> Only the ticket creator, assigned agent, and admins can access this ticket.
                </p>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowShareModal(false)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 