const crypto = require('crypto');
const functions = require('./functions');

const iv = '8651731586517315';
const ivEncoding = 'utf8';
const inputEncoding = 'utf8';
const outputEncoding = 'base64';

const encrypt = (data) => {
  return new Promise((resolve, rejects) => {
    try {
      const password = functions.getUuid().toString('hex');
      crypto.scrypt(password, 'salt', 16, (err, derivedKey) => {
        if (err) {
          throw err;
        }

        const cipher = crypto.createCipheriv(
          'aes-128-cbc',
          derivedKey,
          Buffer.from(iv, ivEncoding)
        );
        cipher.setAutoPadding(true);

        var encryptedData = cipher.update(data, inputEncoding, outputEncoding);
        encryptedData += cipher.final(outputEncoding);

        resolve({ key: derivedKey, encryptedData: encryptedData });
      });
    } catch (err) {
      rejects(err);
    }
  });
};

const decrypt = (data, key) => {
  return new Promise((resolve, rejects) => {
    try {
      if (functions.isEmpty(data)) {
        throw 'empty';
      }
      var cipher = crypto.createDecipheriv(
        'aes-128-cbc',
        key,
        Buffer.from(iv, ivEncoding)
      );
      cipher.setAutoPadding(true);

      var decryptedData = cipher.update(data, outputEncoding, inputEncoding);
      decryptedData += cipher.final(inputEncoding);

      resolve(decryptedData);
    } catch (err) {
      rejects(err);
    }
  });
};

exports.encrypt = encrypt;
exports.decrypt = decrypt;
