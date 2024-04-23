
const bcrypt = require('bcrypt');
const saltRounds = parseInt(process.env.CRYPTO_SALT_ROUND || 10, 10);

const generateHash = (plain) => bcrypt.hash(plain, saltRounds);

const compareHash = (plain, hash) => bcrypt.compare(plain, hash);

module.exports = {
  generateHash,
  compareHash,
};
