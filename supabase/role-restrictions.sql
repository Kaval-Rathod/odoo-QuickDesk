-- Role Restrictions for QuickDesk
-- This file documents the role restrictions implemented in the application

-- Add comments to the profiles table about role restrictions
COMMENT ON COLUMN public.profiles.role IS 'User role: end_user, support_agent, or admin. Note: Only administrators can change user roles. Users cannot change their own role.';

-- Verify current role distribution
SELECT 
    role,
    COUNT(*) as user_count
FROM public.profiles 
GROUP BY role 
ORDER BY role;

-- Show current admin users (should be limited)
SELECT 
    id,
    full_name,
    email,
    role,
    created_at
FROM public.profiles 
WHERE role = 'admin'
ORDER BY created_at DESC;

-- Note: The application now restricts role changes to administrators only
-- Users cannot change their own role through the profile settings interface
-- Only administrators can change user roles between 'end_user' and 'support_agent'
-- This ensures proper role management and security 