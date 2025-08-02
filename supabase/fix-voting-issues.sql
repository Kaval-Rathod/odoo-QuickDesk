-- Fix voting system issues
-- This script ensures the ticket_votes table is properly set up

-- First, let's make sure the table exists with the correct structure
CREATE TABLE IF NOT EXISTS public.ticket_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id),
    vote_type TEXT CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ticket_id, user_id)
);

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_ticket_votes_ticket_id ON public.ticket_votes(ticket_id);

-- Temporarily disable RLS to test
ALTER TABLE public.ticket_votes DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view votes on tickets they can access" ON public.ticket_votes;
DROP POLICY IF EXISTS "Users can vote on tickets" ON public.ticket_votes;
DROP POLICY IF EXISTS "Users can update their own votes" ON public.ticket_votes;

-- Create simple policies for now
CREATE POLICY "ticket_votes_select_policy" ON public.ticket_votes
    FOR SELECT USING (true);

CREATE POLICY "ticket_votes_insert_policy" ON public.ticket_votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ticket_votes_update_policy" ON public.ticket_votes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "ticket_votes_delete_policy" ON public.ticket_votes
    FOR DELETE USING (auth.uid() = user_id);

-- Re-enable RLS
ALTER TABLE public.ticket_votes ENABLE ROW LEVEL SECURITY;

-- Verify the table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ticket_votes' 
ORDER BY ordinal_position; 