
-- Part 1: Add is_read to ride_messages
ALTER TABLE public.ride_messages ADD COLUMN is_read boolean NOT NULL DEFAULT false;

-- Part 2: Create device_tokens table for push notifications
CREATE TABLE public.device_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token text NOT NULL,
  platform text NOT NULL DEFAULT 'web',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, token)
);

ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own tokens"
  ON public.device_tokens FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all tokens"
  ON public.device_tokens FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_device_tokens_updated_at
  BEFORE UPDATE ON public.device_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS policy for users to update is_read on messages they receive
CREATE POLICY "Users can mark messages as read for their bookings"
  ON public.ride_messages FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM bookings WHERE bookings.id = ride_messages.booking_id AND bookings.user_id = auth.uid()
  ));

CREATE POLICY "Drivers can mark messages as read for their shuttle bookings"
  ON public.ride_messages FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM bookings b JOIN shuttles s ON s.id = b.shuttle_id
    WHERE b.id = ride_messages.booking_id AND s.driver_id = auth.uid()
  ));
