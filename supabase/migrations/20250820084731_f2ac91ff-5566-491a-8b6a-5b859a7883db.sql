-- Drop the old constraint that doesn't include 'uploader'
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS valid_roles;

-- The profiles_role_check constraint already includes 'uploader', so no need to add another one