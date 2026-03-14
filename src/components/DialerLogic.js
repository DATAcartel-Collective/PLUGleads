import axios from 'axios';

/**
 * Connects the app to SignalWire Relay to bridge the call.
 */
export const initiateSignalWireCall = async (toPhone, leadId) => {
  const SIGNALWIRE_SPACE = 'datacartelcollective.signalwire.com';
  const PROJECT_ID = '2a349ac9-3c9e-4d0c-9743-91dbf3c0494b';
  const API_TOKEN = 'PSK_NBNnGsAejJM9HyoEmNGhu9iK';

  try {
    // This calls your SignalWire relay to bridge the call through a proxy number
    // This protects the contractor's personal cell and records the interaction
    await axios.post(`https://${SIGNALWIRE_SPACE}/api/laml/2010-04-01/Accounts/${PROJECT_ID}/Calls`, 
      new URLSearchParams({
        To: toPhone,
        From: '+15745550199', // Your purchased proxy number
        Url: `https://your-app.com/api/voice-callback?leadId=${leadId}`
      }),
      {
        headers: { 'Authorization': `Basic ${btoa(`${PROJECT_ID}:${API_TOKEN}`)}` }
      }
    );
    console.log("Relay handshake complete. Dialing...");
  } catch (error) {
    console.error("SignalWire Relay Failed:", error);
  }
};