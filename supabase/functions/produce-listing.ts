// Deno Edge Function for /api/produce-listing (Supabase Functions)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.30.6";
import { mockAiCheckForListing, checkPlausibilityAndSeason, mockTrustScore } from "../../../src/lib/utils.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data = await req.json();
    // Required fields: farmer_id, name, quantity_kg, description (etc.)
    const { farmer_id, name, quantity_kg, description, image_url, voice_meta, created_channel } = data;
    if (!farmer_id || !name || !quantity_kg) {
      return new Response(JSON.stringify({ error: "Missing required fields." }), { status: 400, headers: corsHeaders });
    }

    // 1. Run AI/logic checks
    const aiResult = mockAiCheckForListing({ name, imageUrl: image_url, voiceText: voice_meta, description });
    // 2. Plausibility/seasonal checks (region, month mock)
    const farmerProfile = {
      farm_size_ha: 0.25, // TODO: fetch real profile
      main_crop: name,
      region: "Central",
      yield_history: { [name.toLowerCase()]: [60] },
    };
    const now = new Date();
    const plausibility_flags = checkPlausibilityAndSeason(
      { name, quantity_kg: Number(quantity_kg) },
      farmerProfile,
      now.getMonth() + 1
    );
    // 3. Trust Score
    const trust_score = mockTrustScore(farmer_id);
    // 4. Status logic
    let status = "verified";
    if (plausibility_flags.length || (aiResult.flags && aiResult.flags.length)) {
      status = trust_score < 60 ? "pending_review" : "flagged";
    } else if (trust_score < 50) {
      status = "pending_review";
    }

    // 5. Insert DB
    const { error, data: inserted } = await supabase.from('produce_listings').insert({
      farmer_id, name, description,
      quantity_kg: Number(quantity_kg),
      status,
      ai_classification: aiResult.ai_classification,
      quality_score: aiResult.quality_score,
      plausibility_flags,
      trust_score,
      created_channel: created_channel || 'web',
      image_url,
      voice_meta,
      audited: false,
      buyer_feedback_score: null,
      location: null,
      grade: null,
      geolocation_status: 'unknown',
      historical_yield_flag: null,
    }).select().single();
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }

    // 6. Respond with results and warnings
    return new Response(
      JSON.stringify({
        listing: inserted,
        ai_flags: aiResult.flags,
        plausibility_flags,
        trust_score,
        status
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
