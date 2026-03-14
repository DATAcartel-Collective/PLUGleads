import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);

const MICHIANA_ZIPS = [
  '46601', '46613', '46614', '46615', '46616', '46617', '46619', '46628', '46635', '46637', 
  '46530', '46544', '46545', '46546', '46552', '46554', '46574',
  '46514', '46515', '46516', '46517', '46526', '46527', '46528', '46507', '46540', '46550', '46573',
  '46350', '46360', '46301', '46391',
  '49120', '49107', '49103', '49106', '49117', '49127', '49085', '49022', '49038', '49039',
  '49112', '49031', '49047', '49095'
];

const STATUTE_OF_LIMITATIONS_YEARS = {
    'IN': 2,
    'MI': 1
};

const getVal = (row, partial) => {
  const key = Object.keys(row).find(k => k.toLowerCase().replace(/[\s_]/g, '').includes(partial.toLowerCase()));
  return row[key];
};

export async function processAndStoreLead(rawLeadData) {
    // 1. FUZZY DATA EXTRACTION
    const address = getVal(rawLeadData, 'address');
    let zip = String(getVal(rawLeadData, 'zip') || '').trim().split('-')[0].replace(/\D/g, '');
    const equity = parseFloat(String(getVal(rawLeadData, 'equity') || '0').replace(/[^0-9.]/g, ''));
    const homeowner = getVal(rawLeadData, 'name') || 'Unknown Owner';
    const roofAge = parseInt(getVal(rawLeadData, 'roof') || 0);

    if (!address) throw new Error("Critical Failure: Row has no address.");

    // 2. CATEGORIZATION (No more rejections!)
    const isMichiana = MICHIANA_ZIPS.includes(zip);
    const hasHighEquity = equity >= 40;
    const hasOldRoof = roofAge >= 7;

    let urgency_flag = false;
    let claim_deadline = null;
    const stormDateStr = getVal(rawLeadData, 'storm');
    const state = (getVal(rawLeadData, 'state') || 'IN').toUpperCase();

    if (stormDateStr) {
        const stormDate = new Date(stormDateStr);
        const yearsToAdd = STATUTE_OF_LIMITATIONS_YEARS[state] || 1; 
        claim_deadline = new Date(stormDate);
        claim_deadline.setFullYear(claim_deadline.getFullYear() + yearsToAdd);
        
        const today = new Date();
        const daysUntil = Math.ceil((claim_deadline - today) / (1000 * 3600 * 24));
        if (daysUntil > 0 && daysUntil <= 60) urgency_flag = true;
    }

    let score = 0;
    let priority_status = 'Manual Review'; // Default status for everything

    // Scoring logic
    if (isMichiana) score += 20;
    if (hasHighEquity) score += 30;
    if (hasOldRoof) score += 20;
    if (urgency_flag) score += 25;
    if (homeowner.toUpperCase().includes('LLC') || homeowner.toUpperCase().includes('TRUST')) score += 15;

    // Automated Tiering based on Score
    if (score >= 70) {
        priority_status = 'High';
    } else if (score >= 40) {
        priority_status = 'Medium';
    } else {
        priority_status = 'Low';
    }

    let phoneNumber = getVal(rawLeadData, 'phone') || null;
    let skipTraced = !!phoneNumber;

    // Trigger Skip-Trace only for High Priority leads missing a phone number
    if (priority_status === 'High' && !skipTraced) {
        try {
            const res = await axios.post('https://api.skiptraceprovider.com/v1/search', {
                name: homeowner,
                address: address,
                city: getVal(rawLeadData, 'city'),
                state: state,
                zip: zip
            }, {
                headers: { 'Authorization': `Bearer ${import.meta.env.VITE_SKIP_TRACE_API_KEY}` }
            });

            if (res.data?.phone_number) {
                phoneNumber = res.data.phone_number;
                skipTraced = true;
            }
        } catch (err) {
            console.error('Skip-trace failed for:', address, err.message);
        }
    }

    // 3. STORE EVERYTHING
    const { data, error } = await supabase
        .from('leads')
        .upsert([{
            address: address,
            city: getVal(rawLeadData, 'city') || 'Unknown',
            state: state,
            zip_code: zip,
            homeowner_name: homeowner,
            phone_number: phoneNumber, // Add this
            equity_percent: equity,
            roof_age: roofAge,
            priority_status: priority_status,
            lead_score: score,
            claim_deadline: claim_deadline ? claim_deadline.toISOString().split('T')[0] : null, // Add this
            urgency_flag: urgency_flag, // Add this
            skip_traced: skipTraced, // Add this
            is_michiana: isMichiana,
            raw_data: rawLeadData
        }], { onConflict: 'address' })
        .select();

    if (error) throw new Error(`Database Error: ${error.message}`);
    
    return data[0];
}