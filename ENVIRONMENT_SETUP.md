# Environment Setup Guide

## Setting Up Environment Variables

This guide will help you set up the environment variables for the QuickDesk application.

### Step 1: Create Environment File

1. In your project root directory, create a file named `.env`
2. Copy the contents from `env.example` into your `.env` file:

```bash
VITE_SUPABASE_URL=https://cicneqfyxwomonvbcebx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpY25lcWZ5eHdvbW9udmJjZWJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMDU1MDMsImV4cCI6MjA2OTY4MTUwM30.Z-vy5iz79PtMfNe51bqUmCzxd-P_qWRtSFRoeCsgPeA
```

### Step 2: Verify Setup

After creating the `.env` file:

1. Restart your development server: `npm run dev`
2. The application should now use the environment variables instead of hardcoded credentials
3. Check the browser console to ensure no environment-related errors

### Step 3: Security Notes

- ✅ The `.env` file is already added to `.gitignore` to prevent committing secrets
- ✅ Environment variables are prefixed with `VITE_` to make them available in the browser
- ✅ The application will throw an error if environment variables are missing

### Troubleshooting

If you see errors about missing environment variables:

1. **Check file location**: Make sure `.env` is in the project root (same level as `package.json`)
2. **Check file format**: Ensure no spaces around the `=` sign
3. **Restart server**: Environment variables require a server restart to take effect
4. **Check spelling**: Ensure variable names match exactly: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### For Production

When deploying to production:

1. Set the environment variables in your hosting platform
2. Use the same variable names: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. Ensure the values are correct for your production environment

### Example .env File

Your `.env` file should look like this:

```env
VITE_SUPABASE_URL=https://cicneqfyxwomonvbcebx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpY25lcWZ5eHdvbW9udmJjZWJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMDU1MDMsImV4cCI6MjA2OTY4MTUwM30.Z-vy5iz79PtMfNe51bqUmCzxd-P_qWRtSFRoeCsgPeA
```

**Important**: Never commit your `.env` file to version control. It's already in `.gitignore` to prevent this. 