# Duplicate Categories Fix

## Problem
When creating tickets, users were seeing duplicate categories in the dropdown. This was happening because:

1. The `categories` table didn't have a unique constraint on the `name` field
2. Multiple SQL setup scripts were being run, creating duplicate entries
3. The `ON CONFLICT DO NOTHING` clause wasn't working because there was no unique constraint to conflict with

## Solution

### 1. Database Schema Updates
- Added `UNIQUE` constraint to the `name` field in the `categories` table
- Updated all SQL schema files to include this constraint
- Changed `ON CONFLICT DO NOTHING` to `ON CONFLICT (name) DO NOTHING` to properly handle conflicts

### 2. Code Updates
- Updated the `AdminCategories.tsx` component to handle unique constraint violations
- Added proper error handling for duplicate category names

### 3. Migration Script
Created `supabase/fix-duplicate-categories.sql` to:
- Remove existing duplicate categories (keeping the first occurrence)
- Add the unique constraint to prevent future duplicates
- Re-insert default categories with proper conflict handling

## Files Modified

### Database Schema Files
- `supabase/complete-setup.sql`
- `supabase/schema.sql`
- `supabase/schema-simple.sql`
- `supabase/fix-duplicate-categories.sql` (new)

### Application Code
- `src/pages/AdminCategories.tsx`

## How to Apply the Fix

1. **For existing databases with duplicates:**
   ```sql
   -- Run the migration script
   \i supabase/fix-duplicate-categories.sql
   ```

2. **For new databases:**
   - The updated schema files will automatically prevent duplicates

## Testing
- Create a new ticket and verify only one instance of each category appears
- Try to create a duplicate category name in the admin panel and verify proper error handling
- Verify that existing tickets still work correctly

## Prevention
- All future category creation will be prevented if a category with the same name already exists
- The unique constraint ensures data integrity at the database level 