SELECT * FROM rooms;

INSERT INTO rooms (name, description) VALUES 
  ('General', 'General discussion room'),
  ('Random', 'Random conversations'),
  ('Tech Talk', 'Technology discussions')
ON CONFLICT DO NOTHING;

SELECT id, username, full_name, avatar_url, is_online, created_at FROM profiles;

SELECT 
  au.id,
  au.email,
  au.created_at as auth_created_at,
  p.username,
  p.full_name,
  p.avatar_url,
  p.is_online
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
ORDER BY au.created_at;

SELECT 
  r.name as room_name,
  p.username,
  p.full_name,
  rm.joined_at
FROM room_members rm
JOIN rooms r ON rm.room_id = r.id
JOIN profiles p ON rm.user_id = p.id
ORDER BY r.name, rm.joined_at;

SELECT 
  r.name as room_name,
  COUNT(rm.user_id) as member_count
FROM rooms r
LEFT JOIN room_members rm ON r.id = rm.room_id
GROUP BY r.id, r.name
ORDER BY r.name;

