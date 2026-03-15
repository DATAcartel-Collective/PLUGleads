import axios from 'axios';

export async function initiateSignalWireCall({ leadId, tenantId, sessionId, phoneIndex }) {
  const relayEndpoint = import.meta.env.VITE_SIGNALWIRE_RELAY_ENDPOINT;

  if (!relayEndpoint) {
    throw new Error(
      'Missing VITE_SIGNALWIRE_RELAY_ENDPOINT. Proxy dialing is required for contractor privacy.',
    );
  }

  const { data } = await axios.post(relayEndpoint, {
    leadId,
    tenantId,
    sessionId,
    phoneIndex,
  });

  return data;
}

export async function sendFollowUpTextThroughProxy({ leadId, tenantId, sessionId, messageBody }) {
  const smsRelayEndpoint = import.meta.env.VITE_SIGNALWIRE_SMS_PROXY_ENDPOINT;

  if (!smsRelayEndpoint) {
    throw new Error(
      'Missing VITE_SIGNALWIRE_SMS_PROXY_ENDPOINT. Proxy SMS is required for private follow-up.',
    );
  }

  const { data } = await axios.post(smsRelayEndpoint, {
    leadId,
    tenantId,
    sessionId,
    messageBody,
  });

  return data;
}
