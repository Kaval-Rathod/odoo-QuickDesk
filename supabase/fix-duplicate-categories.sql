-- Fix duplicate categories issue
-- This script adds a unique constraint on the category name to prevent duplicates

-- Step 1: Remove any existing duplicate categories (keep the first one)
DELETE FROM public.categories 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM public.categories 
    GROUP BY name
);

-- Step 2: Add unique constraint on category name
ALTER TABLE public.categories 
ADD CONSTRAINT categories_name_unique UNIQUE (name);

-- Step 3: Re-insert default categories (this will now work properly with ON CONFLICT DO NOTHING)
INSERT INTO public.categories (name, description, color) VALUES
('General', 'General inquiries and questions', '#3B82F6'),
('Technical Support', 'Technical issues and problems', '#EF4444'),
('Feature Request', 'Requests for new features', '#10B981'),
('Bug Report', 'Reports of bugs or issues', '#F59E0B'),
('Account Issues', 'Account-related problems', '#8B5CF6'),
('Billing', 'Billing and payment questions', '#06B6D4')
ON CONFLICT (name) DO NOTHING; 