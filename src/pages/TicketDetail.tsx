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

  useEffect(() => {
    if (id) {
      fetchTicket();
      fetchComments();
      fetchAgents();
      fetchVotes();
      fetchAttachments();
    }
  }, [id]);

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

  const handleStatusUpdate = async (newStatus: string) => {
    if (!profile || !['support_agent', 'admin'].includes(profile.role)) return;

    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      await fetchTicket();
      
      // Send email notification for status change
      await sendTicketNotification(id!, 'status_changed');
      
      toast({
        title: "Status Updated",
        description: `Ticket status changed to ${newStatus.replace('_', ' ')}.`,
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

  const handleAgentAssignment = async (agentId: string) => {
    if (!profile || !['support_agent', 'admin'].includes(profile.role)) return;

    setAssigningAgent(true);
    try {
      const actualAgentId = agentId === 'unassigned' ? null : agentId;
      
      const { error } = await supabase
        .from('tickets')
        .update({ assigned_agent_id: actualAgentId })
        .eq('id', id);

      if (error) throw error;

      await fetchTicket();
      
      // Send email notification for agent assignment
      if (actualAgentId) {
        await sendTicketNotification(id!, 'assigned');
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
      
      // Send email notification for new comment
      await sendTicketNotification(id!, 'commented');
      
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
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => navigate('/tickets')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tickets
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{ticket.title}</CardTitle>
              <div className="flex items-center space-x-2">
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
                className="ml-4"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Ticket
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Created by:</span>
              <span>{ticket.profiles?.full_name || 'Unknown'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Created:</span>
              <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
            </div>
            {ticket.assigned_profiles && (
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Assigned to:</span>
                <span>{ticket.assigned_profiles.full_name}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Description</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>
          </div>

          {/* Attachments Section */}
          {ticket.ticket_attachments && ticket.ticket_attachments.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Attachments ({ticket.ticket_attachments.length})</h3>
              <div className="space-y-2">
                {ticket.ticket_attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{attachment.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(attachment.file_size)} • {attachment.file_type}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(getDownloadUrl(attachment.file_path), '_blank')}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Debug info - remove this later */}
          <div className="text-xs text-muted-foreground">
            Debug: Ticket ID: {ticket.id}, Attachments: {ticket.ticket_attachments?.length || 0}
          </div>

          {/* Voting Section */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button
                variant={userVote === 'upvote' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleVote('upvote')}
                disabled={!profile}
              >
                <ThumbsUp className="h-4 w-4 mr-1" />
                {voteCounts.upvotes}
              </Button>
              <Button
                variant={userVote === 'downvote' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleVote('downvote')}
                disabled={!profile}
              >
                <ThumbsDown className="h-4 w-4 mr-1" />
                {voteCounts.downvotes}
              </Button>
            </div>
          </div>

          {/* Agent Controls - Only for support agents and admins */}
          {profile && ['support_agent', 'admin'].includes(profile.role) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Update Status</Label>
                <Select
                  value={ticket.status}
                  onValueChange={handleStatusUpdate}
                  disabled={updatingStatus}
                >
                  <SelectTrigger>
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

              <div className="space-y-2">
                <Label>Assign Agent</Label>
                <Select
                  value={ticket.assigned_agent_id || 'unassigned'}
                  onValueChange={handleAgentAssignment}
                  disabled={assigningAgent}
                >
                  <SelectTrigger>
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Comments ({comments.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="border-b pb-4 last:border-b-0">
              <div className="flex items-start justify-between mb-2">
                <span className="font-medium">{comment.profiles?.full_name || 'Unknown'}</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(comment.created_at).toLocaleString()}
                </span>
              </div>
              <p className="text-muted-foreground">{comment.content}</p>
            </div>
          ))}

          {/* Only show comment form for ticket creator or agents/admins */}
          {(profile?.id === ticket.creator_id || 
            (profile && ['support_agent', 'admin'].includes(profile.role))) && (
            <form onSubmit={handleAddComment} className="space-y-2">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
              />
              <Button type="submit" disabled={!newComment.trim() || submitting}>
                {submitting ? 'Adding...' : 'Add Comment'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
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
              
              <div className="text-sm text-muted-foreground">
                <p>Share this link with the ticket creator or assigned support agent.</p>
                <p className="mt-1">
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