const fs = require('fs');

// Super simple CSV filter - no dependencies needed
function filterSchools(inputFile, outputFile) {
    const data = fs.readFileSync(inputFile, 'utf8');
    const lines = data.split('\n');
    const headers = lines[0];
    
    console.log(`Processing ${lines.length - 1} rows...`);
    
    // Filter lines
    const filteredLines = [headers]; // Keep headers
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue; // Skip empty lines
        
        const upperLine = line.toUpperCase();
        
        // Simple check: line contains both MIDDLE and LAREDO
        // Also exclude schools under construction
        if (upperLine.includes('MIDDLE') && upperLine.includes('LAREDO') && 
            !upperLine.includes('UNDER CONSTRUCTION')) {
            filteredLines.push(line);
        }
    }
    
    console.log(`Found ${filteredLines.length - 1} matching schools`);
    
    // Write results
    fs.writeFileSync(outputFile, filteredLines.join('\n'));
    console.log(`✅ Saved to: ${outputFile}`);
}

// Get command line arguments
const [,, inputFile, outputFile] = process.argv;

if (!inputFile || !outputFile) {
    console.log('Usage: node basic-filter.js input.csv output.csv');
    process.exit(1);
}

filterSchools(inputFile, outputFile);
