import { execSync } from 'child_process';
import path from 'path';

console.log('--- STARTING CAMPUCARE V5 AI KERNEL TESTING SUITE ---');

try {
    // 1. Generate 10k tests
    console.log('Generating combinatorial tests...');
    execSync('node server/scripts/generate_10000_tests.js', { stdio: 'inherit' });

    // 2. Run Parser Unit Tests
    console.log('\nRunning Parser Unit Tests...');
    execSync('node server/tests/parser/parser.test.js', { stdio: 'inherit' });

    // 3. Run Conversation Engine Tests
    console.log('\nRunning Wizard Session Tests...');
    execSync('node server/tests/conversation/conversation.test.js', { stdio: 'inherit' });

    console.log('\n--- ALL AI KERNEL TEST SUITES PASSED SUCCESSFULY ---');
} catch (e) {
    console.error('Testing failed with error:', e.message);
    process.exit(1);
}
