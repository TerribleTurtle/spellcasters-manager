
const response = await fetch('http://localhost:3001/api/patches/quick-commit', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
        change: {
            target_id: "test_unit_verification",
            name: "Test verification",
            field: "test",
            old: "A",
            new: "B"
        },
        tags: ["verification"]
    })
});
const data = await response.json();
console.log(JSON.stringify(data, null, 2));
