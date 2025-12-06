// Admin credentials configuration
// Hardcoded to avoid .env parsing issues with bcrypt dollar signs
export const adminConfig = {
    username: 'admin',
    // Password: moreduit1234
    // Generated with: npx tsx scripts/hash-password.ts moreduit1234
    // To change: generate new hash and update this file
    passwordHash: '$2b$10$zekhCP.XvpFdJtkqaRx4xe36oijZQVtvpcrRaBBQqrw10GSykai3y',
};
