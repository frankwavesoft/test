const fs = require('fs');
const log = require('./log');
const functions = require('./functions');

const saveToFileSync = (fileName, data) => {
  try {
    fs.writeFileSync(fileName, data);
  } catch (error) {
    log.error(`saveToFileSync: ${error.message}`);
  }
};

const copyFileSync = (src, dest) => {
  try {
    if (functions.hasValue(src) && src.length > 0) {
      fs.copyFileSync(src, dest);
    }
  } catch (error) {
    log.error(`copyFile: ${error.message}`);
  }
};

const renameSync = (oldPath, newPath) => {
  try {
    fs.renameSync(oldPath, newPath);
  } catch (error) {
    log.error(`renameSync: ${error.message}`);
  }
};

const deleteFile = (fileName) => {
  try {
    if (functions.hasValue(fileName)) {
      fs.access(fileName, fs.F_OK, (err) => {
        if (err) {
        } else {
          fs.unlink(fileName, (err2) => {});
        }
      });
    }
  } catch (error) {
    console.log(`Delete file ${fileName} failed`);
  }
};

exports.saveToFileSync = saveToFileSync;
exports.copyFileSync = copyFileSync;
exports.renameSync = renameSync;
exports.deleteFile = deleteFile;
