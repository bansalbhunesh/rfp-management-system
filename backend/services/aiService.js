const OpenAI = require('openai');
require('dotenv').config();

let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

/**
 * Local fallback parser: extracts basic fields from natural language without calling OpenAI.
 * This allows a fully local demo if OPENAI_API_KEY is not provided.
 */
function localParseNaturalLanguage(naturalLanguageInput) {
  const text = naturalLanguageInput || '';
  const lower = text.toLowerCase();

  // simple heuristics
  const budgetMatch = text.match(/\$?\s?([0-9,]+(\.[0-9]+)?)/);
  const budget = budgetMatch ? budgetMatch[1].replace(/,/g,'') : null;

  const deliveryMatch = lower.match(/(within|in)\s*(\d+)\s*(day|days|weeks)/);
  const delivery_days = deliveryMatch ? parseInt(deliveryMatch[2],10) : null;

  const warrantyMatch = lower.match(/(\b(\d+)\s*(year|years)\s*warranty\b)/);
  const warranty_period = warrantyMatch ? warrantyMatch[2] + ' year(s)' : null;

  // items: look for patterns like '20 laptops with 16GB' or '15 monitors 27-inch'
  const itemPattern = /(\d+)\s+([a-zA-Z\s]+?)(?:with\s([^,.;]+))?(?:,|\.|$)/g;
  let m;
  const requirements = [];
  while ((m = itemPattern.exec(text)) !== null) {
    const qty = parseInt(m[1],10);
    const name = (m[2]||'').trim();
    const spec = m[3] ? m[3].trim() : null;
    if (name) {
      requirements.push({ name, quantity: qty, spec });
    }
  }

  // Title: first sentence
  const title = text.split(/[.\n]/)[0].slice(0,120);

  return {
    title: title || 'Procurement Request',
    description: text,
    budget: budget ? parseFloat(budget) : null,
    delivery_days,
    deadline: null,
    payment_terms: lower.includes('net 30') ? 'Net 30' : null,
    warranty_period,
    requirements,
  };
}

/**
 * Convert natural language procurement request into structured RFP
 */
async function createRFPFromNaturalLanguage(naturalLanguageInput) {
  if (!openai) {
    // Use local fallback
    return localParseNaturalLanguage(naturalLanguageInput);
  }

  const prompt = "You are an expert procurement assistant. Convert the following procurement request into a structured JSON RFP with fields:\n- title (short)\n- description (detailed)\n- budget (number, USD)\n- deadline (ISO date if present)\n- delivery_date or delivery_days (number of days)\n- payment_terms (string)\n- warranty_period (string)\n- requirements (array of {name, quantity, spec})\n\nReturn only JSON.\n\nRequest:\n\"\"\"" + naturalLanguageInput + "\"\"\"";

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 800,
    temperature: 0.0,
  });

  const text = response.choices && response.choices[0] && response.choices[0].message && response.choices[0].message.content;
  try {
    const parsed = JSON.parse(text);
    return parsed;
  } catch (e) {
    // fallback to simple parse if AI output isn't strict JSON
    return localParseNaturalLanguage(naturalLanguageInput);
  }
}

/**
 * Parse vendor response email into structured proposal data
 */
