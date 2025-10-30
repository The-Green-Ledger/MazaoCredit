import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipients } = await req.json();
    // recipients format: [{ phoneNumber: "+254...", currencyCode: "KES", amount: "100" }]
    
    const AT_API_KEY = Deno.env.get('AFRICASTALKING_API_KEY');
    const AT_USERNAME = Deno.env.get('AFRICASTALKING_USERNAME');

    console.log('Sending airtime to:', recipients);

    const response = await fetch('https://api.sandbox.africastalking.com/version1/airtime/send', {
      method: 'POST',
      headers: {
        'apiKey': AT_API_KEY!,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        username: AT_USERNAME!,
        recipients: recipients,
      }),
    });

    const data = await response.json();
    console.log('Airtime Response:', data);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error sending airtime:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});