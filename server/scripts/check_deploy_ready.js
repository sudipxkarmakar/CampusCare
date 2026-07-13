const required = [
    'MONGO_URI',
    'JWT_SECRET'
];

const optional = [
    'GROQ_API_KEY',
    'GROQ_MODEL',
    'ML_SERVICE_URL',
    'NODE_ENV',
    'PORT'
];

const missing = required.filter((name) => !process.env[name]);

if (missing.length) {
    console.error(`Missing required environment variable${missing.length === 1 ? '' : 's'}: ${missing.join(', ')}`);
    process.exit(1);
}

const presentOptional = optional.filter((name) => process.env[name]);
const absentOptional = optional.filter((name) => !process.env[name]);

console.log('Deployment environment check passed.');
console.log(`Required variables present: ${required.join(', ')}`);
console.log(`Optional variables present: ${presentOptional.join(', ') || 'none'}`);
if (absentOptional.length) {
    console.log(`Optional variables not set: ${absentOptional.join(', ')}`);
}
