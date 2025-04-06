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

export const POST: APIRoute = async ({ request, params }) => {
  const table = params.table;
  const data = await request.json();

  try {
    // For soup_shelves table, handle response differently
    if (table === 'soup_shelves') {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // For soups table, ensure we return the created soup
    if (table === 'soups') {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (!result) {
        return new Response(JSON.stringify({ error: 'No data returned from soup creation' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // For soups_in_shelf table, handle response differently
    if (table === 'soups_in_shelf') {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // For other tables, use standard approach
    const { data: result, error } = await supabase
      .from(table as string)
      .insert(data)
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PATCH: APIRoute = async ({ params, request }) => {
  const { table } = params;
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  const value = url.searchParams.get('value');

  if (!table) {
    return new Response(JSON.stringify({ error: 'Table name is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { user_id, ...updateData } = body;

    // For soup_shelves table, handle response differently
    if (table === 'soup_shelves') {
      if (!value) {
        return new Response(JSON.stringify({ error: 'Shelf ID is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // First get the current shelf data
      const { data: currentShelf, error: getError } = await supabase
        .from(table)
        .select('likes_count')
        .eq('id', value)
        .single();

      if (getError) {
        throw getError;
      }

      // Update the shelf with the new likes count
      const { data, error } = await supabase
        .from(table)
        .update({ likes_count: (currentShelf?.likes_count || 0) + (updateData.likes_count || 0) })
        .eq('id', value)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return new Response(JSON.stringify({ data, error: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // For other tables, use standard approach
    let query = supabase.from(table).update(updateData);

    if (value) {
      query = query.eq('id', value);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ data, error: null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in PATCH handler:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  const { table } = params;
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  const column = url.searchParams.get('column');
  const value = url.searchParams.get('value');

  if (!table) {
    return new Response(JSON.stringify({ error: 'Table name is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    let query = supabase.from(table).delete();

    if (column && value) {
      query = query.eq(column, value);
    }

    const { error } = await query;

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ data: null, error: null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}; 