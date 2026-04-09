
-- Create storage bucket for driver documents
INSERT INTO storage.buckets (id, name, public) VALUES ('driver-documents', 'driver-documents', true);

-- Storage policies
CREATE POLICY "Anyone can view driver documents" ON storage.objects FOR SELECT USING (bucket_id = 'driver-documents');

CREATE POLICY "Authenticated users can upload driver documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'driver-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own driver documents" ON storage.objects FOR UPDATE USING (bucket_id = 'driver-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own driver documents" ON storage.objects FOR DELETE USING (bucket_id = 'driver-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add document URL columns to driver_applications
ALTER TABLE public.driver_applications
  ADD COLUMN IF NOT EXISTS id_front_url text,
  ADD COLUMN IF NOT EXISTS id_back_url text,
  ADD COLUMN IF NOT EXISTS driving_license_url text,
  ADD COLUMN IF NOT EXISTS car_license_url text,
  ADD COLUMN IF NOT EXISTS criminal_record_url text,
  ADD COLUMN IF NOT EXISTS was_uber_driver boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS uber_proof_url text,
  ADD COLUMN IF NOT EXISTS phone text;
