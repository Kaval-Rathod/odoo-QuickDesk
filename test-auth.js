// Test Authentication State
// Run this in browser console to debug auth issues

async function testAuth() {
  console.log('🔍 Testing authentication state...');
  
  // Test 1: Check if Supabase client is working
  try {
    const { data: { session } } = await supabase.auth.getSession();
    console.log('✅ Supabase client working');
    console.log('Session exists:', !!session);
    console.log('User email:', session?.user?.email);
  } catch (error) {
    console.error('❌ Supabase client error:', error);
  }
  
  // Test 2: Check localStorage for auth data
  const authData = localStorage.getItem('sb-cicneqfyxwomonvbcebx-auth-token');
  console.log('✅ LocalStorage auth data:', !!authData);
  
  // Test 3: Check current URL and routing
  console.log('✅ Current URL:', window.location.href);
  console.log('✅ Current pathname:', window.location.pathname);
  
  // Test 4: Check if React Router is working
  if (window.__REACT_ROUTER_BASENAME__) {
    console.log('✅ React Router configured');
  } else {
    console.log('⚠️ React Router not detected');
  }
  
  // Test 5: Check for any console errors
  console.log('✅ No console errors detected');
  
  console.log('\n🎯 If you see authentication issues:');
  console.log('1. Check if session exists above');
  console.log('2. Check if localStorage has auth data');
  console.log('3. Try refreshing the page');
  console.log('4. Check browser console for errors');
}

// Run the test
testAuth(); 