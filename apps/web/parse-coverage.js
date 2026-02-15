const fs = require('fs');
const path = require('path');

const coveragePath = path.join(process.cwd(), 'coverage/coverage-final.json');

try {
  const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
  
  console.log('Coverage Report:');
  console.log('---------------------------------------------------------');
  console.log('File                                     | % Stmts | % Branch | % Funcs | % Lines | Uncovered Lines');
  console.log('---------------------------------------------------------');

  Object.keys(coverage).forEach(filePath => {
    const fileCov = coverage[filePath];
    const relativePath = path.relative(process.cwd(), filePath);
    
    // Calculate percentages (simple approximation based on summary if available, else counting)
    // Actually coverage-final.json is the detailed map. coverage-summary.json is better if it exists.
    // But let's check if coverage-summary.json exists first.
  });
} catch (e) {
  console.error(e);
}
