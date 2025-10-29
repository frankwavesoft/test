const functions = require("./functions");

const jsonArrayToSQLArray = (jArray, key) => {
  try {
    let sqlArray = jArray.map((el) => {
      return el[key];
    });
    return sqlArray;
  } catch {
    return [];
  }
};

const parseOffsetAndLimit = (req, total, maxLimit, isPost) => {
  let offset;
  let limit;

  if (isPost) {
    offset = req.body.offset;
    limit = req.body.limit;
  } else {
    offset = req.query.offset;
    limit = req.query.limit;
  }

  if (functions.hasValue(offset)) {
    offset = parseInt(offset);
    if (offset > total) {
      offset = total;
    }
  } else {
    offset = 0;
  }

  if (functions.hasValue(limit)) {
    limit = parseInt(limit);
    if (limit > total - offset) {
      limit = total - offset;
    }
  } else {
    limit = total - offset;
  }
  if (limit > maxLimit) {
    limit = maxLimit;
  }

  return { offset, limit };
};

exports.jsonArrayToSQLArray = jsonArrayToSQLArray;
exports.parseOffsetAndLimit = parseOffsetAndLimit;
