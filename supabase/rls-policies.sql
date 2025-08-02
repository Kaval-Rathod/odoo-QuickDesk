-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_votes ENABLE ROW LEVEL SECURITY;

-- Simple policies that allow authenticated users to access data
-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow profile creation" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Categories policies - allow everyone to view active categories
CREATE POLICY "Everyone can view active categories" ON public.categories
    FOR SELECT USING (is_active = true);

-- Tickets policies
CREATE POLICY "Users can view their own tickets" ON public.tickets
    FOR SELECT USING (creator_id = auth.uid());

CREATE POLICY "Users can create tickets" ON public.tickets
    FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can update their own tickets" ON public.tickets
    FOR UPDATE USING (creator_id = auth.uid());

-- Allow all authenticated users to view all tickets (for now)
CREATE POLICY "Allow all authenticated users to view tickets" ON public.tickets
    FOR SELECT USING (auth.role() = 'authenticated');

-- Ticket comments policies
CREATE POLICY "Users can view comments on tickets they can access" ON public.ticket_comments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create comments" ON public.ticket_comments
    FOR INSERT WITH CHECK (author_id = auth.uid());

-- Ticket attachments policies
CREATE POLICY "Users can view attachments on tickets they can access" ON public.ticket_attachments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can upload attachments" ON public.ticket_attachments
    FOR INSERT WITH CHECK (uploaded_by = auth.uid());

-- Ticket votes policies
CREATE POLICY "Users can view votes on tickets they can access" ON public.ticket_votes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can vote on tickets" ON public.ticket_votes
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own votes" ON public.ticket_votes
    FOR UPDATE USING (user_id = auth.uid()); 