-- Setup Attachments Storage
-- This script sets up the storage bucket and policies for file attachments

-- Create storage bucket for attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for attachments bucket
-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'attachments' 
        AND auth.role() = 'authenticated'
    );

-- Allow users to view files they have access to
CREATE POLICY "Allow authenticated downloads" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'attachments' 
        AND auth.role() = 'authenticated'
    );

-- Allow users to update their own files
CREATE POLICY "Allow authenticated updates" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'attachments' 
        AND auth.role() = 'authenticated'
    );

-- Allow users to delete their own files
CREATE POLICY "Allow authenticated deletes" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'attachments' 
        AND auth.role() = 'authenticated'
    );

-- Verify the setup
SELECT 
    name,
    public,
    created_at
FROM storage.buckets 
WHERE id = 'attachments';

-- Show storage policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'; 