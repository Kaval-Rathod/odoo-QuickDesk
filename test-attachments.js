// Test script to verify attachments functionality
// Run this in the browser console to test the storage bucket

async function testAttachments() {
  console.log('Testing attachments functionality...');
  
  // Test 1: Check if we can access the storage bucket
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    console.log('Available buckets:', buckets);
    console.log('Error:', error);
  } catch (err) {
    console.error('Error listing buckets:', err);
  }
  
  // Test 2: Check if attachments bucket exists
  try {
    const { data: bucket, error } = await supabase.storage.getBucket('attachments');
    console.log('Attachments bucket:', bucket);
    console.log('Error:', error);
  } catch (err) {
    console.error('Error getting attachments bucket:', err);
  }
  
  // Test 3: Check storage policies
  try {
    const { data: policies, error } = await supabase.storage.listBuckets();
    console.log('Storage policies:', policies);
    console.log('Error:', error);
  } catch (err) {
    console.error('Error checking policies:', err);
  }
  
  // Test 4: Check if we can list files in the bucket
  try {
    const { data: files, error } = await supabase.storage
      .from('attachments')
      .list();
    console.log('Files in attachments bucket:', files);
    console.log('Error:', error);
  } catch (err) {
    console.error('Error listing files:', err);
  }
}

// Run the test
testAttachments(); 