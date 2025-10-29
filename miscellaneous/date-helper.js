const getYear = () => {
  const dateNow = new Date();
  return dateNow.getFullYear().toString();
};

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const getTicker = () => {
  const dateNow = new Date();
  return parseInt(dateNow.getTime() / 1000);
};

const getTimezoneOffset = (timeZone) => {
  const timeNow = new Date();
  const timeZoneTime = new Date(timeNow.toLocaleString("en-US", { timeZone }));
  const utcTime = new Date(
    timeNow.toLocaleString("en-US", { timeZone: "UTC" })
  );
  return Math.round((timeZoneTime.getTime() - utcTime.getTime()) / (60 * 1000));
};

const getLocalWebDateByTimeZone = (timeZone) => {
  const timeNow = new Date();
  const timeZoneTime = new Date(timeNow.toLocaleString("en-US", { timeZone }));
  const year = timeZoneTime.getFullYear().toString().padStart(4, "0");
  const month = (timeZoneTime.getMonth() + 1).toString().padStart(2, "0");
  const date = timeZoneTime.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${date}`;
};

const getLocalFullWebDateByTimeZone = (timeZone) => {
  // log.trace(`Taipei: ${dateHelper.getLocalFullWebDateByTimeZone("Asia/Taipei")}`);
  // log.trace(
  //   `London: ${dateHelper.getLocalFullWebDateByTimeZone("Europe/London")}`
  // );
  // log.trace(
  //   `Vancouver: ${dateHelper.getLocalFullWebDateByTimeZone("America/Vancouver")}`
  // );
  // log.trace(
  //   `Toronto: ${dateHelper.getLocalFullWebDateByTimeZone("America/Toronto")}`
  // );

  const timeNow = new Date();
  const timeZoneTime = new Date(timeNow.toLocaleString("en-US", { timeZone }));
  const year = timeZoneTime.getFullYear().toString().padStart(4, "0");
  const month = (timeZoneTime.getMonth() + 1).toString().padStart(2, "0");
  const date = timeZoneTime.getDate().toString().padStart(2, "0");
  const hours = timeZoneTime.getHours().toString().padStart(2, "0");
  const minutes = timeZoneTime.getMinutes().toString().padStart(2, "0");
  const seconds = timeZoneTime.getSeconds().toString().padStart(2, "0");
  return `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;
};

const getDateFromWebDate = (webDate) => {
  const ymd = webDate.split("-");
  return new Date(parseInt(ymd[0]), parseInt(ymd[1]) - 1, parseInt(ymd[2]), 12);
};

const adjustDate = (date, dayOffset) => {
  const oneDaymilliSeconds = 24 * 60 * 60 * 1000;
  return new Date(date.getTime() - oneDaymilliSeconds * dayOffset);
};

const getWebDateFromDate = (realDate) => {
  const year = realDate.getFullYear().toString().padStart(4, "0");
  const month = (realDate.getMonth() + 1).toString().padStart(2, "0");
  const date = realDate.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${date}`;
};

const getDay = (date) => {
  // 0 ~ 6
  // 0 for Sunday, 1 for Monday, 2 for Tuesday, and so on
  // iOS is base on 1
  return date.getDay() + 1;
};

const getWeekdayName = (weekday) => {
  let name;
  switch (weekday) {
    case 1:
      name = "Sunday";
      break;
    case 2:
      name = "Monday";
      break;
    case 3:
      name = "Tuesday";
      break;
    case 4:
      name = "Wednesday";
      break;
    case 5:
      name = "Thurday";
      break;
    case 6:
      name = "Friday";
      break;
    case 7:
      name = "Saturday";
      break;
    default:
      name = "Undefined";
      break;
  }
  return name;
};

const toSqlServerUTCDate = () => {
  const timeNow = new Date();
  const timeZoneTime = new Date(
    timeNow.toLocaleString("en-US", { timeZone: "UTC" })
  );
  const year = timeZoneTime.getFullYear().toString().padStart(4, "0");
  const month = (timeZoneTime.getMonth() + 1).toString().padStart(2, "0");
  const date = timeZoneTime.getDate().toString().padStart(2, "0");
  const hours = timeZoneTime.getHours().toString().padStart(2, "0");
  const minutes = timeZoneTime.getMinutes().toString().padStart(2, "0");
  const seconds = timeZoneTime.getSeconds().toString().padStart(2, "0");
  const milliSeconds = timeZoneTime
    .getMilliseconds()
    .toString()
    .padStart(3, "0");
  return `${year}-${month}-${date} ${hours}:${minutes}:${seconds}.${milliSeconds}`;
};

const getWebDateByTimeZoneFromTicker = (timeZone, ticker) => {
  const time = new Date(ticker * 1000);
  const timeZoneTime = new Date(time.toLocaleString("en-US", { timeZone }));
  const year = timeZoneTime.getFullYear().toString().padStart(4, "0");
  const month = (timeZoneTime.getMonth() + 1).toString().padStart(2, "0");
  const date = timeZoneTime.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${date}`;
};

exports.getYear = getYear;
exports.sleep = sleep;
exports.getTicker = getTicker;
exports.getTimezoneOffset = getTimezoneOffset;
exports.getLocalWebDateByTimeZone = getLocalWebDateByTimeZone;
exports.getLocalFullWebDateByTimeZone = getLocalFullWebDateByTimeZone;
exports.getDateFromWebDate = getDateFromWebDate;
exports.adjustDate = adjustDate;
exports.getWebDateFromDate = getWebDateFromDate;
exports.getDay = getDay;
exports.getWeekdayName = getWeekdayName;
exports.toSqlServerUTCDate = toSqlServerUTCDate;
exports.getWebDateByTimeZoneFromTicker = getWebDateByTimeZoneFromTicker;
