-- Optional: seed some members (safe idempotent)
insert into public.members (employee_id, name) values
  ('17006', 'Md. Istiaqe Ahmed'),
  ('17012', 'Md. Keramot Ali'),
  ('17057', 'MD. Ibrahim Khalil'),
  ('17030', 'Mehedi Hasan Babu'),
  ('17052', 'MD. Sagor'),
  ('17092', 'Shishir Chowdhory'),
  ('17107', 'Md Rifat Hossain'),
  ('17112', 'Md. Taufiqul Islam Tomal'),
  ('17201', 'Kazi Pial Hasan Borno'),
  ('17196', 'Tanzir Ibne Ali'),
  ('17263', 'Anika Ivnath'),
  ('17261', 'Shah. Afsar Ali'),
  ('17264', 'Md Rahatul Islam'),
  ('17266', 'Nayon das'),
  ('17275', 'Md Anas Alif')
on conflict (employee_id) do nothing;
