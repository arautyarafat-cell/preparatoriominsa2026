
// test_fetch.js
async function test() {
    try {
        console.log("Fetching...");
        const response = await fetch('http://localhost:3001/decipher-terms/random');
        console.log('Status:', response.status);
        if (response.ok) {
            const data = await response.json();
            console.log('Data:', JSON.stringify(data, null, 2));
        } else {
            const text = await response.text();
            console.log('Error Body:', text);
        }
    } catch (e) {
        console.error('Error Fetching:', e);
    }
}

test();
