-- Fix Attachments RLS Policies
-- This script ensures the ticket_attachments table has proper RLS policies

-- First, let's make sure the table exists with the correct structure
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

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket_id ON public.ticket_attachments(ticket_id);

-- Enable RLS
ALTER TABLE public.ticket_attachments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view attachments on tickets they can access" ON public.ticket_attachments;
DROP POLICY IF EXISTS "Users can upload attachments" ON public.ticket_attachments;

-- Create new policies
CREATE POLICY "ticket_attachments_select_policy" ON public.ticket_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tickets 
            WHERE id = ticket_attachments.ticket_id AND creator_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('support_agent', 'admin')
        )
    );

CREATE POLICY "ticket_attachments_insert_policy" ON public.ticket_attachments
    FOR INSERT WITH CHECK (
        uploaded_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.tickets 
            WHERE id = ticket_attachments.ticket_id AND creator_id = auth.uid()
        )
    );

CREATE POLICY "ticket_attachments_update_policy" ON public.ticket_attachments
    FOR UPDATE USING (
        uploaded_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('support_agent', 'admin')
        )
    );

CREATE POLICY "ticket_attachments_delete_policy" ON public.ticket_attachments
    FOR DELETE USING (
        uploaded_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('support_agent', 'admin')
        )
    );

-- Verify the table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ticket_attachments' 
ORDER BY ordinal_position;

-- Show current attachments
SELECT 
    id,
    ticket_id,
    file_name,
    file_path,
    file_size,
    file_type,
    uploaded_by,
    created_at
FROM public.ticket_attachments 
ORDER BY created_at DESC; 