import type { APIRoute } from 'astro';

const SUPABASE_URL = 'https://qhgxffazypogelvclyjn.supabase.co';
const SUPABASE_KEY = 'QfvT+dDMQqloq4ztvVIfhobF8rYWbmE4O/uA3AMAKUBRkBtAYgSQChOdxj+StEyAnkxwZvGG5F57v+wZ0qHQ1A==';

export const GET: APIRoute = async () => {
  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/blog_posts?select=title,slug,description,created_at,category&order=created_at.desc&limit=3', {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY },
    });

    if (!r.ok) {
      return new Response(JSON.stringify({ posts: [] }));
    }

    const posts = await r.json();
    return new Response(JSON.stringify({ posts }));
  } catch (e) {
    return new Response(JSON.stringify({ posts: [] }));
  }
};
