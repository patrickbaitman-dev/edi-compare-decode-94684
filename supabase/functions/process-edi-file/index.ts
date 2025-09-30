import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Segment {
  type: string;
  elements: string[];
}

function parseEDI(content: string): Segment[] {
  const segments: Segment[] = [];
  const lines = content.split('~').map(s => s.trim()).filter(Boolean);
  
  for (const line of lines) {
    const elements = line.split('*');
    if (elements.length > 0) {
      segments.push({
        type: elements[0],
        elements: elements.slice(1)
      });
    }
  }
  
  return segments;
}

function extractControlInfo(segments: Segment[]) {
  const st = segments.find(s => s.type === 'ST');
  const gs = segments.find(s => s.type === 'GS');
  const isa = segments.find(s => s.type === 'ISA');
  
  return {
    transactionType: st?.elements[0] || '',
    controlNumber: st?.elements[1] || '',
    senderId: isa?.elements[5]?.trim() || '',
    receiverId: isa?.elements[7]?.trim() || '',
    transactionDate: gs?.elements[3] ? parseEDIDate(gs.elements[3], gs.elements[4]) : null
  };
}

function parseEDIDate(date: string, time?: string): Date | null {
  try {
    // Format: YYYYMMDD or CCYYMMDD
    const year = date.substring(0, 4);
    const month = date.substring(4, 6);
    const day = date.substring(6, 8);
    return new Date(`${year}-${month}-${day}`);
  } catch {
    return null;
  }
}

async function process834(segments: Segment[], transactionId: string, supabase: any) {
  const members: any[] = [];
  let currentMember: any = null;
  
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    
    if (seg.type === 'INS') {
      // Start new member
      if (currentMember) members.push(currentMember);
      currentMember = {
        transaction_id: transactionId,
        status: seg.elements[1] === 'Y' ? 'active' : 'terminated',
        relationship: seg.elements[1] === 'Y' ? 'subscriber' : 'dependent'
      };
    } else if (seg.type === 'REF' && currentMember) {
      if (seg.elements[0] === '0F') {
        currentMember.member_id = seg.elements[1];
      } else if (seg.elements[0] === '1L') {
        currentMember.plan_code = seg.elements[1];
      }
    } else if (seg.type === 'NM1' && seg.elements[0] === 'IL' && currentMember) {
      currentMember.last_name = seg.elements[2];
      currentMember.first_name = seg.elements[3];
      if (seg.elements[7] === '34') {
        currentMember.ssn = seg.elements[8];
      }
    } else if (seg.type === 'N3' && currentMember) {
      currentMember.address_line1 = seg.elements[0];
      if (seg.elements[1]) currentMember.address_line2 = seg.elements[1];
    } else if (seg.type === 'N4' && currentMember) {
      currentMember.city = seg.elements[0];
      currentMember.state = seg.elements[1];
      currentMember.zip_code = seg.elements[2];
    } else if (seg.type === 'DMG' && currentMember) {
      if (seg.elements[0] === 'D8') {
        const dob = seg.elements[1];
        currentMember.date_of_birth = `${dob.substring(0, 4)}-${dob.substring(4, 6)}-${dob.substring(6, 8)}`;
      }
      currentMember.gender = seg.elements[2];
    } else if (seg.type === 'HD' && currentMember) {
      currentMember.coverage_level = seg.elements[2];
    } else if (seg.type === 'DTP' && seg.elements[0] === '348' && currentMember) {
      const effDate = seg.elements[2];
      currentMember.effective_date = `${effDate.substring(0, 4)}-${effDate.substring(4, 6)}-${effDate.substring(6, 8)}`;
    }
  }
  
  if (currentMember) members.push(currentMember);
  
  // Insert members
  if (members.length > 0) {
    const { error } = await supabase.from('edi_members').insert(members);
    if (error) throw error;
  }
  
  return { membersProcessed: members.length };
}

async function process820(segments: Segment[], transactionId: string, supabase: any) {
  const payments: any[] = [];
  let currentPayment: any = null;
  
  for (const seg of segments) {
    if (seg.type === 'BPR') {
      currentPayment = {
        transaction_id: transactionId,
        payment_amount: parseFloat(seg.elements[1] || '0'),
        payment_method: seg.elements[3],
        payment_date: seg.elements[15] ? parseEDIDate(seg.elements[15]) : new Date(),
        status: 'posted'
      };
    } else if (seg.type === 'TRN' && currentPayment) {
      currentPayment.reference_number = seg.elements[1];
    } else if (seg.type === 'N1' && currentPayment) {
      if (seg.elements[0] === 'PR') {
        currentPayment.payer_name = seg.elements[1];
      } else if (seg.elements[0] === 'PE') {
        currentPayment.payee_name = seg.elements[1];
      }
    } else if (seg.type === 'RMR' && currentPayment) {
      currentPayment.invoice_number = seg.elements[1];
      if (currentPayment.payment_amount === 0 && seg.elements[3]) {
        currentPayment.payment_amount = parseFloat(seg.elements[3]);
      }
    }
  }
  
  if (currentPayment) payments.push(currentPayment);
  
  // Insert payments
  if (payments.length > 0) {
    const { error } = await supabase.from('edi_payments').insert(payments);
    if (error) throw error;
  }
  
  return { paymentsProcessed: payments.length };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { file_id } = await req.json();
    
    // Get file
    const { data: file, error: fileError } = await supabase
      .from('edi_files')
      .select('*')
      .eq('id', file_id)
      .single();
    
    if (fileError || !file) throw new Error('File not found');
    
    // Update status to processing
    await supabase
      .from('edi_files')
      .update({ status: 'processing' })
      .eq('id', file_id);
    
    // Parse EDI
    const segments = parseEDI(file.file_content);
    const controlInfo = extractControlInfo(segments);
    
    // Create transaction record
    const { data: transaction, error: txError } = await supabase
      .from('edi_transactions')
      .insert({
        file_id: file.id,
        transaction_type: controlInfo.transactionType,
        control_number: controlInfo.controlNumber,
        sender_id: controlInfo.senderId,
        receiver_id: controlInfo.receiverId,
        transaction_date: controlInfo.transactionDate,
        segment_count: segments.length,
        raw_segments: segments,
        parsed_data: controlInfo
      })
      .select()
      .single();
    
    if (txError) throw txError;
    
    // Process based on type
    let result;
    if (file.file_type === '834') {
      result = await process834(segments, transaction.id, supabase);
    } else if (file.file_type === '820') {
      result = await process820(segments, transaction.id, supabase);
    } else {
      result = { message: 'Transaction type not fully implemented yet' };
    }
    
    // Update file status
    await supabase
      .from('edi_files')
      .update({ status: 'processed', processed_at: new Date().toISOString() })
      .eq('id', file_id);
    
    return new Response(
      JSON.stringify({
        success: true,
        file_id,
        transaction_id: transaction.id,
        result
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error processing EDI file:', error);
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
