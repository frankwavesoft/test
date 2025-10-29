require("dotenv").config();
const twilio = require("twilio");
const axios = require("axios");
const log = require("./log");
const functions = require("./functions");
const database = require("../database");
const {
  LOCALIZED_STRINGS_VERIFICATION_TEXT,
  COUNTRY_ISO_CANADA,
  COUNTRY_ISO_TAIWAN,
  LOCALIZED_STRINGS_APP_NAME,
  LOCALIZED_STRINGS_APP_FULL_ORGANIZER_NAME,
  COUNTRY_ISO_USA,
  LOCALIZED_STRINGS_WEB_REGISTER_TEXT,
} = require("../database/database-variables");

const isHttps = process.env.HOST_NAME.includes("https");

const twilioclient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
  {
    autoRetry: true,
    maxRetries: 3,
  }
);

const getCountryCode = (countryIsoCode) => {
  if (
    countryIsoCode === COUNTRY_ISO_CANADA ||
    countryIsoCode === COUNTRY_ISO_USA
  ) {
    return "1";
  } else if (countryIsoCode === COUNTRY_ISO_TAIWAN) {
    return "886";
  }
  return "";
};

const getFullMobile = (countryIsoCode, mobile) => {
  mobile = getPureMobileNumber(mobile);
  const prefix = getCountryCode(countryIsoCode);
  if (mobile.startsWith(prefix)) {
    mobile = mobile.substring(prefix.length);
  }
  while (mobile.startsWith("0")) {
    mobile = mobile.substring(1);
  }
  if (mobile.length > 0) {
    mobile = prefix + mobile;
  }
  return mobile;
};

const getDisplayPhone = (countryIsoCode, phone) => {
  phone = getPureMobileNumber(phone);
  let prefix = "";
  let simpleMark;
  let simpleLengh;

  if (
    countryIsoCode === COUNTRY_ISO_CANADA ||
    countryIsoCode === COUNTRY_ISO_USA
  ) {
    prefix = "1";
    simpleMark = "(XXX)-XXX-XXXX";
    simpleLengh = 10;
  } else if (countryIsoCode === COUNTRY_ISO_TAIWAN) {
    prefix = "886";
    simpleMark = "XX-XXXX-XXXX";
    simpleLengh = 10;
  }
  if (phone.startsWith(prefix)) {
    phone = phone.substring(prefix.length);
  }
  if (phone.length < simpleLengh) {
    phone = "0" + phone;
  }

  if (countryIsoCode === COUNTRY_ISO_TAIWAN) {
    if (phone.startsWith("09")) {
      simpleMark = "XXXX-XXX-XXX";
    }
  }

  let n;
  let charct;
  let n2 = 0;
  let result = "";
  for (n = 0; n < simpleMark.length; n++) {
    charct = simpleMark[n];
    if (charct === "X") {
      result = result + phone[n2];
      n2 = n2 + 1;
    } else {
      result = result + charct;
    }
  }

  return result;
};

const isMobileNumber = (mobile) => {
  const v = /^[0123456789.-]+$/i.test(mobile);
  return v;
};

const isValidMobileNumber = (mobile) => {
  const v = isMobileNumber(mobile);
  if (!v) {
    return false;
  }
  mobile = getPureMobileNumber(mobile);
  return mobile.length >= 10;
};

const getPureMobileNumber = (mobile) => {
  if (functions.isEmpty(mobile)) {
    return "";
  }
  mobile = mobile.replace(/\D/g, "");
  return mobile;
};

