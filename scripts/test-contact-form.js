// using global fetch (Node 18+)

async function testContactForm() {
    console.log('Testing Contact Form Submission...');

    const formData = {
        companyName: 'Test Company',
        contactName: 'Test User',
        email: 'denisoppa00@gmail.com',
        phone: '010-1234-5678',
        productCategory: 'beauty',
        message: 'This is a test message to verify the fix.'
    };

    try {
        const response = await fetch('http://localhost:3000/contact-form', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        console.log('Response status:', response.status);
        console.log('Response data:', data);

        if (response.ok) {
            console.log('✅ Form submission successful via API.');
        } else {
            console.error('❌ Form submission failed via API.');
        }
    } catch (error) {
        console.error('❌ Error testing contact form:', error);
    }
}

testContactForm();
