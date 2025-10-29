const express = require("express");
const https = require("https");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const helmet = require("helmet");
require("dotenv").config();
const log = require("./miscellaneous/log");
log.init();


const app = express();

// Set security HTTP headers
app.use(helmet());

// httponly cookie
const hostName = process.env.HOST_NAME;
const isAzure = hostName.includes("azure");
const isHttps = hostName.includes("https");
const isLocal = hostName.includes("://192.168.");

app.use(cors({ credentials: true, origin: process.env.ALLOW_ORIGIN }));
// app.use(cors({ credentials: true }));
app.use(cookieParser());

app.use(
  bodyParser.json({
    verify: function (req, res, buf) {
      if (
        req.originalUrl === "/v1/stripe/webhook-connect" ||
        req.originalUrl === "/v1/stripe/webhook"  ||
        //frank
        req.originalUrl === "/v1/business_payment_stripe/webhook-connect" ||
        req.originalUrl === "/v1/business_payment_stripe/webhook"  
      ) {
        req.rawBody = buf;
      }
    },
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/images", (req, res, next) => {
  token.verifySignInAccessToken(req, res, next);
});
app.use("/images", express.static("images"));
// app.use("/public", express.static("public"));

// middleware
// if (true) {
//   const middlewareFunction = (req, res, next) => {
//     log.trace(`Client request ---- ${req.method} ${req.url}`);
//     next();
//   };
//   app.use(middlewareFunction);
// }

// home
app.get("/", async (req, res) => {
  // console.log(process.env.STRIPE_WEBHOOK_SECRET);
  // console.log(process.env.STRIPE_WEBHOOK_CONNECT_SECRET);
  const dateNow = new Date();
  res.send(`${hostName}: ${dateNow.toUTCString()}`);
});

app.post("/", async (req, res) => {

   log.trace(`recived : ${JSON.stringify(req.body)}`);
  const dateNow = new Date();
  res.send(`${hostName}: ${dateNow.toUTCString()}`);
});



if (!isAzure) {
  if (isHttps) {
    const originArray = hostName.split("://");
    let certFileName = null;
    if (isHttps && originArray.length === 2) {
      certFileName = originArray[1];
    }
    let sslServer;
    if (isLocal) {
      sslServer = https.createServer(
        {
          key: fs.readFileSync("../certkey/key.pem"),
          cert: fs.readFileSync("../certkey/cert.pem"),
        },
        app
      );
    } else {
      const cert1 = fs.readFileSync(`../certkey/${certFileName}.crt`);
      const cert2 = fs.readFileSync(`../certkey/${certFileName}.int`);
      const totalBytes = cert1.length + cert2.length;
      const cert = Buffer.concat([cert1, cert2], totalBytes);
      sslServer = https.createServer(
        {
          key: fs.readFileSync(`../certkey/${certFileName}.key`),
          cert: cert,
        },
        app
      );
    }

    sslServer.listen(process.env.PORT, () => {
      log.trace(`Git Server ---- running on port ${process.env.PORT}`);
    });
  } else {
    app.listen(process.env.PORT, () => {
      log.trace(`Git server ---- running on port ${process.env.PORT}`);
    });
  }
} else {
  app.listen(process.env.PORT, () => {
    log.trace(`Git-server ---- running`);
  });
}
