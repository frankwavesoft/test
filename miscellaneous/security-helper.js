const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const getSha256Hash = (password) => {
  const hash = crypto.createHash('sha256');
  return hash.update(password).digest('hex');
};

const getTokenSecret = async () => {
  try {
    const secret = await crypto.randomBytes(64).toString('hex');
    return secret;
  } catch (error) {
    return '';
  }
};

const getHashedPassword = async (password) => {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    return hashedPassword;
  } catch (error) {
    return password;
  }
};

exports.getSha256Hash = getSha256Hash;
exports.getTokenSecret = getTokenSecret;
exports.getHashedPassword = getHashedPassword;
