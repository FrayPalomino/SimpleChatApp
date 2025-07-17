export interface Profile {
    id: string
    username: string
    full_name: string | null
    avatar_url: string | null
    is_online: boolean
    last_seen: string
    created_at: string
    updated_at: string
  }
  
  export interface Room {
    id: string
    name: string
    description: string | null
    created_by: string | null
    created_at: string
    updated_at: string
  }
  
  export interface Message {
    id: string
    room_id: string
    user_id: string
    content: string
    created_at: string
    profiles: Profile
  }
  
  export interface RoomMember {
    id: string
    room_id: string
    user_id: string
    joined_at: string
    profiles: Profile
  }
  