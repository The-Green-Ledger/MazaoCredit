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
    const formData = await req.formData();
    const sessionId = formData.get('sessionId');
    const serviceCode = formData.get('serviceCode');
    const phoneNumber = formData.get('phoneNumber');
    const textValue = formData.get('text');
    const text = typeof textValue === 'string' ? textValue : '';

    console.log('USSD Request:', { sessionId, serviceCode, phoneNumber, text });

    let response = '';

    if (text === '') {
      // First interaction
      response = 'CON Welcome to Sprout & Sell\n';
      response += '1. List Produce\n';
      response += '2. Check Market Prices\n';
      response += '3. Financial Score\n';
      response += '4. Insurance Info';
    } else if (text === '1') {
      response = 'CON Enter produce name:';
    } else if (text.startsWith('1*')) {
      const produce = text.split('*')[1];
      response = `CON Enter quantity (kg) for ${produce}:`;
    } else if (text.match(/^1\*[^*]+\*\d+$/)) {
      const parts = text.split('*');
      const produce = parts[1];
      const quantity = parts[2];
      response = `END Your ${produce} (${quantity}kg) has been listed successfully!`;
    } else if (text === '2') {
      response = 'END Current Market Prices:\nTomatoes: KES 80/kg\nCabbage: KES 60/kg\nMaize: KES 45/kg';
    } else if (text === '3') {
      response = 'END Your Financial Readiness Score: 78/100\nTransaction History: Excellent\nClimate Risk: Moderate';
    } else if (text === '4') {
      response = 'END Parametric Insurance:\nHailstorm Cover: KES 800/mo\nPest Coverage: KES 500/mo\nCall 0700123456 for more info';
    } else {
      response = 'END Invalid option. Please try again.';
    }

    return new Response(response, {
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response('END Service temporarily unavailable', {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
    });
  }
});