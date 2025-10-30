import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.30.6";
// Mock SMS out: log. Real system should call Africa's Talking SMS API.

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const formData = await req.formData();
    const text = formData.get('text'); // incoming SMS body
    if (typeof text !== 'string' || !text.startsWith('REVIEW ')) {
      return new Response('END Only REVIEW update commands allowed. Use: REVIEW <LISTING_ID> APPROVE or SUSPEND', {
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // Parse: REVIEW <LISTING_ID> APPROVE  or  REVIEW <LISTING_ID> SUSPEND
    const [_, listingId, action] = text.trim().split(/\s+/);
    if (!listingId || !["APPROVE", "SUSPEND"].includes(action?.toUpperCase())) {
      return new Response('END Invalid format. Use: REVIEW <LISTING_ID> APPROVE or SUSPEND', {
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }
    const newStatus = action.toUpperCase() === 'APPROVE' ? 'verified' : 'suspended';
    // Update DB
    const { error } = await supabase.from('produce_listings').update({ status: newStatus }).eq('id', listingId);
    if (error) {
      return new Response(`END Error updating listing: ${error.message}`, {
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }
    console.log(`[SMS QUEUE MOCK] Sent confirmation: Listing ${listingId} updated to ${newStatus}`);
    return new Response(`END Listing ${listingId} marked as ${newStatus}. Farmer notified.`, {
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
    });
  } catch (error) {
    return new Response('END Internal error', {
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
    });
  }
});