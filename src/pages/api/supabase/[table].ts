import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const GET: APIRoute = async ({ params, request }) => {
  const { table } = params;
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  const column = url.searchParams.get('column');
  const value = url.searchParams.get('value');
  const column2 = url.searchParams.get('column2');
  const value2 = url.searchParams.get('value2');

  if (!table) {
    return new Response(JSON.stringify({ error: 'Table name is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    let query = supabase
      .from(table)
      .select('*');

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (column && value) {
      query = query.eq(column, value);
    }

    if (column2 && value2) {
      query = query.eq(column2, value2);
    }

    const { data, error } = await query.single();

    if (error) {
      // If no record found, return empty data instead of error
      if (error.code === 'PGRST116') {
        return new Response(JSON.stringify({ data: null }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      throw error;
    }

    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Database error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ params, request }) => {
  const { table } = params;
  const body = await request.json();

  if (!table) {
    return new Response(JSON.stringify({ error: 'Table name is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // For soups and soups_in_shelf tables, we don't check for existing records
    if (table === 'soups' || table === 'soups_in_shelf') {
      const { data, error } = await supabase
        .from(table)
        .insert(body)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return new Response(JSON.stringify({ data }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // For other tables, check for existing records
    const { data: existingData, error: checkError } = await supabase
      .from(table)
      .select('*')
      .eq('user_id', body.user_id)
      .eq('name', body.name)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingData) {
      return new Response(JSON.stringify({ data: existingData }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // If record doesn't exist, create it
    const { data, error } = await supabase
      .from(table)
      .insert(body)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Database error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}; 