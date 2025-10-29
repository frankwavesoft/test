const uuid = require("uuid");
const fs = require("fs");
const log = require("./log");

const isEmpty = (value) => {
  return value === undefined || value === null;
};

const hasValue = (value) => {
  return value !== undefined && value !== null;
};

const getUuid = () => {
  return uuid.v4();
};

const getUniqueIdByLength = (length) => {
  let result = "";
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const charactersLength = characters.length;
  let counter = 0;
  let char;
  while (counter < length) {
    char = characters.charAt(Math.floor(Math.random() * charactersLength));
    result += char;
    counter += 1;
  }

  return result;
};

// By Timothy Chen
const getNumberCode = (length) => {
  let result = "";
  const characters = "0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  let char;
  while (counter < length) {
    char = characters.charAt(Math.floor(Math.random() * charactersLength));
    result += char;
    counter += 1;
  }

  return result;
};

const getFullName = (firstName, lastName) => {
  let name = "";
  if (hasValue(firstName) && firstName.length > 0) {
    name = firstName;
  }

  if (hasValue(lastName) && lastName.length > 0) {
    name = name + " " + lastName;
  }
  return name;
};

const TestingCode = () => {};

const parseWebIdFromDatabase = (databaseWebId) => {
  const a = databaseWebId.split("+");
  if (a.length > 1) {
    const prefix = a[0];
    if (prefix.length === 7) {
      const integerValue = parseInt(prefix);
      if (formatWebIdPrefix(integerValue) === prefix + "+") {
        return { prefix: integerValue, originalWebId: a[1] };
      }
    }
  }
  return { prefix: null, originalWebId: databaseWebId };
};

const formatWebIdPrefix = (sequence) => {
  return sequence.toString().padStart(7, 0) + "+";
};

const getQuantityFromFamilies = (families) => {
  try {
    if (isEmpty(families) || families.length === 0) {
      return 1;
    }
    const arrayFamily = families.split("-");
    if (arrayFamily.length === 0) {
      return 1;
    } else {
      return arrayFamily.length;
    }
  } catch (error) {
    return 1;
  }
};

const getFamilyMembersFromFamilies = (families) => {
  try {
    if (isEmpty(families) || families.length === 0) {
      return null;
    }
    const arrayFamily = families.split("-");
    let arrayFamilyOut = [];
    let n;
    let f;
    for (n = 0; n < arrayFamily.length; n++) {
      f = parseInt(arrayFamily[n]);
      if (f > 0) {
        arrayFamilyOut.push(f);
      }
    }

    return arrayFamilyOut;
  } catch (error) {}
  return null;
};

exports.isEmpty = isEmpty;
exports.hasValue = hasValue;
exports.getUuid = getUuid;
exports.getUniqueIdByLength = getUniqueIdByLength;
exports.getNumberCode = getNumberCode;
exports.getFullName = getFullName;
exports.TestingCode = TestingCode;
exports.parseWebIdFromDatabase = parseWebIdFromDatabase;
exports.formatWebIdPrefix = formatWebIdPrefix;
exports.getQuantityFromFamilies = getQuantityFromFamilies;
exports.getFamilyMembersFromFamilies = getFamilyMembersFromFamilies;
