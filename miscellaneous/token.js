require("dotenv").config();
const jwt = require("jsonwebtoken");
const log = require("./log");
const functions = require("./functions");
const database = require("../database");
const {
  PRODUCT_ORGANIZER,
  PRODUCT_USER,
  TEN_MINUTE,
  ONE_YEAR,
  USER_HASH_SUSPENDED,
  SIGNIN_TYPE_UNDEFINED,
  ONE_HOUR,
  HALF_HOUR,
} = require("../database/database-variables");

// require('crypto').randomBytes(64).toString('hex')
const ACCESS_TOKEN_SECRET =
  "9f7013897f6d7f9f16019d9be98c019f77cf359e9059ad6b1d9115242382b6fa7a0c465139e30dcca04ff3b9f5812ad19d050d6e6afbdf459bf37cd99de46a36";
const REFRESH_TOKEN_SECRET =
  "b7b5d3d53b5c61f31c092cbb54ba9093ed2ab5e360bb7d425df742311dde779876c4b1d57bd6060be19be99c2e883b608face04f389fbe78f774e22db130d709";
const EMAIL_TOKEN_SECRET =
  "6ac45f47937dbb178f4041410458f25a4a03efbc68a541b1cca5b9d9d1e448f8e6c1454d2249cbbe8376eb4d6ebc0ac9953c0b354b17d410cb6031bed2f6f394";

const COOKIE_ACCESS_TOKEN = "access_token";
const COOKIE_REFRESH_TOKEN = "internal_token";
const COOKIE_SESSION_INFOR = "session_infor";
const isHttps = process.env.HOST_NAME.includes("https");

