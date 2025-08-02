-- Make Current User Admin
-- Run this to make your user an admin

UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'sosiy44367@dekpal.com';

-- Verify the change
SELECT id, full_name, email, role, created_at 
FROM public.profiles; 