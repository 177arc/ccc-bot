'use strict';

// Messenger API integration example
// We assume you have:
// * a Wit.ai bot setup (https://wit.ai/docs/quickstart)
// * a Messenger Platform setup (https://developers.facebook.com/docs/messenger-platform/quickstart)
// You need to `npm install` the following dependencies: body-parser, express, request.
//
// 1. npm install body-parser express request
// 2. Download and install ngrok from https://ngrok.com/download
// 3. ./ngrok http 8445
// 4. WIT_TOKEN=your_access_token FB_APP_SECRET=your_app_secret FB_PAGE_TOKEN=your_page_token node examples/messenger.js
// 5. Subscribe your page to the Webhooks using verify_token and `https://<your_ngrok_io>/webhook` as callback URL.
// 6. Talk to your bot on Messenger!

const bodyParser = require('body-parser');
const crypto = require('crypto');
const express = require('express');
const fetch = require('node-fetch');
const request = require('request');
const config = require('./config');
const logger = require('./log');
const initActions = require('./controllers/actions');

logger.info(`Starting with ${config.name} configuration ...`);

// Webserver parameter
const PORT = process.env.PORT || config.port;

// Messenger API parameters
const FB_PAGE_ID = config.fb.pageId;
if (!FB_PAGE_ID) { throw new Error('missing FB_PAGE_ID') }

const FB_APP_SECRET = config.fb.appSecret;
if (!FB_APP_SECRET) { throw new Error('missing FB_APP_SECRET') }

let FB_VERIFY_TOKEN = null;
crypto.randomBytes(8, (err, buff) => {
  if (err) throw err;
  FB_VERIFY_TOKEN = buff.toString('hex');
  logger.info(`/webhook will accept the Verify Token "${FB_VERIFY_TOKEN}"`);
});


/*
 * Verify that the callback came from Facebook. Using the App Secret from
 * the App Dashboard, we can verify the signature that is sent with each
 * callback in the x-hub-signature field, located in the header.
 *
 * https://developers.facebook.com/docs/graph-api/webhooks#setup
 *
 */
function verifyRequestSignature(req, res, buf) {
  let signature = req.headers["x-hub-signature"];

  if (!signature) {
    // For testing, let's log an error. In production, you should throw an
    // error.
    logger.error("Couldn't validate the signature.");
  } else {
    let elements = signature.split('=');
    let signatureHash = elements[1];

    let expectedHash = crypto.createHmac('sha1', FB_APP_SECRET)
        .update(buf)
        .digest('hex');

    if (signatureHash != expectedHash) {
      throw new Error("Couldn't validate the request signature.");
    }
  }
}

initActions().then((controller) => {
  // Starting our webserver and putting it all together
  const app = express();
  app.use(({method, url}, rsp, next) => {
    rsp.on('finish', () => {
      logger.info(`${rsp.statusCode} ${method} ${url}`);
    });
    next();
  });
  app.use(bodyParser.json({verify: verifyRequestSignature}));


  // Webhook setup
  app.get('/webhook', (req, res) => {
    if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === FB_VERIFY_TOKEN) {
      res.send(req.query['hub.challenge']);
    } else {
      res.sendStatus(400);
    }
  });


  app.post('/test', (req, res) => {
    const data = req.body;
    let {senderId, text, attachments} = data;
    controller.processRequest(senderId, text, attachments, undefined, res, true).then((context) => {
      // Our bot did everything it has to do.
      // Now it's waiting for further messages to proceed.
      logger.debug('Waiting for next user messages');

      // Based on the session state, you might want to reset the session.
      // This depends heavily on the business logic of your bot.
      // Example:
      // if (context['done']) {
      //   delete sessions[sessionId];
      // }

    })
      .catch((err) => {
        logger.error('Oops! Got an error from Wit: ', err.stack || err);
        res.status(500).send(err.message);
      });
  });


  // Message handler
  app.post('/webhook', (req, res) => {
    // Parse the Messenger payload
    // See the Webhook reference
    // https://developers.facebook.com/docs/messenger-platform/webhook-reference

    const data = req.body;

    if (data.object === 'page') {
      let senderId;

      data.entry.forEach(entry => {
        entry.messaging.forEach(event => {
          if (event.message) {
            // Yay! We got a new message!
            // We retrieve the Facebook user ID of the sender
            senderId = event.sender.id;

            // We retrieve the message content
            const {text, attachments, sticker_id} = event.message;

            // We received a text message
            logger.debug('received', JSON.stringify(event));

            controller.processRequest(senderId, text, attachments, sticker_id, res);
          } else {
            logger.debug('received event', JSON.stringify(event));
          }
        });
      });
    }

    // Let's acknowledge that we've received the request.
    res.sendStatus(200);
  });

  process.on('uncaughtException', (err) => {
    logger.error(`Unhandled exception: ${err}`);
  });

  app.listen(PORT);
  logger.info('Listening on :' + PORT + '...');
  logger.info(`Pointing to ${config.db.database} database ...`);
});