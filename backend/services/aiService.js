const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Convert natural language procurement request into structured RFP
 */
async function createRFPFromNaturalLanguage(naturalLanguageInput) {
  const prompt = `You are an expert procurement assistant. Convert the following natural language procurement request into a structured RFP (Request for Proposal) in JSON format.

Input: "${naturalLanguageInput}"

Extract and structure the following information:
- title: A clear, concise title for the RFP
- description: The full description of what needs to be procured
- budget: Total budget amount (number only, or null if not specified)
- deadline: When proposals are due (ISO date format YYYY-MM-DD, or null if not specified)
- delivery_date: When delivery is needed (ISO date format YYYY-MM-DD, or null if not specified)
- payment_terms: Payment terms mentioned (e.g., "net 30", "net 60", etc.)
- warranty_period: Warranty requirements (e.g., "1 year", "2 years", etc.)
- requirements: An array of specific requirements, each with:
  - item: Item name/description
  - quantity: Number needed (if specified)
  - specifications: Technical specs or requirements for this item

Return ONLY valid JSON, no additional text. Example format:
{
  "title": "Office Equipment Procurement",
  "description": "Procurement of laptops and monitors for new office",
  "budget": 50000,
  "deadline": "2024-02-15",
  "delivery_date": "2024-03-01",
  "payment_terms": "net 30",
  "warranty_period": "1 year",
  "requirements": [
    {
      "item": "Laptops",
      "quantity": 20,
      "specifications": "16GB RAM"
    },
    {
      "item": "Monitors",
      "quantity": 15,
      "specifications": "27-inch"
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: 'You are a procurement assistant that converts natural language into structured RFP data. Always return valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    console.error('Error creating RFP from natural language:', error);
    throw new Error('Failed to process natural language input');
  }
}

/**
 * Parse vendor response email into structured proposal data
 */
async function parseVendorResponse(emailBody, emailSubject, attachments = []) {
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
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: 'You are a procurement assistant that extracts structured data from vendor proposal emails. Always return valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    const parsed = JSON.parse(content);
    
    // Store the full extracted data (create a copy to avoid circular reference)
    parsed.extracted_data = JSON.parse(JSON.stringify(parsed));
    
    return parsed;
  } catch (error) {
    console.error('Error parsing vendor response:', error);
    throw new Error('Failed to parse vendor response');
  }
}

/**
 * Compare proposals and generate recommendations
 */
async function compareProposals(proposals, rfpData) {
  const prompt = `You are an expert procurement analyst. Compare the following vendor proposals for an RFP and provide recommendations.

RFP Details:
- Budget: ${rfpData.budget || 'Not specified'}
- Delivery Required: ${rfpData.delivery_date || 'Not specified'}
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
      model: 'gpt-4-turbo-preview',
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
    throw new Error('Failed to compare proposals');
  }
}

module.exports = {
  createRFPFromNaturalLanguage,
  parseVendorResponse,
  compareProposals,
};

