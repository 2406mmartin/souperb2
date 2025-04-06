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
  soup_id: string;
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
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    db: {
      schema: 'public'
    }
  }
);

// Helper function to handle database operations
export async function handleDatabaseOperation<T>(
  operation: Promise<{ data: T | null; error: any }>
): Promise<T> {
  const { data, error } = await operation;
  
  if (error) {
    console.error('Database operation failed:', error);
    throw new Error(`Database operation failed: ${error.message}`);
  }
  
  if (!data) {
    throw new Error('No data returned from database operation');
  }
  
  return data;
}

// Database interface
export interface Database {
  public: {
    Tables: {
      soup_shelves: {
        Row: SoupShelf;
        Insert: Omit<SoupShelf, 'id' | 'created_at' | 'profiles'>;
        Update: Partial<Omit<SoupShelf, 'id' | 'created_at' | 'profiles'>>;
      };
      soups: {
        Row: Soup;
        Insert: Omit<Soup, 'id' | 'created_at'>;
        Update: Partial<Omit<Soup, 'id' | 'created_at'>>;
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
  created_at: string;
  name: string;
  description: string;
  ingredients: string[];
  preparation_time: string;
  dietary_restrictions: string[];
  symptoms_addressed: string[];
  consistency: string;
  spiciness: string;
  appetite_level: string;
};