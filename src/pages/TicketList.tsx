import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TicketCard from '@/components/tickets/TicketCard';
import TicketFilters from '@/components/tickets/TicketFilters';
import { Pagination } from '@/components/ui/pagination';
import { Plus, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const ITEMS_PER_PAGE = 10;

export default function TicketList() {
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tickets, setTickets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [showMyTicketsOnly, setShowMyTicketsOnly] = useState(false);

  // Initialize filters from URL params
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    priority: searchParams.get('priority') || '',
    category: searchParams.get('category') || '',
    assignedTo: searchParams.get('assignedTo') || '',
    sortBy: searchParams.get('sortBy') || 'created_at',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
  });

  const currentPage = parseInt(searchParams.get('page') || '1');

  useEffect(() => {
    fetchCategories();
    fetchAgents();
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [filters, currentPage, showMyTicketsOnly, profile]);

  useEffect(() => {
    // Update URL params when filters change
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    if (currentPage > 1) params.set('page', currentPage.toString());
    setSearchParams(params);
  }, [filters, currentPage, setSearchParams]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('id, name, color')
      .eq('is_active', true);
    setCategories(data || []);
  };

  const fetchAgents = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('role', ['support_agent', 'admin']);
    setAgents(data || []);
  };

  const fetchTickets = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      let query = supabase
        .from('tickets')
        .select(`
          id,
          title,
          description,
          status,
          priority,
          created_at,
          updated_at,
          creator_id,
          assigned_agent_id,
          categories (id, name, color),
          profiles:creator_id (full_name, email),
          assigned_profiles:assigned_agent_id (full_name),
          ticket_comments (count),
          ticket_votes (
            vote_type,
            profiles (id)
          ),
          attachments:ticket_attachments (count)
        `, { count: 'exact' });

      // Apply role-based filtering
      if (profile.role === 'end_user') {
        // End users can only see their own tickets
        query = query.eq('creator_id', profile.id);
      } else if (profile.role === 'support_agent') {
        // Support agents can see tickets they're assigned to or created by them
        if (showMyTicketsOnly) {
          query = query.eq('creator_id', profile.id);
        } else {
          query = query.or(`creator_id.eq.${profile.id},assigned_agent_id.eq.${profile.id}`);
        }
      }
      // Admins can see all tickets (no filtering needed)

      // Apply filters
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }

      if (filters.category) {
        query = query.eq('category_id', filters.category);
      }

      if (filters.assignedTo) {
        if (filters.assignedTo === 'unassigned') {
          query = query.is('assigned_agent_id', null);
        } else {
          query = query.eq('assigned_agent_id', filters.assignedTo);
        }
      }

      // Apply sorting
      query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' });

      // Apply pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) throw error;

      // Process the data to include vote counts and comment counts
      const processedTickets = (data || []).map(ticket => ({
        ...ticket,
        category: ticket.categories,
        creator: ticket.profiles,
        assigned_agent: ticket.assigned_profiles,
        comment_count: ticket.ticket_comments?.length || 0,
        upvotes: ticket.ticket_votes?.filter(v => v.vote_type === 'upvote').length || 0,
        downvotes: ticket.ticket_votes?.filter(v => v.vote_type === 'downvote').length || 0,
        has_attachments: (ticket.attachments?.length || 0) > 0,
      }));

      setTickets(processedTickets);
      setTotalCount(count || 0);

    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    // Reset to first page when filters change
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    setSearchParams(params);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    if (page > 1) {
      params.set('page', page.toString());
    } else {
      params.delete('page');
    }
    setSearchParams(params);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold">Tickets</h1>
          <p className="text-muted-foreground">
            {profile?.role === 'end_user' ? 'Your support tickets' : 'Manage support tickets'}
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link to="/tickets/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Ticket
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Filter & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <TicketFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            categories={categories}
            agents={agents}
            showMyTicketsOnly={profile?.role !== 'end_user' ? showMyTicketsOnly : undefined}
            onMyTicketsOnlyChange={profile?.role !== 'end_user' ? setShowMyTicketsOnly : undefined}
          />
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {loading ? 'Loading...' : `${totalCount} ticket${totalCount !== 1 ? 's' : ''} found`}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading tickets...</p>
            </div>
          </div>
        ) : tickets.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="text-center py-12">
              <div className="text-muted-foreground space-y-4">
                <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-muted/30">
                  <Plus className="h-8 w-8 opacity-50" />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-medium">No tickets found</p>
                  <p className="text-sm">Try adjusting your filters or create a new ticket.</p>
                </div>
                <Button asChild className="mt-4">
                  <Link to="/tickets/create">Create New Ticket</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4">
              {tickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center pt-4">
                <nav className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    Previous
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={page === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                  >
                    Next
                  </Button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}