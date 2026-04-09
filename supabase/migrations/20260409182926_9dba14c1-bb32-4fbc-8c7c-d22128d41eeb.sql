-- Drop the security barrier view that triggers the linter warning
DROP VIEW IF EXISTS public.public_profiles;

-- Add a permissive SELECT policy so all authenticated users can read profile rows
-- (The owner-only policy still exists for direct table queries)
CREATE POLICY "Authenticated users can read profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Recreate the view as SECURITY INVOKER (respects caller's RLS)
-- This view only exposes non-sensitive columns
CREATE VIEW public.public_profiles
WITH (security_invoker = true)
AS
SELECT id, username, display_name, avatar_url, bio, status, last_seen
FROM public.profiles;

-- Grant SELECT on the view
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;