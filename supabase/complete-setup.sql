-- Complete QuickDesk Database Setup
-- This will fix all 500 errors

-- Step 1: Drop existing objects to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
DROP TRIGGER IF EXISTS update_tickets_updated_at ON public.tickets;
DROP TRIGGER IF EXISTS update_ticket_comments_updated_at ON public.ticket_comments;

DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- Step 2: Create tables (if they don't exist)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    email TEXT,
    role TEXT DEFAULT 'end_user' CHECK (role IN ('end_user', 'support_agent', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    category_id UUID REFERENCES public.categories(id),
    creator_id UUID REFERENCES public.profiles(id),
    assigned_agent_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ticket_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.profiles(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ticket_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    file_type TEXT,
    uploaded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ticket_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id),
    vote_type TEXT CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ticket_id, user_id)
);

-- Step 3: Create indexes
CREATE INDEX IF NOT EXISTS idx_tickets_creator_id ON public.tickets(creator_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_agent_id ON public.tickets(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_category_id ON public.tickets(category_id);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket_id ON public.ticket_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket_id ON public.ticket_attachments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_votes_ticket_id ON public.ticket_votes(ticket_id);

-- Step 4: Insert default categories
INSERT INTO public.categories (name, description, color) VALUES
('General', 'General inquiries and questions', '#3B82F6'),
('Technical Support', 'Technical issues and problems', '#EF4444'),
('Feature Request', 'Requests for new features', '#10B981'),
('Bug Report', 'Reports of bugs or issues', '#F59E0B'),
('Account Issues', 'Account-related problems', '#8B5CF6'),
('Billing', 'Billing and payment questions', '#06B6D4')
ON CONFLICT (name) DO NOTHING;

-- Step 5: Create functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        NEW.email,
        'end_user'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create triggers
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON public.categories 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at 
    BEFORE UPDATE ON public.tickets 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ticket_comments_updated_at 
    BEFORE UPDATE ON public.ticket_comments 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 7: Enable RLS and create simple policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_votes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON public.profiles;
DROP POLICY IF EXISTS "Everyone can view active categories" ON public.categories;
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can update their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Allow all authenticated users to view tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can view comments on tickets they can access" ON public.ticket_comments;
DROP POLICY IF EXISTS "Users can create comments" ON public.ticket_comments;
DROP POLICY IF EXISTS "Users can view attachments on tickets they can access" ON public.ticket_attachments;
DROP POLICY IF EXISTS "Users can upload attachments" ON public.ticket_attachments;
DROP POLICY IF EXISTS "Users can view votes on tickets they can access" ON public.ticket_votes;
DROP POLICY IF EXISTS "Users can vote on tickets" ON public.ticket_votes;
DROP POLICY IF EXISTS "Users can update their own votes" ON public.ticket_votes;

-- Create simple, permissive policies
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_policy" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_policy" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "categories_select_policy" ON public.categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "tickets_select_policy" ON public.tickets
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "tickets_insert_policy" ON public.tickets
    FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "tickets_update_policy" ON public.tickets
    FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "ticket_comments_select_policy" ON public.ticket_comments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "ticket_comments_insert_policy" ON public.ticket_comments
    FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY "ticket_attachments_select_policy" ON public.ticket_attachments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "ticket_attachments_insert_policy" ON public.ticket_attachments
    FOR INSERT WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "ticket_votes_select_policy" ON public.ticket_votes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "ticket_votes_insert_policy" ON public.ticket_votes
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "ticket_votes_update_policy" ON public.ticket_votes
    FOR UPDATE USING (user_id = auth.uid()); 