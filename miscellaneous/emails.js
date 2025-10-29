require("dotenv").config();
const nodemailer = require("nodemailer");
const log = require("./log");
const functions = require("./functions");
const dateHelper = require("./date-helper");
const fileHelper = require("./file-helper");
const token = require("./token");
const database = require("../database");
const sms = require("./sms");
const {
  PRODUCT_USER,
  LOCALIZED_STRINGS_EVENT_CANCEL_HTML,
  LOCALIZED_STRINGS_EVENT_CANCEL_SUBJECT,
  LOCALIZED_STRINGS_MEMBER_CONFIRM_HTML,
  LOCALIZED_STRINGS_NOTIFICATION_SUBJECT,
  LOCALIZED_STRINGS_HEADER,
  LOCALIZED_STRINGS_NOTIFICATION,
  LOCALIZED_STRINGS_FOOTER,
  LOCALIZED_STRINGS_APP_NAME,
  LOCALIZED_STRINGS_CONFIRMATION,
  LOCALIZED_STRINGS_MEMBER_HTML,
  LOCALIZED_STRINGS_PAYMENT_SUB_HTML,
  COUNTRY_ISO_CANADA,
  COUNTRY_ISO_TAIWAN,
  LOCALIZED_STRINGS_APP_FULL_ORGANIZER_NAME,
  LOCALIZED_STRINGS_FORGOT_PASSWORD,
  LOCALIZED_STRINGS_FORGOT_PASSWORD_HTML,
  LOCALIZED_STRINGS_TEAM_NAME,
  LOCALIZED_STRINGS_APP_FULL_NAME,
  LOCALIZED_STRINGS_ACTIVATE_ACCOUNT,
  LOCALIZED_STRINGS_SIGNUP_HTML,
  LANGUAGE_NAME_TRADITIONAL_CHINESE,
  LANGUAGE_NAME_SIMPLIFIED_CHINESE,
  LANGUAGE_NAME_CHINESE,
  LANGUAGE_NAME_ENGLISH,
  LOCALIZED_STRINGS_INVITATION,
  LOCALIZED_STRINGS_INVITATION_SUBJECT,
  LOCALIZED_STRINGS_INVITATION_HTML,
  LOCALIZED_STRINGS_APP_URL_LINK,
  COUNTRY_ISO_USA,
  LOCALIZED_STRINGS_WEB_REGISTER,
  LOCALIZED_STRINGS_WEB_REGISTER_HTML,
  LOCALIZED_STRINGS_PAYMENT_SUB_STRIPE_HTML,
} = require("../database/database-variables");

const isHttps = process.env.HOST_NAME.includes("https");

const isAzure = process.env.HOST_NAME.includes("azure");

const isValidEmailAddress = (emailAddress) => {
  return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(emailAddress);
};

const getBackendLanguage = (countryIsoCode) => {
  if (countryIsoCode === COUNTRY_ISO_TAIWAN) {
    return LANGUAGE_NAME_TRADITIONAL_CHINESE;
  } else {
    return LANGUAGE_NAME_ENGLISH;
  }
};