async function parseVendorResponse(emailBody, emailSubject, attachments = []) {
  if (!openai) {
    // Simple local fallback
    const text = emailBody || '';
    const priceMatch = text.match(/\$?\s?([0-9,]+(\.[0-9]+)?)/);
    return {
      total_price: priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : null,
      line_items: [],
      payment_terms: null,
      warranty_period: null,
      delivery_date: null,
      additional_notes: text.substring(0, 500),
      extracted_data: { total_price: priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : null }
    };
  }

  const prompt = `You are an expert procurement assistant. Parse the following vendor proposal email into structured JSON data.

Email Subject: "${emailSubject}"
Email Body: "${emailBody}"

Extract the following information:
- total_price: Total price quoted (number only, or null if not found)
- line_items: Array of items with:
  - item: Item name/description
  - quantity: Quantity (if specified)
  - unit_price: Price per unit (if specified)
  - total_price: Total price for this line item
- payment_terms: Payment terms offered (e.g., "net 30", "net 60", etc.)
- warranty_period: Warranty offered (e.g., "1 year", "2 years", etc.)
- delivery_date: Proposed delivery date (ISO date format YYYY-MM-DD, or null)
- additional_notes: Any additional terms, conditions, or notes

Return ONLY valid JSON, no additional text. If information is not found, use null for that field.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a procurement assistant that extracts structured data from vendor proposal emails. Always return valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    const parsed = JSON.parse(content);
    
    // Store the full extracted data
    parsed.extracted_data = JSON.parse(JSON.stringify(parsed));
    
    return parsed;
  } catch (error) {
    console.error('Error parsing vendor response:', error);
    if (error.response) {
      throw new Error(`OpenAI API error: ${error.response.status} - ${error.response.statusText}`);
    }
    // Fallback to local parsing
    const text = emailBody || '';
    const priceMatch = text.match(/\$?\s?([0-9,]+(\.[0-9]+)?)/);
    return {
      total_price: priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : null,
      line_items: [],
      payment_terms: null,
      warranty_period: null,
      delivery_date: null,
      additional_notes: text.substring(0, 500),
      extracted_data: { total_price: priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : null }
    };
  }
}

/**
 * Compare proposals and generate recommendations
 */
async function compareProposals(proposals, rfpData) {
  if (!openai) {
    // Simple local comparison
    const sorted = proposals.sort((a, b) => (a.total_price || 0) - (b.total_price || 0));
    return {
      proposals: proposals.map(p => ({
        id: p.id,
        overall_score: p.total_price ? 100 - (p.total_price / (rfpData.budget || 100000) * 100) : 50,
        price_score: p.total_price ? 100 - (p.total_price / (rfpData.budget || 100000) * 100) : 50,
        terms_score: 75,
        completeness_score: 80,
        recommendation_reason: 'Basic comparison'
      })),
      best_proposal_id: sorted[0]?.id || null,
      summary: 'Basic price comparison',
      key_differences: []
    };
  }

  const prompt = `You are an expert procurement analyst. Compare the following vendor proposals for an RFP and provide recommendations.

RFP Details:
- Budget: ${rfpData.budget || 'Not specified'}
- Delivery Required: ${rfpData.delivery_date || rfpData.delivery_days ? `${rfpData.delivery_days} days` : 'Not specified'}
- Payment Terms Required: ${rfpData.payment_terms || 'Not specified'}
- Warranty Required: ${rfpData.warranty_period || 'Not specified'}

Proposals:
${JSON.stringify(proposals, null, 2)}

Return a JSON object with the following structure:
{
  "proposals": [
    {
      "id": <proposal_id>,
      "overall_score": <0-100>,
      "price_score": <0-100>,
      "terms_score": <0-100>,
      "completeness_score": <0-100>,
      "recommendation_reason": "<brief explanation>"
    }
  ],
  "best_proposal_id": <id_of_best_proposal>,
  "summary": "<brief summary comparing all proposals>",
  "key_differences": ["<difference 1>", "<difference 2>", ...]
}

For each proposal in the "proposals" array, include:
- id: The proposal ID from the input
- overall_score: Overall score out of 100
- price_score: Score for pricing competitiveness (0-100, lower price = higher score if within budget)
- terms_score: Score for payment terms and conditions alignment (0-100)
- completeness_score: Score for how well it meets all requirements (0-100)
- recommendation_reason: Brief explanation of the score

Return ONLY valid JSON, no additional text.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a procurement analyst that compares vendor proposals. Always return valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    console.error('Error comparing proposals:', error);
    // Fallback to local comparison
    const sorted = proposals.sort((a, b) => (a.total_price || 0) - (b.total_price || 0));
    return {
      proposals: proposals.map(p => ({
        id: p.id,
        overall_score: p.total_price ? 100 - (p.total_price / (rfpData.budget || 100000) * 100) : 50,
        price_score: p.total_price ? 100 - (p.total_price / (rfpData.budget || 100000) * 100) : 50,
        terms_score: 75,
        completeness_score: 80,
        recommendation_reason: 'Basic comparison'
      })),
      best_proposal_id: sorted[0]?.id || null,
      summary: 'Basic price comparison',
      key_differences: []
    };
  }
}

module.exports = {
  createRFPFromNaturalLanguage,
  parseVendorResponse,
  compareProposals,
};
