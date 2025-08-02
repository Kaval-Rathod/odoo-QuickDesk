import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  BarChart3,
  Users,
  MessageSquare,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  FolderOpen,
} from 'lucide-react';

interface AnalyticsData {
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
  totalUsers: number;
  totalCategories: number;
  ticketsByStatus: { status: string; count: number }[];
  ticketsByCategory: { category: string; count: number }[];
  recentActivity: { id: string; title: string; status: string; created_at: string }[];
}

export default function Analytics() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "You need admin privileges to view analytics.",
        variant: "destructive",
      });
      return;
    }

    fetchAnalytics();
  }, [profile]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch tickets data
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('*');

      if (ticketsError) throw ticketsError;

      // Fetch users data
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('*');

      if (usersError) throw usersError;

      // Fetch categories data
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('*');

      if (categoriesError) throw categoriesError;

      // Calculate analytics
      const totalTickets = tickets?.length || 0;
      const openTickets = tickets?.filter(t => t.status === 'open').length || 0;
      const closedTickets = tickets?.filter(t => t.status === 'closed').length || 0;
      const totalUsers = users?.length || 0;
      const totalCategories = categories?.length || 0;

      // Group tickets by status
      const ticketsByStatus = [
        { status: 'Open', count: openTickets },
        { status: 'In Progress', count: tickets?.filter(t => t.status === 'in_progress').length || 0 },
        { status: 'Closed', count: closedTickets },
      ];

      // Group tickets by category
      const ticketsByCategory = categories?.map(category => ({
        category: category.name,
        count: tickets?.filter(t => t.category_id === category.id).length || 0,
      })) || [];

      // Get recent tickets
      const recentActivity = tickets?.slice(0, 5).map(ticket => ({
        id: ticket.id,
        title: ticket.title,
        status: ticket.status,
        created_at: ticket.created_at,
      })) || [];

      setData({
        totalTickets,
        openTickets,
        closedTickets,
        totalUsers,
        totalCategories,
        ticketsByStatus,
        ticketsByCategory,
        recentActivity,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You need admin privileges to view analytics.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Data Available</h2>
          <p className="text-muted-foreground">Unable to load analytics data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            System overview and performance metrics
          </p>
        </div>
        <Button onClick={fetchAnalytics} variant="outline">
          <BarChart3 className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalTickets}</div>
            <p className="text-xs text-muted-foreground">
              All time tickets created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.openTickets}</div>
            <p className="text-xs text-muted-foreground">
              Currently open tickets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Registered users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalCategories}</div>
            <p className="text-xs text-muted-foreground">
              Available categories
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tickets by Status</CardTitle>
                <CardDescription>Distribution of tickets by their current status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.ticketsByStatus.map((item, index) => (
                    <div key={`status-${index}-${item.status}`} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {item.status === 'Open' && <AlertCircle className="h-4 w-4 text-orange-500" />}
                        {item.status === 'In Progress' && <Clock className="h-4 w-4 text-blue-500" />}
                        {item.status === 'Closed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                        <span className="text-sm font-medium">{item.status}</span>
                      </div>
                      <Badge variant="secondary">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tickets by Category</CardTitle>
                <CardDescription>Distribution of tickets by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.ticketsByCategory.map((item, index) => (
                    <div key={`category-${index}-${item.category}`} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.category}</span>
                      <Badge variant="secondary">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ticket Statistics</CardTitle>
              <CardDescription>Detailed breakdown of ticket metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-500">{data.openTickets}</div>
                  <p className="text-sm text-muted-foreground">Open Tickets</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-500">
                    {data.totalTickets - data.openTickets - data.closedTickets}
                  </div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-500">{data.closedTickets}</div>
                  <p className="text-sm text-muted-foreground">Closed Tickets</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest tickets created in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.recentActivity.map((ticket, index) => (
                  <div key={`activity-${index}-${ticket.id}`} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {ticket.status === 'open' && <AlertCircle className="h-4 w-4 text-orange-500" />}
                        {ticket.status === 'in_progress' && <Clock className="h-4 w-4 text-blue-500" />}
                        {ticket.status === 'closed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                        <Badge variant="outline">{ticket.status}</Badge>
                      </div>
                      <div>
                        <p className="font-medium">{ticket.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 