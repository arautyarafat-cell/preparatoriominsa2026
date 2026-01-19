
import fetch from 'node-fetch';

async function testEndpoints() {
    console.log("Testing Endpoints against running server...");

    // Test 1: Study Topics
    try {
        console.log("1. Testing GET /study-topics?category_id=TEC_ENFERMAGEM");
        const res = await fetch('http://localhost:3001/study-topics?category_id=TEC_ENFERMAGEM');
        console.log(`Status: ${res.status}`);
        const text = await res.text();
        console.log(`Body: ${text.substring(0, 200)}...`);
    } catch (e) {
        console.error("Test 1 Failed:", e.message);
    }

    // Test 2: Quiz Generation (simulate what frontend does)
    try {
        console.log("\n2. Testing POST /generate/quiz");
        // Looking for the route... assuming it's /quiz/generate or /generate/quiz based on logs
        // validatin' paths via view_file of quiz.js is better, but let's try assuming the log `POST http://192.168.18.2:3001/generate/quiz` is right (except for IP)
        const res = await fetch('http://localhost:3001/generate/quiz', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                category_id: 'TEC_ENFERMAGEM',
                topic_filter: 'all'
            })
        });
        console.log(`Status: ${res.status}`);
        const text = await res.text();
        console.log(`Body: ${text.substring(0, 200)}...`);
    } catch (e) {
        console.error("Test 2 Failed:", e.message);
    }
}

testEndpoints();
