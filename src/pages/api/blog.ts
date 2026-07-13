import type { APIRoute } from 'astro';
import { readFileSync } from 'fs';

export const GET: APIRoute = async () => {
  try {
    const supabaseUrl = 'https://qhgxffazypogelvclyjn.supabase.co';
    
    // Ler service key do vercel.json (disponivel no servidor)
    let supabaseKey = '';
    try {
      const vercel = JSON.parse(readFileSync('/home/pc/VETRA_REPO/web/vercel.json', 'utf-8'));
      supabaseKey = vercel.env.SUPABASE_SERVICE_KEY;
    } catch (e) {
      return new Response(JSON.stringify({ posts: [] }));
    }

    const r = await fetch(supabaseUrl + '/rest/v1/blog_posts?select=title,slug,description,created_at,category&order=created_at.desc&limit=3', {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
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
