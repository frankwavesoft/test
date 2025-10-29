var crypto = require('crypto');
var constants = require('constants');
var arrayBufferConcat = require('arraybuffer-concat');

const encrypt = (publicKey, data) => {
  var text = '';
  if (typeof data === 'string') {
    text = data;
  } else {
    text = JSON.stringify(data);
  }

  const textEncoder = new TextEncoder();
  const buffer = textEncoder.encode(text);
  const count = Math.floor(buffer.length / 245);
  const last = buffer.length % 245;

  var resultBuffer;
  for (var i = 0; i < count; i++) {
    const start = i * 245;
    const end = i * 245 + 245;
    const encrypted = crypto.publicEncrypt(
      { key: publicKey, padding: constants.RSA_PKCS1_PADDING },
      buffer.slice(start, end)
    );
    if (i == 0) {
      resultBuffer = encrypted;
    } else {
      resultBuffer = arrayBufferConcat(resultBuffer, encrypted);
    }
  }
  if (last > 0) {
    const encrypted = crypto.publicEncrypt(
      { key: publicKey, padding: constants.RSA_PKCS1_PADDING },
      buffer.slice(count * 245)
    );
    if (i > 0) {
      resultBuffer = arrayBufferConcat(resultBuffer, encrypted);
    } else {
      resultBuffer = encrypted;
    }
  }

  return Buffer.from(resultBuffer).toString('base64');
};

exports.encrypt = encrypt;
