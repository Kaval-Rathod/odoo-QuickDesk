# Troubleshooting Attachments Issue

## Problem
Attachments are being uploaded but not displayed in the ticket detail view.

## Debugging Steps

### 1. Check Console Logs
Open browser developer tools and look for:
- "Fetched ticket data:" - shows the ticket data
- "Attachments:" - shows if attachments are in the join query
- "Fetched attachments directly:" - shows direct attachment query
- "File saved to database:" - shows if files are being saved

### 2. Check Database
Run these queries in Supabase SQL editor:

```sql
-- Check if attachments table exists
SELECT * FROM information_schema.tables 
WHERE table_name = 'ticket_attachments';

-- Check if there are any attachments
SELECT * FROM ticket_attachments 
ORDER BY created_at DESC 
LIMIT 10;

-- Check RLS policies
SELECT * FROM pg_policies 
WHERE tablename = 'ticket_attachments';
```

### 3. Check Storage Bucket
```sql
-- Check if storage bucket exists
SELECT * FROM storage.buckets 
WHERE id = 'attachments';

-- Check storage policies
SELECT * FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';
```

## Common Issues & Solutions

### Issue 1: RLS Policies Blocking Access
**Solution**: Run the `supabase/fix-attachments-rls.sql` script

### Issue 2: Storage Bucket Not Created
**Solution**: Run the `supabase/setup-attachments.sql` script

### Issue 3: Join Query Not Working
**Solution**: The separate `fetchAttachments()` function should handle this

### Issue 4: File Upload Failing
**Solution**: Check browser console for upload errors

## Quick Fix Script
Run this in Supabase SQL editor:

```sql
-- Temporarily disable RLS to test
ALTER TABLE public.ticket_attachments DISABLE ROW LEVEL SECURITY;

-- Check if attachments exist
SELECT 
    ta.id,
    ta.ticket_id,
    ta.file_name,
    ta.file_path,
    ta.file_size,
    ta.file_type,
    t.title as ticket_title
FROM ticket_attachments ta
JOIN tickets t ON ta.ticket_id = t.id
ORDER BY ta.created_at DESC;

-- Re-enable RLS
ALTER TABLE public.ticket_attachments ENABLE ROW LEVEL SECURITY;
```

## Expected Behavior

1. **File Upload**: Files should upload to Supabase storage
2. **Database Entry**: File metadata should be saved to `ticket_attachments`
3. **Display**: Attachments should appear in ticket detail view
4. **Download**: Download buttons should work

## Debug Info in UI
The ticket detail page now shows debug information:
- Ticket ID
- Number of attachments found

This will help identify where the issue is occurring. 