DROP POLICY IF EXISTS "Rooms are viewable by members" ON rooms;
DROP POLICY IF EXISTS "Authenticated users can create rooms" ON rooms;

CREATE POLICY "Authenticated users can view all rooms" ON rooms
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create rooms" ON rooms
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Room creators can update rooms" ON rooms
  FOR UPDATE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Room members are viewable by room members" ON room_members;
CREATE POLICY "Authenticated users can view room members" ON room_members
  FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users can join rooms" ON room_members;
CREATE POLICY "Users can join rooms" ON room_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Messages are viewable by room members" ON messages;
CREATE POLICY "Authenticated users can view messages" ON messages
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Room members can insert messages" ON messages;
CREATE POLICY "Authenticated users can insert messages" ON messages
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
