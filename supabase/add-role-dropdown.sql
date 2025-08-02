-- Add Role Dropdown to Profiles Table
-- This will make the role column show a dropdown in Supabase Table Editor

-- First, let's make sure we have the correct constraint
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add the role constraint with dropdown values
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('end_user', 'support_agent', 'admin'));

-- Update any existing invalid roles to 'end_user'
UPDATE public.profiles 
SET role = 'end_user' 
WHERE role NOT IN ('end_user', 'support_agent', 'admin') OR role IS NULL;

-- Add a comment to the role column for better documentation
COMMENT ON COLUMN public.profiles.role IS 'User role: end_user, support_agent, or admin';

-- Verify the setup
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    check_clause
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'role';

-- Show current roles
SELECT id, full_name, email, role, created_at 
FROM public.profiles 
ORDER BY created_at DESC; 