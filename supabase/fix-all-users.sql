-- Fix All Users - Create profiles for all existing users
-- This will ensure all users have profiles

-- Create profiles for all existing auth users
INSERT INTO public.profiles (id, full_name, email, role)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'full_name', 'User'),
    au.email,
    'end_user'
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Show all users and their profiles
SELECT 
    au.id,
    au.email,
    p.full_name,
    p.role,
    CASE WHEN p.id IS NOT NULL THEN 'Has Profile' ELSE 'Missing Profile' END as profile_status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
ORDER BY au.created_at DESC; 