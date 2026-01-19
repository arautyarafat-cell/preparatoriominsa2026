// Script simples para verificar estrutura e valores
async function check() {
    const res = await fetch('http://localhost:3001/lessons');
    const data = await res.json();

    if (data.data && data.data[0]) {
        console.log('Primeira aula:');
        console.log(`  titulo: ${data.data[0].titulo}`);
        console.log(`  materiais_complementares: ${JSON.stringify(data.data[0].materiais_complementares)}`);
    }

    console.log('\nMateriais disponíveis:');
    const matRes = await fetch('http://localhost:3001/materials');
    const matData = await matRes.json();
    if (matData.data && matData.data.length > 0) {
        matData.data.forEach(m => {
            console.log(`  - ${m.title} (ID: ${m.id})`);
        });
    } else {
        console.log('  Nenhum material encontrado');
    }
}
check();
