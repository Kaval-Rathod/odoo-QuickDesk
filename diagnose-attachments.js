// Diagnostic script for attachment issues
// Run this in your browser console to identify the problem

async function diagnoseAttachments() {
  console.log('🔍 Diagnosing attachment issues...');
  
  // Check 1: Supabase connection
  console.log('\n1️⃣ Checking Supabase connection...');
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('❌ Auth error:', error);
      return;
    }
    if (!user) {
      console.error('❌ No authenticated user found');
      return;
    }
    console.log('✅ User authenticated:', user.email);
  } catch (err) {
    console.error('❌ Connection error:', err);
    return;
  }
  
  // Check 2: Storage bucket
  console.log('\n2️⃣ Checking storage bucket...');
  try {
    const { data: bucket, error } = await supabase.storage.getBucket('attachments');
    if (error) {
      console.error('❌ Bucket error:', error);
      console.log('💡 Solution: Run the fix-attachments-complete.sql script');
    } else {
      console.log('✅ Storage bucket found:', bucket);
    }
  } catch (err) {
    console.error('❌ Storage error:', err);
  }
  
  // Check 3: Database table
  console.log('\n3️⃣ Checking database table...');
  try {
    const { data, error } = await supabase
      .from('ticket_attachments')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Database table error:', error);
      console.log('💡 Solution: Run the fix-attachments-complete.sql script');
    } else {
      console.log('✅ Database table accessible');
    }
  } catch (err) {
    console.error('❌ Database error:', err);
  }
  
  // Check 4: File upload test
  console.log('\n4️⃣ Testing file upload permissions...');
  try {
    const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const { error } = await supabase.storage
      .from('attachments')
      .upload('test/test.txt', testFile);
    
    if (error) {
      console.error('❌ Upload permission error:', error);
      console.log('💡 Solution: Check storage policies in Supabase dashboard');
    } else {
      console.log('✅ Upload permissions working');
      
      // Clean up test file
      await supabase.storage
        .from('attachments')
        .remove(['test/test.txt']);
    }
  } catch (err) {
    console.error('❌ Upload test error:', err);
  }
  
  // Check 5: Environment variables
  console.log('\n5️⃣ Checking environment variables...');
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables');
    console.log('💡 Check your .env file');
  } else {
    console.log('✅ Environment variables configured');
  }
  
  console.log('\n🎯 Common Solutions:');
  console.log('1. Run the fix-attachments-complete.sql script in Supabase SQL Editor');
  console.log('2. Check that your .env file has correct Supabase credentials');
  console.log('3. Ensure you are logged in to the application');
  console.log('4. Check browser console for specific error messages');
}

// Run the diagnosis
diagnoseAttachments(); 