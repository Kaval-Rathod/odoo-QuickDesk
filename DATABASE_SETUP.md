# Database Setup Guide

## QuickDesk Database Schema Setup

This guide will help you set up the required database tables in your Supabase project.

### Step 1: Access Your Supabase Dashboard

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in to your account
3. Navigate to your project: `cicneqfyxwomonvbcebx`

### Step 2: Apply the Database Schema

1. In your Supabase dashboard, go to the **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Copy the entire contents of `supabase/schema.sql` and paste it into the editor
4. Click **"Run"** to execute the SQL

### Step 3: Verify the Setup

After running the SQL, you should see the following tables created:

- `profiles` - User profiles and roles
- `categories` - Ticket categories (with default categories already inserted)
- `tickets` - Main tickets table
- `ticket_comments` - Comments on tickets
- `ticket_attachments` - File attachments for tickets
- `ticket_votes` - Voting system for tickets

### Step 4: Test the Application

1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:8080`
3. You should now be able to:
   - Sign up for a new account
   - See categories in the dropdown when creating tickets
   - Create and view tickets

### Default Categories

The schema includes these default categories:
- General (Blue)
- Technical Support (Red)
- Feature Request (Green)
- Bug Report (Orange)
- Account Issues (Purple)
- Billing (Cyan)

### Troubleshooting

If you encounter any issues:

1. **Check the SQL execution**: Make sure all SQL commands executed successfully
2. **Verify tables exist**: Go to **Table Editor** in Supabase to confirm tables are created
3. **Check Row Level Security**: Ensure RLS policies are in place
4. **Test authentication**: Try signing up a new user to test the trigger

### Security Features

The schema includes:
- Row Level Security (RLS) policies for data protection
- Role-based access control (end_user, support_agent, admin)
- Automatic profile creation when users sign up
- Proper foreign key relationships

### Next Steps

Once the database is set up:
1. Test user registration and login
2. Create some test tickets
3. Explore the different user roles and permissions
4. Customize categories and settings as needed

For any issues, check the browser console for specific error messages and ensure your Supabase project URL and API keys are correctly configured in `src/integrations/supabase/client.ts`. 