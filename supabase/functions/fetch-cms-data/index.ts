import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sample CMS test data (834 and 820 format)
const SAMPLE_834_FILE = `ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *250930*1200*^*00501*000000001*0*P*:~
GS*BE*SENDER*RECEIVER*20250930*1200*1*X*005010X220A1~
ST*834*0001*005010X220A1~
BGN*00*12345*20250930*120000****2~
N1*P5*ACME HEALTH PLAN*FI*123456789~
N1*IN*EMPLOYER GROUP*FI*987654321~
INS*Y*18*025*28*A***FT~
REF*0F*MEM123456789~
REF*1L*GRP001~
NM1*IL*1*SMITH*JOHN*A***34*987654321~
PER*IP**HP*5551234567~
N3*123 MAIN ST~
N4*ANYTOWN*CA*90001~
DMG*D8*19850615*M~
HD*025**HLT*EMP~
DTP*348*D8*20250101~
REF*1L*PLAN001~
INS*N*01*025*28*A***PT~
REF*0F*DEP987654321~
NM1*IL*1*SMITH*JANE*B***34*123456789~
N3*123 MAIN ST~
N4*ANYTOWN*CA*90001~
DMG*D8*19880420*F~
HD*025**HLT*DEP~
DTP*348*D8*20250101~
INS*N*01*025*28*A***CH~
REF*0F*DEP123456780~
NM1*IL*1*SMITH*ROBERT*C***34*234567890~
N3*123 MAIN ST~
N4*ANYTOWN*CA*90001~
DMG*D8*20150310*M~
HD*025**HLT*DEP~
DTP*348*D8*20250101~
SE*32*0001~
GE*1*1~
IEA*1*000000001~`;

const SAMPLE_820_FILE = `ISA*00*          *00*          *ZZ*PAYER          *ZZ*PAYEE          *250930*1200*^*00501*000000002*0*P*:~
GS*RA*PAYER*PAYEE*20250930*1200*2*X*005010~
ST*820*0002~
BPR*C*125000.00*C*ACH*CTX*01*021000021*DA*123456789**01*021000022*DA*987654321**20250930~
TRN*1*PAY123456*1234567890~
N1*PR*ACME HEALTH PLAN*FI*123456789~
N1*PE*PROVIDER GROUP*FI*987654321~
ENT*1*PR~
RMR*IV*INV123456**125000.00~
DTM*097*20250930~
SE*9*0002~
GE*1*2~
IEA*1*000000002~`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching CMS test data...');

    // Insert 834 sample file
    const { data: file834, error: error834 } = await supabase
      .from('edi_files')
      .insert({
        file_name: 'CMS_834_SAMPLE_001.txt',
        file_type: '834',
        file_size: SAMPLE_834_FILE.length,
        file_content: SAMPLE_834_FILE,
        source: 'cms_test',
        status: 'pending'
      })
      .select()
      .single();

    if (error834) throw error834;

    // Insert 820 sample file
    const { data: file820, error: error820 } = await supabase
      .from('edi_files')
      .insert({
        file_name: 'CMS_820_SAMPLE_001.txt',
        file_type: '820',
        file_size: SAMPLE_820_FILE.length,
        file_content: SAMPLE_820_FILE,
        source: 'cms_test',
        status: 'pending'
      })
      .select()
      .single();

    if (error820) throw error820;

    console.log('CMS test data inserted successfully');

    // Trigger processing for both files
    const processPromises = [file834, file820].map(async (file) => {
      const processUrl = `${supabaseUrl}/functions/v1/process-edi-file`;
      const response = await fetch(processUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ file_id: file.id })
      });
      return response.json();
    });

    const processResults = await Promise.all(processPromises);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'CMS test data fetched and processing started',
        files: [file834, file820],
        processing: processResults
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error fetching CMS data:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
