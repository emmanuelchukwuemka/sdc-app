const axios = require('axios');

const BASE_URL = 'http://72.62.4.119:5000/api'; // Localhost/Remote API URL
const TEST_USER = {
    email: 'test_' + Date.now() + '@example.com',
    password: 'Password123!',
    role: 'SURROGATE',
    first_name: 'Test',
    surname: 'User'
};

let authToken = '';
let userId = '';

async function runTests() {
    console.log('🚀 Starting API Integration Tests...\n');

    try {
        // 1. Auth Tests
        console.log('--- Auth Module ---');

        // Register
        try {
            const regResp = await axios.post(`${BASE_URL}/auth/register`, {
                email: TEST_USER.email,
                password: TEST_USER.password,
                role: TEST_USER.role,
                first_name: TEST_USER.first_name,
                surname: TEST_USER.surname
            });
            console.log('✅ Register: Success');
        } catch (e) {
            console.log('❌ Register: Failed', e.response?.data || e.message);
        }

        // Login
        try {
            const loginResp = await axios.post(`${BASE_URL}/auth/login`, {
                email: TEST_USER.email,
                password: TEST_USER.password
            });
            authToken = loginResp.data.token;
            userId = loginResp.data.user.id;
            console.log('✅ Login: Success');
        } catch (e) {
            console.log('❌ Login: Failed', e.response?.data || e.message);
        }

        const headers = { Authorization: `Bearer ${authToken}` };

        // Me
        try {
            const meResp = await axios.get(`${BASE_URL}/auth/me`, { headers });
            console.log('✅ Get Current User (Me): Success');
        } catch (e) {
            console.log('❌ Get Current User (Me): Failed', e.response?.data || e.message);
        }

        // OTP (Resend)
        try {
            await axios.post(`${BASE_URL}/auth/resend-otp`, { email: TEST_USER.email, type: 'signup' });
            console.log('✅ Resend OTP: Success');
        } catch (e) {
            console.log('❌ Resend OTP: Failed', e.response?.data || e.message);
        }

        // 2. KYC Tests
        console.log('\n--- KYC Module ---');
        try {
            const kycStatus = await axios.get(`${BASE_URL}/kyc/status`, { headers });
            console.log('✅ KYC Status: Success');
        } catch (e) {
            console.log('❌ KYC Status: Failed', e.response?.data || e.message);
        }

        try {
            await axios.post(`${BASE_URL}/kyc/documents`, {
                user_id: userId,
                role: 'SURROGATE',
                status: 'in_progress',
                form_data: { test: true },
                form_progress: 10
            }, { headers });
            console.log('✅ Submit KYC Document: Success');
        } catch (e) {
            console.log('❌ Submit KYC Document: Failed', e.response?.data || e.message);
        }

        // 3. Referral Tests
        console.log('\n--- Referral Module ---');
        try {
            await axios.get(`${BASE_URL}/referrals/code`, { headers });
            console.log('✅ Get Referral Code: Success');
        } catch (e) {
            console.log('❌ Get Referral Code: Failed', e.response?.data || e.message);
        }

        // 4. Agency Tests (Requires agencyId, using userId as fallback for testing endpoints exist)
        console.log('\n--- Agency Module ---');
        try {
            await axios.get(`${BASE_URL}/agencies/${userId}/roster`, { headers });
            console.log('✅ Get Agency Roster: Success');
        } catch (e) {
            console.log('❌ Get Agency Roster: Failed (Expected if user is not agency)', e.response?.data || e.message);
        }

        // 5. Wallet Tests
        console.log('\n--- Wallet Module ---');
        try {
            await axios.get(`${BASE_URL}/wallet/balance`, { headers });
            console.log('✅ Wallet Balance: Success');
        } catch (e) {
            console.log('❌ Wallet Balance: Failed', e.response?.data || e.message);
        }

        // 6. Connections & Journey
        console.log('\n--- Connections & Journey ---');
        try {
            await axios.get(`${BASE_URL}/connections`, { headers });
            console.log('✅ Get Connections: Success');
        } catch (e) {
            console.log('❌ Get Connections: Failed', e.response?.data || e.message);
        }

        try {
            await axios.get(`${BASE_URL}/journey`, { headers, params: { role: 'SURROGATE' } });
            console.log('✅ Get Journey: Success');
        } catch (e) {
            console.log('❌ Get Journey: Failed', e.response?.data || e.message);
        }

        console.log('\n🏁 Tests Completed.');

    } catch (globalErr) {
        console.error('\n💥 Global failure during testing:', globalErr.message);
    }
}

runTests();
