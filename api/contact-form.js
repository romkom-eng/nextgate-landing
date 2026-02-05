// API endpoint to send contact form emails
// Uses Resend API for email delivery

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'denisoppa00@gmail.com';

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { companyName, email, phone, productCategory, inquiryDetails } = req.body;

        // Validate required fields
        if (!companyName || !email || !phone) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Send email using Resend API
        const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`
            },
            body: JSON.stringify({
                from: 'NextGate Contact Form <noreply@nextgate.co>',
                to: [CONTACT_EMAIL],
                subject: `New Contact Form Submission - ${companyName}`,
                html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Company Name:</strong> ${companyName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Product Category:</strong> ${productCategory || 'Not specified'}</p>
          <h3>Inquiry Details:</h3>
          <p>${inquiryDetails || 'No details provided'}</p>
          <hr>
          <p><small>Submitted at: ${new Date().toISOString()}</small></p>
        `
            })
        });

        if (!emailResponse.ok) {
            const error = await emailResponse.json();
            console.error('Resend API error:', error);
            throw new Error('Failed to send email');
        }

        const data = await emailResponse.json();
        console.log('Email sent successfully:', data);

        // Return success response
        return res.status(200).json({
            success: true,
            message: 'Contact form submitted successfully'
        });

    } catch (error) {
        console.error('Contact form error:', error);
        return res.status(500).json({
            error: 'Failed to submit contact form',
            message: error.message
        });
    }
}
