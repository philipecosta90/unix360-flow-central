-- Create helper function to get user by email (more efficient than listing all users)
CREATE OR REPLACE FUNCTION public.get_user_by_email(user_email text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM auth.users WHERE email = user_email LIMIT 1;
$$;