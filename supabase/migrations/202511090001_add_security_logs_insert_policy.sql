-- Allow the frontend to write security log entries while keeping read access restricted.

CREATE POLICY "Clients can insert security logs"
  ON public.security_logs
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);


