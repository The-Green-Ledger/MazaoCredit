import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.30.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: 'Missing server env vars' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Only POST allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { listing_id } = await req.json();
    if (!listing_id) {
      return new Response(JSON.stringify({ error: 'listing_id is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 1) Fetch average rating for listing
    const { data: agg, error: aggErr } = await supabase
      .from('produce_reviews')
      .select('rating')
      .eq('listing_id', listing_id);

    if (aggErr) {
      return new Response(JSON.stringify({ error: aggErr.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const ratings = (agg || []).map(r => (r as any).rating as number);
    const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

    // 2) Determine new status based on thresholds
    let newStatus: 'verified' | 'flagged' | undefined = undefined;
    if (avg !== null) {
      if (avg < 3) newStatus = 'flagged';
      else newStatus = 'verified';
    }

    // 3) Update listing
    const { error: updErr } = await supabase
      .from('produce_listings')
      .update({ buyer_feedback_score: avg, status: newStatus })
      .eq('id', listing_id);

    if (updErr) {
      return new Response(JSON.stringify({ error: updErr.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ listing_id, average: avg, status: newStatus, count: ratings.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
