# Storage Setup Guide

## Supabase Storage Configuration

To enable file uploads for ticket attachments, you need to set up a storage bucket in Supabase.

### Step 1: Create Storage Bucket

1. Go to your Supabase dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**
4. Enter the following details:
   - **Name**: `ticket-attachments`
   - **Public bucket**: ✅ Check this box
   - **File size limit**: `10MB` (or your preferred limit)
5. Click **"Create bucket"**

### Step 2: Configure Storage Policies

After creating the bucket, you need to set up Row Level Security policies:

1. Go to **Storage** → **Policies**
2. Click on the `ticket-attachments` bucket
3. Add the following policies:

#### Policy 1: Allow authenticated users to upload files
```sql
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'ticket-attachments' AND
  auth.role() = 'authenticated'
);
```

#### Policy 2: Allow users to view files for tickets they can access
```sql
CREATE POLICY "Allow users to view ticket attachments" ON storage.objects
FOR SELECT USING (
  bucket_id = 'ticket-attachments' AND (
    EXISTS (
      SELECT 1 FROM public.tickets 
      WHERE id::text = (storage.foldername(name))[1] 
      AND creator_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('support_agent', 'admin')
    )
  )
);
```

#### Policy 3: Allow users to delete their own uploads
```sql
CREATE POLICY "Allow users to delete their uploads" ON storage.objects
FOR DELETE USING (
  bucket_id = 'ticket-attachments' AND
  auth.uid()::text = (storage.foldername(name))[2]
);
```

### Step 3: Test File Upload

1. Start your application: `npm run dev`
2. Create a new ticket
3. Try uploading a file
4. Check if the file appears in your Supabase storage

### Troubleshooting

If file uploads don't work:

1. **Check bucket permissions**: Ensure the bucket is public or has proper policies
2. **Verify file size**: Make sure files are under the size limit
3. **Check file types**: Ensure only allowed file types are uploaded
4. **Review console errors**: Check browser console for specific error messages

### Alternative: Disable File Uploads

If you don't need file uploads, you can modify the CreateTicket component to skip the attachment upload section by commenting out the relevant code. 