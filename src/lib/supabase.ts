import { createClient } from "@supabase/supabase-js";

// Types for database schema
export type SoupShelf = {
  id: string;
  created_at: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  likes_count: number;
  profiles?: {
    username: string;
  };
};

export type SoupInShelf = {
  id: string;
  created_at: string;
  shelf_id: string;
  name: string;
  description: string | null;
  added_at: string;
};

export type ShelfLike = {
  id: string;
  created_at: string;
  user_id: string;
  shelf_id: string;
};

// Create Supabase client
export const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
    },
  }
);

// Database interface
export interface Database {
  public: {
    Tables: {
      soup_shelves: {
        Row: SoupShelf;
        Insert: Omit<SoupShelf, 'id' | 'created_at' | 'profiles'>;
        Update: Partial<Omit<SoupShelf, 'id' | 'created_at' | 'profiles'>>;
      };
      soups_in_shelf: {
        Row: SoupInShelf;
        Insert: Omit<SoupInShelf, 'id' | 'created_at'>;
        Update: Partial<Omit<SoupInShelf, 'id' | 'created_at'>>;
      };
      shelf_likes: {
        Row: ShelfLike;
        Insert: Omit<ShelfLike, 'id' | 'created_at'>;
        Update: Partial<Omit<ShelfLike, 'id' | 'created_at'>>;
      };
    };
  };
};

// Database types
export type Soup = {
  id: string;
  name: string;
  description: string;
  created_at: string;
  user_id: string;
  is_public: boolean;
  ingredients?: string[];
  preparation_time?: string;
  dietary_restrictions?: string[];
  symptoms_addressed?: string[];
};