const sendVerificationText = async (
  countryIsoCode,
  mobile,
  verifyCode,
  language
) => {
  try {
    const appName = await database.getLocalizedString(
      LOCALIZED_STRINGS_APP_NAME,
      language,
      ``,
      []
    );

    const appFullName = await database.getLocalizedString(
      LOCALIZED_STRINGS_APP_FULL_ORGANIZER_NAME,
      language,
      ``,
      [appName]
    );

    mobile = getFullMobile(countryIsoCode, mobile);

    const messageBody = await database.getLocalizedString(
      LOCALIZED_STRINGS_VERIFICATION_TEXT,
      language,
      `%s is your verification code for Booking Circle. It expires in ten minutes. Do not share this code with anyone.`,
      [`${verifyCode}`, appFullName]
    );

    if (!isHttps) {
      console.log(`SMS sendVerificationText: ${messageBody}`);
      return;
    }

    if (countryIsoCode === COUNTRY_ISO_TAIWAN) {
      const config = {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      };
      const response = await axios.post(
        "https://smsapi.mitake.com.tw/api/mtk/SmSend?CharsetURL=UTF-8",
        {
          username: `${process.env.MITAKE_USER}`,
          password: `${process.env.MITAKE_PASSWORD}`,
          dstaddr: `${mobile}`,
          smbody: `${messageBody}`,
        },
        config
      );

      const dataArray = response.data.split("\r\n");
      let n;
      let detailArray;
      let detailKey, detailValue;
      let errorValue = null;
      let msgIdValue = null;
      let accountPointValue = null;
      if (functions.hasValue(dataArray) && dataArray.length > 0) {
        for (n = 0; n < dataArray.length; n++) {
          detailArray = dataArray[n].split("=");
          if (detailArray.length === 2) {
            detailKey = detailArray[0];
            detailValue = detailArray[1];

            if (detailKey === "Error") {
              errorValue = detailValue;
            } else if (detailKey === "msgid") {
              msgIdValue = detailValue;
            } else if (detailKey === "AccountPoint") {
              accountPointValue = detailValue;
            }
          }
        }
      }

      if (functions.hasValue(msgIdValue)) {
        log.trace(
          `SMS sendVerificationText ---- ${mobile}, ${msgIdValue}, (${accountPointValue})`
        );
      } else {
        log.error(`SMS sendVerificationText ---- ${mobile}, ${errorValue}`);
      }
    } else {
      mobile = "+" + mobile;
      const message = await twilioclient.messages.create({
        body: `${messageBody}`,
        from: `${process.env.TWILIO_MOBILE}`,
        to: `${mobile}`,
      });
      log.trace(`SMS sendVerificationText ---- ${mobile}, ${message.sid}`);
    }
  } catch (error) {
    log.error(`SMS sendVerificationText ---- ${error.message}`);
  }
};

const sendWebRegisterText = async (
  countryIsoCode,
  mobile,
  verifyCode,
  language
) => {
  try {
    const appName = await database.getLocalizedString(
      LOCALIZED_STRINGS_APP_NAME,
      language,
      ``,
      []
    );

    mobile = getFullMobile(countryIsoCode, mobile);

    const messageBody = await database.getLocalizedString(
      LOCALIZED_STRINGS_WEB_REGISTER_TEXT,
      language,
      `Your %s verification code is: %s. DO NOT forward or give this code to anyone.`,
      [appName, verifyCode]
    );

    if (!isHttps) {
      console.log(`SMS sendWebRegisterText: ${messageBody}`);
      return;
    }

    if (countryIsoCode === COUNTRY_ISO_TAIWAN) {
      const config = {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      };
      const response = await axios.post(
        "https://smsapi.mitake.com.tw/api/mtk/SmSend?CharsetURL=UTF-8",
        {
          username: `${process.env.MITAKE_USER}`,
          password: `${process.env.MITAKE_PASSWORD}`,
          dstaddr: `${mobile}`,
          smbody: `${messageBody}`,
        },
        config
      );

      const dataArray = response.data.split("\r\n");
      let n;
      let detailArray;
      let detailKey, detailValue;
      let errorValue = null;
      let msgIdValue = null;
      let accountPointValue = null;
      if (functions.hasValue(dataArray) && dataArray.length > 0) {
        for (n = 0; n < dataArray.length; n++) {
          detailArray = dataArray[n].split("=");
          if (detailArray.length === 2) {
            detailKey = detailArray[0];
            detailValue = detailArray[1];

            if (detailKey === "Error") {
              errorValue = detailValue;
            } else if (detailKey === "msgid") {
              msgIdValue = detailValue;
            } else if (detailKey === "AccountPoint") {
              accountPointValue = detailValue;
            }
          }
        }
      }

      if (functions.hasValue(msgIdValue)) {
        log.trace(
          `SMS sendWebRegisterText ---- ${mobile}, ${msgIdValue}, (${accountPointValue})`
        );
      } else {
        log.error(`SMS sendWebRegisterText ---- ${mobile}, ${errorValue}`);
      }
    } else {
      mobile = "+" + mobile;
      const message = await twilioclient.messages.create({
        body: `${messageBody}`,
        from: `${process.env.TWILIO_MOBILE}`,
        to: `${mobile}`,
      });
      log.trace(`SMS sendWebRegisterText ---- ${mobile}, ${message.sid}`);
    }
  } catch (error) {
    log.error(`SMS sendWebRegisterText ---- ${error.message}`);
  }
};

exports.getCountryCode = getCountryCode;
exports.getFullMobile = getFullMobile;
exports.getDisplayPhone = getDisplayPhone;
exports.isValidMobileNumber = isValidMobileNumber;
exports.getPureMobileNumber = getPureMobileNumber;
exports.sendVerificationText = sendVerificationText;
exports.sendWebRegisterText = sendWebRegisterText;
