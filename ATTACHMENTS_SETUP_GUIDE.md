# Attachments Setup Guide

## Step 1: Run the Complete Fix Script

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/fix-attachments-complete.sql`
4. Run the script

This script will:
- Create/update the storage bucket with proper configuration
- Set up all necessary storage policies
- Create/update the database table
- Set up RLS policies
- Verify the setup

## Step 2: Test the Setup

After running the script, you should see verification output showing:
- Storage bucket exists and is public
- Storage policies are created
- Database table structure is correct
- RLS policies are in place

## Step 3: Test File Upload

1. Start your application: `npm run dev`
2. Create a new ticket
3. Try uploading different file types:
   - Images (JPEG, PNG, GIF, WebP)
   - Documents (PDF, DOC, DOCX, TXT)
   - Videos (MP4, WebM, OGG)
   - Audio (MP3, WAV, OGG)

## Step 4: Debug Issues

If uploads fail, check the browser console for detailed error messages. The improved error handling will show:
- Which files failed to upload
- Specific error messages for each failure
- Success/failure counts

## Step 5: Verify Storage

1. Go to your Supabase dashboard
2. Navigate to **Storage** → **attachments**
3. You should see uploaded files in folders like `tickets/{ticket-id}/`

## Step 6: Test File Display

1. View a ticket with attachments
2. Check if attachments appear in the ticket detail view
3. Test the download functionality

## Common Issues & Solutions

### Issue: "Bucket not found"
**Solution**: Run the complete fix script to create the bucket

### Issue: "Permission denied"
**Solution**: The script sets up proper policies for authenticated users

### Issue: "File too large"
**Solution**: Files are limited to 10MB. The script configures this limit

### Issue: "Invalid file type"
**Solution**: The script configures allowed MIME types. Supported types:
- Images: JPEG, PNG, GIF, WebP
- Documents: PDF, DOC, DOCX, TXT
- Videos: MP4, WebM, OGG
- Audio: MP3, WAV, OGG

## Testing Script

You can also run the test script in your browser console:
1. Open browser developer tools
2. Go to the Console tab
3. Copy and paste the contents of `test-attachments.js`
4. Press Enter to run the test

This will help identify any remaining issues with the storage configuration.

## Expected Behavior

After following these steps:
1. ✅ Users can upload files when creating tickets
2. ✅ Files are stored in Supabase storage
3. ✅ File metadata is saved to the database
4. ✅ Attachments appear in ticket detail view
5. ✅ Download links work correctly
6. ✅ Different file types are supported
7. ✅ File size limits are enforced
8. ✅ Error handling provides clear feedback 