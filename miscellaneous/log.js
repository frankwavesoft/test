const fs = require("fs");
const functions = require("./functions");
const FIXED_PATH = "log";
const ONEDAY_MILLISECOND = 1000 * 60 * 60 * 24;
let counter = 0;

///////////////////////////////////////////////////////////
// private function

const doLog = (content, isError) => {
  const dateNow = new Date();
  const year = dateNow.getFullYear().toString().padStart(4, "0");
  const month = (dateNow.getMonth() + 1).toString().padStart(2, "0");
  const date = dateNow.getDate().toString().padStart(2, "0");
  const hours = dateNow.getHours().toString().padStart(2, "0");
  const minutes = dateNow.getMinutes().toString().padStart(2, "0");
  const seconds = dateNow.getSeconds().toString().padStart(2, "0");
  const milliSeconds = dateNow.getMilliseconds().toString().padStart(3, "0");

  let type = null;
  const data = `[${year}-${month}-${date} ${hours}:${minutes}:${seconds}] ${content}`;
  if (isError) {
    type = "err";
    console.error(data);
  } else {
    type = "log";
    console.log(data);
  }

  fs.appendFile(
    `./${FIXED_PATH}/${year}-${month}-${date}-${hours}.${type}`,
    `[${year}-${month}-${date} ${hours}:${minutes}:${seconds}.${milliSeconds}]-${type}\n    ${content}\n`,
    (error) => {
      if (functions.hasValue(error)) {
        console.error(error);
      }
    }
  );

  if (counter > 500) {
    counter = 0;
    let n;
    let fileName;
    let lstat;
    let stat;
    const milliSecondsSince1970 = dateNow.getTime();
    let daysPassed;

    try {
      const files = fs.readdirSync(`./${FIXED_PATH}`);
      for (n = 0; n < files.length; n++) {
        fileName = `./${FIXED_PATH}/${files[n]}`;
        lstat = fs.lstatSync(fileName);
        if (lstat.isDirectory()) {
          fs.rmdirSync(fileName, { recursive: true });
        } else if (lstat.isFile()) {
          if (fileName.endsWith(".log") || fileName.endsWith(".err")) {
            stat = fs.statSync(fileName);
            daysPassed =
              (milliSecondsSince1970 - stat.birthtimeMs) / ONEDAY_MILLISECOND;
            console.log(`${fileName}, ${stat.size}`);
            if (daysPassed > 30) {
              fs.unlinkSync(fileName);
            } else if (daysPassed > 0.5) {
              if (fileName.endsWith(".log") && stat.size < 140) {
                fs.unlinkSync(fileName);
              }
            }
          } else {
            fs.unlinkSync(fileName);
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  }
  counter = counter + 1;

  if (counter % 200 === 0) {
    console.clear();
  }
};

///////////////////////////////////////////////////////////
// public function

const init = () => {
  if (!fs.existsSync(`./${FIXED_PATH}`)) {
    fs.mkdir(`./${FIXED_PATH}`, (error) => {
      if (functions.hasValue(error)) {
        console.log(error);
      }
    });
  }
};

const trace = (content) => {
  doLog(content, false);
};

const error = (content) => {
  doLog(content, true);
};

exports.init = init;
exports.trace = trace;
exports.error = error;
