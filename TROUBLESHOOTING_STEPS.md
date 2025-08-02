# 🔧 Attachment Error Troubleshooting

## Step 1: Identify the Error

**Please share the exact error message you're seeing.** Common errors include:

- "Bucket not found"
- "Permission denied" 
- "File too large"
- "Invalid file type"
- "Database error"
- "Network error"

## Step 2: Quick Fix (Try This First)

1. **Go to your Supabase dashboard**
2. **Navigate to SQL Editor**
3. **Copy and paste this script:**

```sql
-- Quick Fix for Attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated downloads" ON storage.objects;

CREATE POLICY "Allow authenticated uploads" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'attachments' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Allow authenticated downloads" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'attachments' 
        AND auth.role() = 'authenticated'
    );

CREATE TABLE IF NOT EXISTS public.ticket_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.ticket_attachments DISABLE ROW LEVEL SECURITY;
```

4. **Run the script**

## Step 3: Test the Fix

1. **Start your app**: `npm run dev`
2. **Create a new ticket**
3. **Try uploading a small image file**
4. **Check browser console for errors**

## Step 4: Run Diagnostic Script

If the quick fix doesn't work, run this in your browser console:

1. **Open browser developer tools** (F12)
2. **Go to Console tab**
3. **Copy and paste the contents of `diagnose-attachments.js`**
4. **Press Enter**

This will show you exactly what's wrong.

## Step 5: Common Solutions

### If you get "Bucket not found":
- Run the quick fix script above

### If you get "Permission denied":
- Make sure you're logged in to the app
- Run the quick fix script above

### If you get "File too large":
- Try uploading a smaller file (< 10MB)

### If you get "Invalid file type":
- Try uploading: JPG, PNG, PDF, TXT files

### If you get "Database error":
- Run the complete fix script: `supabase/fix-attachments-complete.sql`

## Step 6: Still Having Issues?

**Please share:**
1. The exact error message
2. What file type you're trying to upload
3. The file size
4. Whether you're logged in to the app
5. The output from the diagnostic script

This will help me provide a specific solution for your exact problem. 