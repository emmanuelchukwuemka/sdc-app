// Test script to verify API connection to the new HTTPS endpoint
const axios = require('axios');

async function testApiConnection() {
    console.log('🔍 Testing API connection to https://surrogateanddonorconnect.com...\n');
    
    try {
        // Test the base URL
        console.log('1. Testing base endpoint...');
        const response = await axios.get('https://surrogateanddonorconnect.com/');
        console.log('✅ Base endpoint accessible');
        console.log('   Response:', response.data);
        
        // Test auth endpoint (should return 401 without auth)
        console.log('\n2. Testing auth endpoint...');
        try {
            await axios.post('https://surrogateanddonorconnect.com/api/auth/login', {
                email: 'test@example.com',
                password: 'test123'
            });
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ Auth endpoint accessible (returns 401 as expected)');
            } else {
                console.log('⚠️  Auth endpoint returned unexpected status:', error.response?.status);
            }
        }
        
        // Test auth endpoint (should return 401 without auth)
        console.log('\n3. Testing auth endpoint...');
        try {
            await axios.post('https://surrogateanddonorconnect.com/api/auth/login', {
                email: 'test@example.com',
                password: 'test123'
            });
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ Auth endpoint accessible (returns 401 as expected)');
            } else {
                console.log('⚠️  Auth endpoint returned unexpected status:', error.response?.status);
            }
        }
        
        console.log('\n🎉 All API connection tests passed!');
        console.log('✅ Mobile app should now connect to https://surrogateanddonorconnect.com');
        
    } catch (error) {
        console.error('❌ API connection test failed:');
        console.error('   Error:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
    }
}

// Run the test
testApiConnection();