const sendEmail = async (
  html,
  subject,
  emailTo,
  emailBcc,
  checkIfEndWithBb = false
) => {
  if (functions.isEmpty(html) || html.length === 0) {
    return;
  }
  if (functions.isEmpty(emailTo) || emailTo.length === 0) {
    return;
  }
  if (checkIfEndWithBb && emailTo.endsWith("@bb.com")) {
    log.trace(`sendEmail ---- ${subject} is not delived to ${emailTo}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT), // Port for SMTP (usually 465)
    secure: parseInt(process.env.MAIL_SECURE) !== 0, // Usually true if connecting to port 465
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD,
    },
  });
  const info = await transporter.sendMail({
    from: `${process.env.MAIL_USER_SUPPORT_NAME} ${process.env.MAIL_USER}`,
    to: emailTo,
    bcc: emailBcc,
    subject: `${subject}`,
    html: html,
  });
};

const sendVerificationEmail = async (
  firstName,
  lastName,
  email,
  product,
  language
) => {
  try {
    const name = functions.getFullName(firstName, lastName);

    const appName = await database.getLocalizedString(
      LOCALIZED_STRINGS_APP_NAME,
      language,
      ``,
      []
    );

    const appFullName = await database.getLocalizedString(
      product === PRODUCT_USER
        ? LOCALIZED_STRINGS_APP_FULL_NAME
        : LOCALIZED_STRINGS_APP_FULL_ORGANIZER_NAME,
      language,
      ``,
      [appName]
    );
    const headerTitle = await database.getLocalizedString(
      LOCALIZED_STRINGS_ACTIVATE_ACCOUNT,
      language,
      ``,
      []
    );

    const header = await database.getLocalizedString(
      LOCALIZED_STRINGS_HEADER,
      language,
      ``,
      [headerTitle]
    );

    const teamName = await database.getLocalizedString(
      LOCALIZED_STRINGS_TEAM_NAME,
      language,
      ``,
      [appName]
    );

    const accessToken = token.getEmailAccessToken(email, product, name);
    let url;
    if (!isAzure) {
      url = `${process.env.MAIL_ORIGIN}:${process.env.PORT}`;
    } else {
      url = `${process.env.MAIL_ORIGIN}`;
    }
    url = `${url}/v1/auth/email_verification?token=${accessToken}&language=${language}`;

    const html = await database.getLocalizedString(
      LOCALIZED_STRINGS_SIGNUP_HTML,
      language,
      ``,
      [
        header,
        name,
        appFullName,
        url,
        teamName,
        url,
        url,
        appName,
        dateHelper.getYear(),
      ]
    );

    const subject = headerTitle;

    if (!isHttps) {
      log.trace(`Email sendVerificationEmail ---- ${subject}`);
      fileHelper.saveToFileSync("./document/local-email/sign-up.html", html);
    } else {
      await sendEmail(html, subject, email, process.env.MAIL_USER, false);
      log.trace(`Email sendVerificationEmail ---- email-${email}`);
    }
  } catch (error) {
    log.error(`Email sendVerificationEmail ---- ${error.message}`);
  }
};

// email for forgotten password. By Timothy Chen
const sendForgotPasswordEmail = async (
  firstName,
  lastName,
  email,
  product,
  code,
  language
) => {
  try {
    const name = functions.getFullName(firstName, lastName);

    const appName = await database.getLocalizedString(
      LOCALIZED_STRINGS_APP_NAME,
      language,
      ``,
      []
    );

    const appFullName = await database.getLocalizedString(
      product === PRODUCT_USER
        ? LOCALIZED_STRINGS_APP_FULL_NAME
        : LOCALIZED_STRINGS_APP_FULL_ORGANIZER_NAME,
      language,
      ``,
      [appName]
    );
    const headerTitle = await database.getLocalizedString(
      LOCALIZED_STRINGS_FORGOT_PASSWORD,
      language,
      ``,
      []
    );

    const header = await database.getLocalizedString(
      LOCALIZED_STRINGS_HEADER,
      language,
      ``,
      [headerTitle]
    );

    const teamName = await database.getLocalizedString(
      LOCALIZED_STRINGS_TEAM_NAME,
      language,
      ``,
      [appName]
    );

    const html = await database.getLocalizedString(
      LOCALIZED_STRINGS_FORGOT_PASSWORD_HTML,
      language,
      ``,
      [header, name, appFullName, code, teamName, appName, dateHelper.getYear()]
    );

    const subject = headerTitle;

    if (!isHttps) {
      log.trace(`Email sendForgotPasswordEmail ---- ${subject}`);
      fileHelper.saveToFileSync(
        "./document/local-email/forgot-password.html",
        html
      );
    } else {
      await sendEmail(html, subject, email, process.env.MAIL_USER, true);
      log.trace(`Email sendForgotPasswordEmail ---- email-${email}`);
    }
  } catch (error) {
    log.error(`Email sendForgotPasswordEmail ---- ${error.message}`);
  }
};

const sendEventCancelEmails = async (
  emailsInfo,
  organizationName,
  organizationPhone,
  organizationEmail,
  countryIsoCode,
  eventName,
  eventDate
) => {
  try {
    let maillist = [];
    let n = 0;
    for (n = 0; n < emailsInfo.length; n++) {
      maillist.push(emailsInfo[n].email);
    }

    const language = getBackendLanguage(countryIsoCode);

    const appName = await database.getLocalizedString(
      LOCALIZED_STRINGS_APP_NAME,
      language,
      ``,
      []
    );

    const headerTitle = await database.getLocalizedString(
      LOCALIZED_STRINGS_NOTIFICATION,
      language,
      ``,
      []
    );

    const header = await database.getLocalizedString(
      LOCALIZED_STRINGS_HEADER,
      language,
      ``,
      [headerTitle]
    );

    const footer = await database.getLocalizedString(
      LOCALIZED_STRINGS_FOOTER,
      language,
      ``,
      [
        organizationName,
        sms.getDisplayPhone(countryIsoCode, organizationPhone),
        organizationEmail,
        appName,
        dateHelper.getYear(),
      ]
    );

    let secondParam = eventName;
    let thirdParam = eventDate;
    if (
      language === LANGUAGE_NAME_SIMPLIFIED_CHINESE ||
      language === LANGUAGE_NAME_TRADITIONAL_CHINESE ||
      language === LANGUAGE_NAME_CHINESE
    ) {
      secondParam = eventDate;
      thirdParam = eventName;
    }

    const html = await database.getLocalizedString(
      LOCALIZED_STRINGS_EVENT_CANCEL_HTML,
      language,
      ``,
      [header, secondParam, thirdParam, organizationName, appName, footer]
    );
    const subject = await database.getLocalizedString(
      LOCALIZED_STRINGS_EVENT_CANCEL_SUBJECT,
      language,
      ``,
      [organizationName, appName]
    );
    if (!isHttps) {
      log.trace(`Email sendEventCancelEmails ---- ${subject}`);
      fileHelper.saveToFileSync(
        "./document/local-email/event-cancel.html",
        html
      );
    } else {
      await sendEmail(html, subject, process.env.MAIL_USER, maillist, true);

      log.trace(`Email sendEventCancelEmails`);
    }
  } catch (error) {
    log.error(`Email sendEventCancelEmails ---- ${error.message}`);
  }
};

const sendEventMemberConfirmEmail = async (
  emailInfo,
  organizationName,
  organizationPhone,
  organizationEmail,
  countryIsoCode,
  eventName,
  eventCutoffDate
) => {
  try {
    const language = getBackendLanguage(countryIsoCode);

    const name = functions.getFullName(emailInfo.firstName, emailInfo.lastName);

    const appName = await database.getLocalizedString(
      LOCALIZED_STRINGS_APP_NAME,
      language,
      ``,
      []
    );

    const headerTitle = await database.getLocalizedString(
      LOCALIZED_STRINGS_NOTIFICATION,
      language,
      ``,
      []
    );

    const header = await database.getLocalizedString(
      LOCALIZED_STRINGS_HEADER,
      language,
      ``,
      [headerTitle]
    );

    const footer = await database.getLocalizedString(
      LOCALIZED_STRINGS_FOOTER,
      language,
      ``,
      [
        organizationName,
        sms.getDisplayPhone(countryIsoCode, organizationPhone),
        organizationEmail,
        appName,
        dateHelper.getYear(),
      ]
    );

    const html = await database.getLocalizedString(
      LOCALIZED_STRINGS_MEMBER_CONFIRM_HTML,
      language,
      ``,
      [
        header,
        name,
        eventName,
        eventName,
        eventName,
        eventCutoffDate,
        eventName,
        organizationName,
        appName,
        footer,
      ]
    );
    const subject = await database.getLocalizedString(
      LOCALIZED_STRINGS_NOTIFICATION_SUBJECT,
      language,
      ``,
      [organizationName, appName]
    );

    if (!isHttps) {
      log.trace(`Email sendEventMemberConfirmEmail ---- ${subject}`);
      fileHelper.saveToFileSync(
        "./document/local-email/member-confirm.html",
        html
      );
    } else {
      await sendEmail(
        html,
        subject,
        emailInfo.email,
        process.env.MAIL_USER,
        true
      );
      log.trace(
        `Email sendEventMemberConfirmEmail ---- email-${emailInfo.email}`
      );
    }
  } catch (error) {
    log.error(`Email sendEventMemberConfirmEmail ---- ${error.message}`);
  }
};

const sendEventMemberEmail = async (
  emailInfo,
  organizationName,
  organizationPhone,
  organizationEmail,
  countryIsoCode,
  eventName,
  eventDate,
  paymentMethod,
  amount,
  language,
  stripePaymentIntentId
) => {
  try {
    const name = functions.getFullName(emailInfo.firstName, emailInfo.lastName);

    const appName = await database.getLocalizedString(
      LOCALIZED_STRINGS_APP_NAME,
      language,
      ``,
      []
    );

    const headerTitle = await database.getLocalizedString(
      LOCALIZED_STRINGS_CONFIRMATION,
      language,
      ``,
      []
    );

    const header = await database.getLocalizedString(
      LOCALIZED_STRINGS_HEADER,
      language,
      ``,
      [headerTitle]
    );

    const footer = await database.getLocalizedString(
      LOCALIZED_STRINGS_FOOTER,
      language,
      ``,
      [
        organizationName,
        sms.getDisplayPhone(countryIsoCode, organizationPhone),
        organizationEmail,
        appName,
        dateHelper.getYear(),
      ]
    );

    let payInfo = "";
    if (functions.hasValue(paymentMethod) && functions.hasValue(amount)) {
      let currency = null;
      if (countryIsoCode === COUNTRY_ISO_CANADA) {
        currency = "CAD";
        amount = amount.toLocaleString("en-CA", {
          style: "currency",
          currency: currency,
        });
      } else if (countryIsoCode === COUNTRY_ISO_USA) {
        currency = "USD";
        amount = amount.toLocaleString("en-US", {
          style: "currency",
          currency: currency,
        });
      } else if (countryIsoCode === COUNTRY_ISO_TAIWAN) {
        currency = "TWD";
        amount = amount.toLocaleString("zh-TW", {
          style: "currency",
          currency: currency,
        });
      } else {
        amount = amount.toString();
      }

      let currencyName = "";
      if (functions.hasValue(currency)) {
        currencyName = await database.getLocalizedString(
          currency,
          language,
          currency,
          []
        );
      }

      if (functions.hasValue(stripePaymentIntentId)) {
        payInfo = await database.getLocalizedString(
          LOCALIZED_STRINGS_PAYMENT_SUB_STRIPE_HTML,
          language,
          ``,
          [paymentMethod, `${amount} ${currencyName}`, stripePaymentIntentId]
        );
      } else {
        payInfo = await database.getLocalizedString(
          LOCALIZED_STRINGS_PAYMENT_SUB_HTML,
          language,
          ``,
          [paymentMethod, `${amount} ${currencyName}`]
        );
      }
    }

    const html = await database.getLocalizedString(
      LOCALIZED_STRINGS_MEMBER_HTML,
      language,
      ``,
      [
        header,
        name,
        organizationName,
        eventName,
        eventDate,
        payInfo,
        eventName,
        organizationName,
        appName,
        footer,
      ]
    );
    const subject = await database.getLocalizedString(
      LOCALIZED_STRINGS_NOTIFICATION_SUBJECT,
      language,
      ``,
      [organizationName, appName]
    );

    if (!isHttps) {
      if (payInfo.length === 0) {
        log.trace(`Email sendEventMemberEmail ---- ${subject}`);
        fileHelper.saveToFileSync("./document/local-email/member.html", html);
      } else {
        log.trace(`Email sendPaymentEmail ---- ${subject}`);
        fileHelper.saveToFileSync("./document/local-email/payment.html", html);
      }
    } else {
      await sendEmail(
        html,
        subject,
        emailInfo.email,
        process.env.MAIL_USER,
        true
      );
      if (payInfo.length === 0) {
        log.trace(`Email sendEventMemberEmail ---- email-${emailInfo.email}`);
      } else {
        log.trace(`Email sendPaymentEmail ---- email-${emailInfo.email}`);
      }
    }
  } catch (error) {
    log.error(`Email sendEventMemberEmail ---- ${error.message}`);
  }
};

const sendInvitationEmail = async (
  firstName,
  lastName,
  email,
  organizationName,
  organizationPhone,
  organizationEmail,
  countryIsoCode
) => {
  try {
    const language = getBackendLanguage(countryIsoCode);

    const name = functions.getFullName(firstName, lastName);

    const appName = await database.getLocalizedString(
      LOCALIZED_STRINGS_APP_NAME,
      language,
      ``,
      []
    );

    const headerTitle = await database.getLocalizedString(
      LOCALIZED_STRINGS_INVITATION,
      language,
      ``,
      []
    );

    const header = await database.getLocalizedString(
      LOCALIZED_STRINGS_HEADER,
      language,
      ``,
      [headerTitle]
    );

    const teamName = await database.getLocalizedString(
      LOCALIZED_STRINGS_TEAM_NAME,
      language,
      ``,
      [appName]
    );

    const appUrlLink = await database.getLocalizedString(
      LOCALIZED_STRINGS_APP_URL_LINK,
      language,
      ``,
      []
    );

    const html = await database.getLocalizedString(
      LOCALIZED_STRINGS_INVITATION_HTML,
      language,
      ``,
      [
        header,
        name,
        organizationEmail,
        organizationName,
        appUrlLink,
        teamName,
        appUrlLink,
        appUrlLink,
        appName,
        dateHelper.getYear(),
      ]
    );
    const subject = await database.getLocalizedString(
      LOCALIZED_STRINGS_INVITATION_SUBJECT,
      language,
      ``,
      [organizationName, appName]
    );

    if (!isHttps) {
      log.trace(`Email sendInvitationEmail ---- ${subject}`);
      fileHelper.saveToFileSync("./document/local-email/invitation.html", html);
    } else {
      await sendEmail(html, subject, email, process.env.MAIL_USER, true);
      log.trace(`Email sendInvitationEmail ---- email-${email}`);
    }
  } catch (error) {
    log.error(`Email sendInvitationEmail ---- ${error.message}`);
  }
};

const sendEventFlagEmail = async (content) => {
  try {
    if (!isHttps) {
      log.trace(
        `Email sendEventFlagEmail ---- ${process.env.MAIL_FLAG_SUBJECT}`
      );
      fileHelper.saveToFileSync(
        "./document/local-email/event-flag.html",
        content
      );
    } else {
      await sendEmail(
        content,
        process.env.MAIL_FLAG_SUBJECT,
        process.env.MAIL_FLAG_TO,
        process.env.MAIL_USER,
        false
      );
      log.trace(
        `Email sendEventFlagEmail ---- email-${process.env.MAIL_FLAG_TO}`
      );
    }
  } catch (error) {
    log.error(`Email sendEventFlagEmail ---- ${error.message}`);
  }
};

const sendWebRegisterEmail = async (
  firstName,
  lastName,
  email,
  verifyCode,
  language
) => {
  try {
    const name = functions.getFullName(firstName, lastName);

    const appName = await database.getLocalizedString(
      LOCALIZED_STRINGS_APP_NAME,
      language,
      ``,
      []
    );

    const headerTitle = await database.getLocalizedString(
      LOCALIZED_STRINGS_WEB_REGISTER,
      language,
      ``,
      []
    );

    const header = await database.getLocalizedString(
      LOCALIZED_STRINGS_HEADER,
      language,
      ``,
      [headerTitle]
    );

    const teamName = await database.getLocalizedString(
      LOCALIZED_STRINGS_TEAM_NAME,
      language,
      ``,
      [appName]
    );

    const html = await database.getLocalizedString(
      LOCALIZED_STRINGS_WEB_REGISTER_HTML,
      language,
      ``,
      [
        header,
        name,
        email,
        appName,
        `<h3>${verifyCode}</h3>`,
        teamName,
        appName,
        dateHelper.getYear(),
      ]
    );

    const subject = headerTitle;

    if (!isHttps) {
      log.trace(`Email sendWebRegisterEmail ---- ${subject}`);
      fileHelper.saveToFileSync(
        "./document/local-email/web-register.html",
        html
      );
    } else {
      await sendEmail(html, subject, email, process.env.MAIL_USER, false);
      log.trace(`Email sendWebRegisterEmail ---- email-${email}`);
    }
  } catch (error) {
    log.error(`Email sendWebRegisterEmail ---- ${error.message}`);
  }
};

exports.isValidEmailAddress = isValidEmailAddress;
exports.sendVerificationEmail = sendVerificationEmail;
exports.sendForgotPasswordEmail = sendForgotPasswordEmail;
exports.sendEventCancelEmails = sendEventCancelEmails;
exports.sendEventMemberConfirmEmail = sendEventMemberConfirmEmail;
exports.sendEventMemberEmail = sendEventMemberEmail;
exports.sendInvitationEmail = sendInvitationEmail;
exports.sendEventFlagEmail = sendEventFlagEmail;
exports.sendWebRegisterEmail = sendWebRegisterEmail;

//frank
exports.sendEmail = sendEmail;