const processToken = async (
  req,
  res,
  product,
  signInType,
  device,
  user,
  isRefresh
) => {
  // in seconds
  const expiresInAccess = ONE_HOUR;
  const expiresInRefresh = ONE_YEAR;
  let signInAccessToken;
  let signInRefreshToken;
  if (product === PRODUCT_ORGANIZER) {
    signInAccessToken = getOrganizerSignInAccessToken(
      expiresInAccess + TEN_MINUTE,
      device,
      user.organizerKey,
      user.organizationKey,
      user.countryIsoCode,
      user.regionKey,
      functions.getFullName(user.firstName, user.lastName),
      user.role
    );
    signInRefreshToken = getOrganizerSignInRefreshToken(
      device,
      user.organizerKey
    );
  } else if (product === PRODUCT_USER) {
    signInAccessToken = getUserSignInAccessToken(
      expiresInAccess + TEN_MINUTE,
      device,
      user.userKey,
      user.email,
      user.countryIsoCode,
      user.regionKey,
      functions.getFullName(user.firstName, user.lastName)
    );
    signInRefreshToken = getUserSignInRefreshToken(device, user.userKey);
  }

  // in milli seconds
  const maxAgeAccess = expiresInAccess * 1000;
  const maxAgeRefresh = expiresInRefresh * 1000;

  if (isHttps) {
    res.cookie(COOKIE_ACCESS_TOKEN, signInAccessToken, {
      maxAge: maxAgeAccess,
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    res.cookie(COOKIE_REFRESH_TOKEN, signInRefreshToken, {
      maxAge: maxAgeRefresh,
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
  } else {
    res.cookie(COOKIE_ACCESS_TOKEN, signInAccessToken, {
      maxAge: maxAgeAccess,
      httpOnly: true,
    });
    res.cookie(COOKIE_REFRESH_TOKEN, signInRefreshToken, {
      maxAge: maxAgeRefresh,
      httpOnly: true,
    });
  }

  if (isRefresh) {
    return;
  }

  const sessionId = functions.getUuid();
  const sessionInfor = { sessionId };
  const maxAgeSession = maxAgeRefresh * 5;

  if (isHttps) {
    res.cookie(COOKIE_SESSION_INFOR, sessionInfor, {
      maxAge: maxAgeSession,
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
  } else {
    res.cookie(COOKIE_SESSION_INFOR, sessionInfor, {
      maxAge: maxAgeSession,
      httpOnly: true,
    });
  }

  try {
    await database.devicesTable.createDevice(
      signInType,
      device,
      user.organizerKey,
      user.userKey,
      user.firstName,
      user.lastName,
      user.email,
      user.mobile,
      sessionId
    );
  } catch (error) {}

  if (product === PRODUCT_ORGANIZER) {
    log.trace(
      `Auth set token ---- organizerKey-${user.organizerKey}, ${user.firstName} ${user.lastName}, device-${req.body.device}`
    );
    res.json({
      organizerKey: user.organizerKey,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      mobile: user.mobile,
      gender: user.gender,
      birthDate: user.birthDate,
      imageName: user.imageName,
      countryIsoCode: user.countryIsoCode,
      regionKey: user.regionKey,
      hash: user.hash,
      role: user.role,
      bookingCircleId: user.bookingCircleId,
      organizationStatus: user.organizationStatus,
      organizationName: user.organizationName,
      organizationDescription: user.organizationDescription,
      organizationKeywords: user.organizationKeywords,
      organizationCategoryKey: user.organizationCategoryKey,
      organizationUniqueId: user.organizationUniqueId,
      organizationImageName: user.organizationImageName,
      organizationWebSite: user.organizationWebSite,
      organizationPhone: user.organizationPhone,
      organizationEmail: user.organizationEmail,
      stripeAccount: user.stripeAccount,
      scan2PayMchId: user.scan2PayMchId,
      scan2PayTradeKey: user.scan2PayTradeKey,
      scan2PayRefundKey: user.scan2PayRefundKey,
    });
  } else if (product === PRODUCT_USER) {
    log.trace(
      `Auth set token ---- userKey-${user.userKey}, ${user.firstName} ${user.lastName}, device-${req.body.device}`
    );
    const families = await database.userFamiliesTable.getFamilies(user.userKey);
    res.json({
      userKey: user.userKey,
      genUserId: user.genUserId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      mobile: user.mobile,
      gender: user.gender,
      birthDate: user.birthDate,
      imageName: user.imageName,
      countryIsoCode: user.countryIsoCode,
      regionKey: user.regionKey,
      hash: user.hash,
      nameChanged: user.nameChanged,
      families: families,
    });
  }
};

const getOrganizerSignInAccessToken = (
  expiresIn,
  device,
  organizerKey,
  organizationKey,
  countryIsoCode,
  regionKey,
  name,
  role
) => {
  const payload = {
    device,
    organizerKey,
    organizationKey,
    countryIsoCode,
    regionKey,
    name,
    role,
  };
  const options = {
    issuer: "Wavesoft",
    expiresIn: expiresIn,
  };

  return jwt.sign(payload, ACCESS_TOKEN_SECRET, options);
};

const getUserSignInAccessToken = (
  expiresIn,
  device,
  userKey,
  email,
  countryIsoCode,
  regionKey,
  name
) => {
  const payload = {
    device,
    userKey,
    email,
    countryIsoCode,
    regionKey,
    name,
  };
  const options = {
    issuer: "Wavesoft",
    expiresIn: expiresIn,
  };

  return jwt.sign(payload, ACCESS_TOKEN_SECRET, options);
};

const getOrganizerSignInRefreshToken = (device, organizerKey) => {
  const payload = { device, organizerKey };
  const options = {
    issuer: "Wavesoft",
  };

  return jwt.sign(payload, REFRESH_TOKEN_SECRET, options);
};

const getUserSignInRefreshToken = (device, userKey) => {
  const payload = { device, userKey };

  const options = {
    issuer: "Wavesoft",
  };

  return jwt.sign(payload, REFRESH_TOKEN_SECRET, options);
};

const verifySignInAccessToken = (req, res, next) => {
  const accessToken = req.cookies.access_token;
  if (functions.isEmpty(accessToken)) {
    log.trace("Token refresh token ----");

    const refreshToken = req.cookies.internal_token;
    if (functions.isEmpty(refreshToken)) {
      log.trace("Token verifySignInAccessToken ---- Unauthorized");
      return res.sendStatus(401);
    }
    jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, async (err, payload) => {
      if (err) {
        log.trace("Token verifySignInRefreshToken ---- Invalid");
        return res.status(401).json({ error: err.message });
      }

      try {
        let user = null;
        let product;
        if (functions.hasValue(payload.userKey)) {
          product = PRODUCT_USER;
          user = await database.organizersUsers.getUserByKey(
            product,
            payload.userKey
          );
          if (functions.hasValue(user) && user.hash !== USER_HASH_SUSPENDED) {
            req.auth = {
              userKey: user.userKey,
              email: user.email,
              countryIsoCode: user.countryIsoCode,
              regionKey: user.regionKey,
            };
            log.trace(
              `${req.method} ${req.originalUrl} ---- userKey-${payload.userKey}, device-${payload.device}`
            );
          }
        }
        if (functions.hasValue(payload.organizerKey)) {
          product = PRODUCT_ORGANIZER;
          user = await database.organizersUsers.getUserByKey(
            PRODUCT_ORGANIZER,
            payload.organizerKey
          );
          if (functions.hasValue(user) && user.hash !== USER_HASH_SUSPENDED) {
            req.auth = {
              organizerKey: user.organizerKey,
              organizationKey: user.organizationKey,
              countryIsoCode: user.countryIsoCode,
              regionKey: user.regionKey,
            };
            log.trace(
              `${req.method} ${req.originalUrl} ---- organizerKey-${payload.organizerKey}, device-${payload.device}`
            );
          }
        }
        if (functions.hasValue(user) && user.hash !== USER_HASH_SUSPENDED) {
          processToken(
            req,
            res,
            product,
            SIGNIN_TYPE_UNDEFINED,
            payload.device,
            user,
            true
          );
          next();
        } else {
          log.trace("Token refresh token ---- Invalid");
          return res
            .status(401)
            .json({ error: "can not get user from refresh token" });
        }
      } catch (error) {
        log.error(`Token refresh token ---- ${error.message}`);
        return res
          .status(401)
          .json({ error: "can not get user from refresh token" });
      }
    });
    return;
  }
  jwt.verify(accessToken, ACCESS_TOKEN_SECRET, (err, payload) => {
    if (err) {
      log.trace("Token verifySignInAccessToken ---- Invalid");
      return res.status(401).json({ error: err.message });
    }
    req.auth = payload;

    if (functions.hasValue(payload.userKey)) {
      log.trace(
        `${req.method} ${req.originalUrl} ---- ${payload.name}, userKey-${payload.userKey}, device-${payload.device}`
      );
    }
    if (functions.hasValue(payload.organizerKey)) {
      log.trace(
        `${req.method} ${req.originalUrl} ---- ${payload.name}, organizerKey-${payload.organizerKey}, device-${payload.device}`
      );
    }

    next();
  });
};

const getEmailAccessToken = (email, product, name) => {
  let expiresIn = TEN_MINUTE;

  const payload = { email, product, name };
  const options = {
    issuer: "bookingcircle",
    expiresIn: expiresIn,
  };

  return jwt.sign(payload, EMAIL_TOKEN_SECRET, options);
};

const verifyEmailAccessToken = (accessToken) => {
  try {
    if (accessToken === null || accessToken === undefined) {
      return { email: "", product: 0, name: "" };
    }

    let payload = jwt.verify(accessToken, EMAIL_TOKEN_SECRET);
    return {
      email: payload.email,
      product: payload.product,
      name: payload.name,
    };
  } catch (error) {
    log.trace(`Token verifyEmailAccessToken ---- ${error.message}`);
    return { email: "", product: 0, name: "" };
  }
};

const getWebRegisterAccessToken = (
  userKey,
  email,
  countryIsoCode,
  regionKey
) => {
  let expiresIn = HALF_HOUR;

  const payload = { userKey, email, countryIsoCode, regionKey };
  const options = {
    issuer: "bookingcircle",
    expiresIn: expiresIn,
  };

  return jwt.sign(payload, EMAIL_TOKEN_SECRET, options);
};

const verifyWebRegisterAccessToken = (accessToken) => {
  try {
    if (accessToken === null || accessToken === undefined) {
      return { userKey: 0, email: "", countryIsoCode: "", regionKey: 0 };
    }

    let payload = jwt.verify(accessToken, EMAIL_TOKEN_SECRET);
    return {
      userKey: payload.userKey,
      email: payload.email,
      countryIsoCode: payload.countryIsoCode,
      regionKey: payload.regionKey,
    };
  } catch (error) {
    log.error(`Token verifyWebRegisterAccessToken ---- ${error.message}`);
    return { userKey: 0, email: "", countryIsoCode: "", regionKey: 0 };
  }
};

exports.verifySignInAccessToken = verifySignInAccessToken;
exports.getEmailAccessToken = getEmailAccessToken;
exports.verifyEmailAccessToken = verifyEmailAccessToken;
exports.processToken = processToken;
exports.getWebRegisterAccessToken = getWebRegisterAccessToken;
exports.verifyWebRegisterAccessToken = verifyWebRegisterAccessToken;
exports.COOKIE_ACCESS_TOKEN = COOKIE_ACCESS_TOKEN;
exports.COOKIE_REFRESH_TOKEN = COOKIE_REFRESH_TOKEN;
exports.COOKIE_SESSION_INFOR = COOKIE_SESSION_INFOR;

//frank
exports.ACCESS_TOKEN_SECRET = ACCESS_TOKEN_SECRET;
exports.REFRESH_TOKEN_SECRET = REFRESH_TOKEN_SECRET;
exports.EMAIL_TOKEN_SECRET = EMAIL_TOKEN_SECRET;
