-- Atomic cover photo swap: sets is_cover=true for p_photo_id and false for all others
-- in the same property in a single UPDATE, eliminating the two-step race condition.
CREATE OR REPLACE FUNCTION set_cover_photo(p_property_id uuid, p_photo_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE property_photos
  SET is_cover = (id = p_photo_id)
  WHERE property_id = p_property_id;
END;
$$;
