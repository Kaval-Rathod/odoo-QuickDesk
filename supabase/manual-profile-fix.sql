-- Manual Profile Creation Fix
-- Run this if users exist but don't have profiles

-- Create profiles for existing users who don't have them
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

-- Verify profiles were created
SELECT 
    au.id,
    au.email,
    p.full_name,
    p.role
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
ORDER BY au.created_at DESC; 