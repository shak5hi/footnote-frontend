const axios = require('axios');

async function testAuth() {
    const baseUrl = 'http://localhost:5001/api/auth';
    const testUser = {
        firstName: 'Test',
        lastName: 'User',
        email: 'TestEmail@Example.com',
        password: 'password123'
    };

    try {
        console.log('Testing Registration with Cased Email...');
        const signupRes = await axios.post(`${baseUrl}/signup`, testUser);
        console.log('Signup Result:', signupRes.data.email); // should be lowercase

        console.log('Testing Login with Lowercase Email...');
        const loginRes1 = await axios.post(`${baseUrl}/login`, {
            email: 'testemail@example.com',
            password: 'password123'
        });
        console.log('Login 1 (lowercase) Success:', !!loginRes1.data.token);

        console.log('Testing Login with Uppercase Email...');
        const loginRes2 = await axios.post(`${baseUrl}/login`, {
            email: 'TESTEMAIL@EXAMPLE.COM',
            password: 'password123'
        });
        console.log('Login 2 (uppercase) Success:', !!loginRes2.data.token);

        console.log('✅ Auth tests passed!');
    } catch (error) {
        console.error('❌ Auth tests failed:', error.response ? error.response.data : error.message);
    }
}

testAuth();
