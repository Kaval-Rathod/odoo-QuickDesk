import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import TicketCard from '@/components/tickets/TicketCard';
import {
  Plus,
  TicketIcon,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  MessageSquare,
} from 'lucide-react';

interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  myTickets?: number;
  myOpenTickets?: number;
}

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
  });
  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [profile]);

  const fetchDashboardData = async () => {
    if (!profile) return;

    try {
      // Fetch stats based on user role
      let statsQuery = supabase
        .from('tickets')
        .select('id, status, creator_id, assigned_agent_id');

      if (profile.role === 'end_user') {
        statsQuery = statsQuery.eq('creator_id', profile.id);
      }

      const { data: tickets } = await statsQuery;

      const dashboardStats: DashboardStats = {
        totalTickets: tickets?.length || 0,
        openTickets: tickets?.filter(t => t.status === 'open').length || 0,
        inProgressTickets: tickets?.filter(t => t.status === 'in_progress').length || 0,
        resolvedTickets: tickets?.filter(t => t.status === 'resolved').length || 0,
      };

      if (profile.role === 'support_agent') {
        dashboardStats.myTickets = tickets?.filter(t => t.assigned_agent_id === profile.id).length || 0;
        dashboardStats.myOpenTickets = tickets?.filter(t => 
          t.assigned_agent_id === profile.id && ['open', 'in_progress'].includes(t.status)
        ).length || 0;
      }

      setStats(dashboardStats);

      // Fetch recent tickets
      let recentQuery = supabase
        .from('tickets')
        .select(`
          id,
          title,
          description,
          status,
          priority,
          created_at,
          updated_at,
          categories (name, color),
          profiles:creator_id (full_name, email),
          assigned_profiles:assigned_agent_id (full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (profile.role === 'end_user') {
        recentQuery = recentQuery.eq('creator_id', profile.id);
      }

      const { data: recentData } = await recentQuery;
      setRecentTickets(recentData || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatCards = () => {
    const baseCards = [
      {
        title: 'Total Tickets',
        value: stats.totalTickets,
        icon: TicketIcon,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
      },
      {
        title: 'Open Tickets',
        value: stats.openTickets,
        icon: AlertCircle,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
      },
      {
        title: 'In Progress',
        value: stats.inProgressTickets,
        icon: Clock,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
      },
      {
        title: 'Resolved',
        value: stats.resolvedTickets,
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
      },
    ];

    if (profile?.role === 'support_agent') {
      return [
        ...baseCards,
        {
          title: 'My Tickets',
          value: stats.myTickets || 0,
          icon: Users,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
        },
        {
          title: 'My Active',
          value: stats.myOpenTickets || 0,
          icon: TrendingUp,
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-50',
        },
      ];
    }

    return baseCards;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {profile?.full_name}!
          </p>
        </div>
        <Button asChild className="mt-4 sm:mt-0">
          <Link to="/tickets/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Ticket
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {getStatCards().map((card, index) => (
          <Card key={index} className="hover:shadow-md transition-smooth">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold">{card.value}</p>
                </div>
                <div className={`p-3 rounded-full ${card.bgColor}`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-smooth">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start">
              <Link to="/tickets/create">
                <Plus className="h-4 w-4 mr-2" />
                Create New Ticket
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/tickets">
                <MessageSquare className="h-4 w-4 mr-2" />
                View All Tickets
              </Link>
            </Button>
            {profile?.role !== 'end_user' && (
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to="/tickets?status=open">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Open Tickets
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Tickets</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link to="/tickets">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentTickets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TicketIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No tickets found</p>
                <Button asChild className="mt-4" size="sm">
                  <Link to="/tickets/create">Create your first ticket</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentTickets.slice(0, 3).map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-smooth">
                    <div className="flex-1">
                      <Link 
                        to={`/tickets/${ticket.id}`}
                        className="font-medium hover:text-primary transition-smooth line-clamp-1"
                      >
                        {ticket.title}
                      </Link>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {ticket.priority}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {ticket.categories?.name}
                        </span>
                      </div>
                    </div>
                    <Button asChild size="sm" variant="ghost">
                      <Link to={`/tickets/${ticket.id}`}>View</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Role-specific sections */}
      {profile?.role === 'admin' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Admin Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to="/admin/users">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to="/admin/categories">
                  <TicketIcon className="h-4 w-4 mr-2" />
                  Manage Categories
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}