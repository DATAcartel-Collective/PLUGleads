import { supabase } from '../supabaseClient';

const PHONE_KEYS = [
  'phone',
  'phone_number',
  'phone1',
  'phone_1',
  'phone2',
  'phone_2',
  'phone3',
  'phone_3',
  'mobile',
  'cell',
];

const ADDRESS_KEYS = ['address', 'property_address', 'street_address'];
const HEAT_KEYS = ['heat_score', 'score', 'lead_score', 'priority_score'];

const normalizeDigits = (value) => String(value || '').replace(/[^\d+]/g, '').trim();

const getValueByPartialKey = (row, keyCandidates) => {
  const rowKeys = Object.keys(row || {});
  for (const candidate of keyCandidates) {
    const exact = rowKeys.find((k) => k.toLowerCase() === candidate.toLowerCase());
    if (exact && row[exact]) return row[exact];
    const loose = rowKeys.find((k) =>
      k.toLowerCase().replace(/[\s_]/g, '').includes(candidate.toLowerCase().replace(/[\s_]/g, '')),
    );
    if (loose && row[loose]) return row[loose];
  }
  return null;
};

const extractPhoneNumbers = (row) => {
  const rowKeys = Object.keys(row || {});
  const numbers = [];

  for (const key of rowKeys) {
    const normalizedKey = key.toLowerCase().replace(/[\s_]/g, '');
    if (PHONE_KEYS.some((candidate) => normalizedKey.includes(candidate.replace(/_/g, '')))) {
      const value = normalizeDigits(row[key]);
      if (value) numbers.push(value);
    }
  }

  return [...new Set(numbers)];
};

export async function fetchLeadQueue() {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .in('status', ['NEW', 'IN_PROGRESS', 'NO_ANSWER', 'BUSY'])
    .order('next_action_ts', { ascending: true, nullsFirst: true })
    .order('heat_score', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function updateLeadStatus(leadId, status, patch = {}) {
  const { data, error } = await supabase
    .from('leads')
    .update({ status, ...patch })
    .eq('id', leadId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function incrementLeadPhoneIndex(leadId) {
  const { data, error } = await supabase.rpc('increment_phone_index', { p_lead_id: leadId });
  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}

export async function createInteractionLog({
  leadId,
  userId,
  actionType,
  durationSeconds = 0,
}) {
  const { error } = await supabase.from('interaction_log').insert({
    lead_id: leadId,
    user_id: userId,
    action_type: actionType,
    duration_seconds: durationSeconds,
  });

  if (error) throw error;
}

export async function startProxyCallSession(leadId, phoneIndex = 0) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error('User not authenticated.');

  const tenantId = await resolveTenantFromSession();
  if (!tenantId) throw new Error('Missing tenant context for call session.');

  const { data, error } = await supabase
    .from('call_sessions')
    .insert({
      tenant_id: tenantId,
      lead_id: leadId,
      user_id: user.id,
      dial_attempt_index: phoneIndex,
      status: 'initiated',
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function completeProxyCallSession(sessionId, status) {
  const { data, error } = await supabase
    .from('call_sessions')
    .update({
      status,
      ended_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getReusableFollowUpTemplate() {
  const tenantId = await resolveTenantFromSession();
  if (!tenantId) return null;

  const { data, error } = await supabase
    .from('message_templates')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('template_key', 'default_follow_up_sms')
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function saveReusableFollowUpTemplate(templateBody) {
  const tenantId = await resolveTenantFromSession();
  if (!tenantId) throw new Error('Missing tenant context for template save.');

  const payload = {
    tenant_id: tenantId,
    template_key: 'default_follow_up_sms',
    template_body: templateBody,
  };

  const { data, error } = await supabase
    .from('message_templates')
    .upsert(payload, { onConflict: 'tenant_id,template_key' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function logOutboundMessage({
  leadId,
  callSessionId = null,
  channel = 'sms',
  direction = 'outbound',
  status = 'queued',
  messageBody,
  providerMessageId = null,
}) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error('User not authenticated.');

  const tenantId = await resolveTenantFromSession();
  if (!tenantId) throw new Error('Missing tenant context for outbound log.');

  const { data, error } = await supabase
    .from('outbound_messages')
    .insert({
      tenant_id: tenantId,
      lead_id: leadId,
      user_id: user.id,
      call_session_id: callSessionId,
      channel,
      direction,
      status,
      message_body: messageBody,
      provider_message_id: providerMessageId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function processAndStoreLead(rawLeadData, tenantId) {
  const address = getValueByPartialKey(rawLeadData, ADDRESS_KEYS);
  const phones = extractPhoneNumbers(rawLeadData);
  const heatRaw = getValueByPartialKey(rawLeadData, HEAT_KEYS);
  const parsedHeat = Number.parseInt(String(heatRaw || ''), 10);
  const heatScore = Number.isFinite(parsedHeat) ? Math.min(Math.max(parsedHeat, 0), 100) : 50;

  if (!tenantId) {
    throw new Error('Missing tenant id for lead import.');
  }
  if (!address) {
    throw new Error('Row is missing an address.');
  }
  if (phones.length === 0) {
    throw new Error('Row is missing phone numbers.');
  }

  const payload = {
    tenant_id: tenantId,
    address: String(address).trim(),
    heat_score: heatScore,
    status: 'NEW',
    phone_numbers: phones,
    current_phone_index: 0,
  };

  const { data, error } = await supabase
    .from('leads')
    .upsert(payload, { onConflict: 'tenant_id,address' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function resolveTenantFromSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) throw error;

  const tenantId = session?.user?.app_metadata?.tenant_id || session?.user?.user_metadata?.tenant_id || null;
  return tenantId;
}
