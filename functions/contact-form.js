// AI-Powered Business Consultation API
// Analyzes business information and provides automated consulting

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'denisoppa00@gmail.com';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { companyName, email, phone, productCategory, otherCategory, inquiryDetails } = req.body;

        // Validate required fields
        if (!companyName || !email || !phone) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // If other category is selected, use the custom category
        const finalCategory = productCategory === 'other' && otherCategory
            ? otherCategory
            : productCategory;

        // Generate AI consultation report
        const aiReport = await generateAIConsultation({
            companyName,
            productCategory: finalCategory,
            inquiryDetails
        });

        // Send consultation report to customer
        await sendConsultationEmail({
            to: email,
            customerName: companyName,
            consultation: aiReport
        });

        // Send notification to admin
        await sendAdminNotification({
            companyName,
            email,
            phone,
            productCategory: finalCategory,
            inquiryDetails,
            aiReport
        });

        return res.status(200).json({
            success: true,
            message: 'Consultation request received. You will receive a detailed report via email shortly.',
            preview: aiReport.summary
        });

    } catch (error) {
        console.error('AI Consultation error:', error);
        return res.status(500).json({
            error: 'Failed to process consultation request',
            message: error.message
        });
    }
}

// Generate AI-powered business consultation
async function generateAIConsultation({ companyName, productCategory, inquiryDetails }) {
    const prompt = `You are a professional Amazon marketplace consultant specializing in helping businesses expand to the US market.

Company: ${companyName}
Product Category: ${productCategory || 'Not specified'}
Inquiry: ${inquiryDetails || 'General consultation request'}

Please provide a comprehensive consultation report including:

1. MARKET ANALYSIS
- US market potential for this product category
- Estimated monthly sales potential ($USD)
- Competition level (1-10)
- Market trends

2. KEYWORD STRATEGY
- 5 high-converting Amazon search keywords
- Estimated search volume for each
- Recommended bid strategy

3. PRODUCT LISTING OPTIMIZATION
- Title optimization suggestions
- Bullet points structure
- Backend keywords recommendations
- A+ Content suggestions

4. PRICING STRATEGY
- Recommended retail price range
- Competitive positioning
- Profit margin analysis

5. LAUNCH STRATEGY
- Recommended launch timeline (weeks)
- Initial inventory quantity
- Marketing budget allocation
- Key success metrics

6. POTENTIAL CHALLENGES
- Top 3 challenges to watch out for
- Mitigation strategies

7. REVENUE PROJECTION
- Month 1-3 estimated sales
- Month 4-6 estimated sales
- Month 7-12 estimated sales
- Break-even timeline

Format the response in a professional, actionable manner with specific numbers and recommendations.`;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 2048,
                    }
                })
            }
        );

        if (!response.ok) {
            throw new Error('Gemini API request failed');
        }

        const data = await response.json();
        const fullReport = data.candidates[0].content.parts[0].text;

        // Extract summary (first 200 characters)
        const summary = fullReport.substring(0, 200) + '...';

        return {
            fullReport,
            summary,
            generatedAt: new Date().toISOString()
        };

    } catch (error) {
        console.error('Gemini API error:', error);

        // Fallback consultation if AI fails
        return {
            fullReport: getFallbackConsultation(companyName, productCategory),
            summary: 'Based on your inquiry, we recommend starting with market research and product listing optimization.',
            generatedAt: new Date().toISOString()
        };
    }
}

// Send detailed consultation report to customer
async function sendConsultationEmail({ to, customerName, consultation }) {
    const emailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1a2332; color: white; padding: 30px; text-align: center; }
        .logo { font-size: 28px; font-weight: bold; }
        .subtitle { color: #ff6b35; font-size: 14px; }
        .content { background: #f9fafb; padding: 30px; }
        .section { margin-bottom: 30px; }
        .section-title { color: #1a2332; font-size: 20px; font-weight: bold; margin-bottom: 15px; border-left: 4px solid #ff6b35; padding-left: 15px; }
        .report { background: white; padding: 20px; border-radius: 8px; white-space: pre-wrap; }
        .cta { background: #ff6b35; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">NextGate</div>
          <div class="subtitle">Your Gateway to US Market Success</div>
        </div>
        
        <div class="content">
          <h2>Hello ${customerName}!</h2>
          <p>Thank you for your interest in expanding to the US market. Our AI-powered system has analyzed your business and prepared a comprehensive consultation report.</p>
          
          <div class="section">
            <div class="section-title">📊 Your Personalized Consultation Report</div>
            <div class="report">${consultation.fullReport}</div>
          </div>
          
          <div class="section">
            <p><strong>Next Steps:</strong></p>
            <ol>
              <li>Review the recommendations in this report</li>
              <li>Schedule a call with our team to discuss implementation</li>
              <li>Start your US market expansion with $0 upfront cost</li>
            </ol>
          </div>
          
          <a href="https://nextgate.co" class="cta">Schedule Your Free Consultation Call</a>
        </div>
        
        <div class="footer">
          <p>This report was generated on ${new Date().toLocaleString()}</p>
          <p>Questions? Reply to this email or contact us at contact@nextgate.co</p>
          <p>&copy; 2026 NextGate. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`
        },
        body: JSON.stringify({
            from: 'NextGate AI Consultant <consultation@nextgate.co>',
            to: [to],
            subject: `Your Personalized US Market Consultation Report - ${customerName}`,
            html: emailHTML
        })
    });

    if (!response.ok) {
        throw new Error('Failed to send customer email');
    }

    return await response.json();
}

// Send notification to admin with full details
async function sendAdminNotification({ companyName, email, phone, productCategory, inquiryDetails, aiReport }) {
    const emailHTML = `
    <h2>New AI Consultation Request</h2>
    <p><strong>Company:</strong> ${companyName}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Phone:</strong> ${phone}</p>
    <p><strong>Product Category:</strong> ${productCategory || 'Not specified'}</p>
    <h3>Inquiry Details:</h3>
    <p>${inquiryDetails || 'No details provided'}</p>
    <h3>AI-Generated Report Summary:</h3>
    <p>${aiReport.summary}</p>
    <hr>
    <p><small>Full report sent to customer at ${email}</small></p>
    <p><small>Generated at: ${new Date().toISOString()}</small></p>
  `;

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`
        },
        body: JSON.stringify({
            from: 'NextGate System <system@nextgate.co>',
            to: [CONTACT_EMAIL],
            subject: `[New Lead] ${companyName} - AI Consultation Request`,
            html: emailHTML
        })
    });

    if (!response.ok) {
        console.error('Failed to send admin notification');
    }
}

// Fallback consultation template if AI fails
function getFallbackConsultation(companyName, productCategory) {
    return `BUSINESS CONSULTATION REPORT FOR ${companyName}

Thank you for your interest in expanding to the US market through Amazon.

1. MARKET ANALYSIS
The ${productCategory} category shows strong potential in the US market. Based on current trends, there is significant opportunity for growth with proper positioning and marketing strategy.

2. GETTING STARTED
We recommend the following approach:
- Comprehensive market research for your specific products
- Competitive analysis of similar products on Amazon US
- Product listing optimization with US market keywords
- Initial test launch with selected SKUs

3. NEXT STEPS
1. Schedule a detailed consultation call with our team
2. Prepare your product information and current sales data
3. Discuss your specific goals and timeline
4. Create a customized launch strategy

Our team will provide detailed, personalized recommendations based on your specific products and business goals.

Best regards,
NextGate Team`;
}
