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
      if (profile.role === 'end_user' || showMyTicketsOnly) {
        if (profile.role === 'end_user') {
          query = query.eq('creator_id', profile.id);
        } else if (showMyTicketsOnly) {
          query = query.eq('creator_id', profile.id);
        }
      }

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
        upvotes: ticket.ticket_votes?.filter(v => v.vote_type === 'up').length || 0,
        downvotes: ticket.ticket_votes?.filter(v => v.vote_type === 'down').length || 0,
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tickets</h1>
          <p className="text-muted-foreground mt-1">
            {profile?.role === 'end_user' ? 'Your support tickets' : 'Manage support tickets'}
          </p>
        </div>
        <Button asChild className="mt-4 sm:mt-0">
          <Link to="/tickets/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Ticket
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter & Search</CardTitle>
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
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <div className="text-muted-foreground">
                <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No tickets found</p>
                <p className="mb-4">Try adjusting your filters or create a new ticket.</p>
                <Button asChild>
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
              <div className="flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}