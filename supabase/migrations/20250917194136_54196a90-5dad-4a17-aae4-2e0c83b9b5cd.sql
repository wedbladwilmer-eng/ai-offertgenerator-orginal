-- Create RLS policies for the Mockups storage bucket to allow users to upload and access mockup images

-- Policy to allow users to upload their own mockup files
CREATE POLICY "Users can upload mockup images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'Mockups');

-- Policy to allow users to view mockup images
CREATE POLICY "Users can view mockup images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'Mockups');

-- Policy to allow users to update their own mockup files
CREATE POLICY "Users can update mockup images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'Mockups');

-- Policy to allow users to delete their own mockup files
CREATE POLICY "Users can delete mockup images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'Mockups');