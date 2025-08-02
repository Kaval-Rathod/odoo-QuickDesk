-- Create Admin User
-- This will update your existing user to admin role

-- Option 1: Update your current user to admin
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'sosiy44367@dekpal.com';

-- Option 2: Create a new admin user (if you want to keep your current user as end_user)
-- INSERT INTO public.profiles (id, full_name, email, role)
-- VALUES (
--     gen_random_uuid(),
--     'Admin User',
--     'admin@quickdesk.com',
--     'admin'
-- );

-- Verify the change
SELECT id, full_name, email, role, created_at 
FROM public.profiles 
ORDER BY created_at DESC; 