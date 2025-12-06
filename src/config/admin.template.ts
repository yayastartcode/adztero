// TEMPLATE FILE - Copy this to admin.ts and update with your credentials
// This file is NOT gitignored so it can be uploaded as a template

export const adminConfig = {
    username: 'admin',
    // Generate password hash with: npx tsx scripts/hash-password.ts yourpassword
    // DO NOT commit the actual password hash to git!
    passwordHash: '$2b$10$YOUR_HASH_HERE',
};
