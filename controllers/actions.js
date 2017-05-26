'use strict';

const Wit = require('../wit');
const config = require('../config');
const logger = require('../log');
const initData = require('./init');
const traverse = require('traverse');
const views = require('../views/views');
const tagtree = require('../data/tagtree');
const {Tag} = require('../data/tags');
const {Article} = require('../data/articles');
const {EventCategory, Event} = require('../data/events');
const { dataManager } = require('../data/datamanager');
const db = require('../data/db');
/*const vision = require('@google-cloud/vision')({
  projectId: 'ccc-bot-150816',
  credentials: {
    'client_email': 'digital@christchurchchislehurst.org',
    'private_key': 'AIzaSyDH5NzYU6TTWy2w0jGPNjHOQUCpqRn0LaY'
  }
});*/

// Wit.ai parameters
//const WIT_TOKEN = process.env.WIT_TOKEN;
const WIT_TOKEN = config.wit.accessToken;
const FB_PAGE_TOKEN = config.fb.pageToken;

// ----------------------------------------------------------------------------
// Messenger API specific code

// See the Send API reference
// https://developers.facebook.com/docs/messenger-platform/send-api-reference

const sendFbPostback =  (body) => {
  const url = `${config.fb.apiUrl}/me/messages?access_token=${encodeURIComponent(FB_PAGE_TOKEN)}`;
  const bodyJson = JSON.stringify(body);
  logger.debug(`Sending to Facebook: ${bodyJson}` );

  return fetch(url, {
    method: `POST`,
    headers: {'Content-Type': 'application/json'},
    body: bodyJson,
  })
  .then(rsp => rsp.json())
  .then(json => {
    if (json.error && json.error.message) {
      logger.error(`Facebook error response: ${json.error.message}`);
      throw new Error(json.error.message)
    }
    return bodyJson;
  });
};

const sendUserResponse = (session, body) => {
  // If we are not collecting responses, then post to FB.
  if(!session.responses) {
    if(Array.isArray(body)) {
      let promises = [];
      for(let message of body)
        promises.push(sendFbPostback(message))

      return Promise.all(promises);
    }
    else
      return sendFbPostback(body)
  }
  else {
    if(Array.isArray(body)) {
      for (let message of body)
        session.responses.push(message)
    }
    else
      session.responses.push(body);

    return Promise.resolve();
  }
};

const init = () => {
    return initData().then(([tagsByTitle, articlesByTitle]) => {
      // Our bot actions
      class ActionController {
        constructor(views) {
          let controller = this;
          this.actions = {
            send({sessionId, context}, response) {
              let session =  controller.sessions[sessionId]; // Gets the session object.

              if(!session.userId)
                return Promise.resolve();

              // Yay, we found our recipient!
              // Let's forward our bot response to her.
              // We return a promise to let our bot know when we're done sending
              let body = session.render ? session.render(session) : views.renderDefault(session);
              return sendUserResponse(session, body);
             },
            getFaithInfo({sessionId, context, entities})  {
              return new Promise(function (resolve, reject) {
                let session =  controller.sessions[sessionId]; // Gets the session object.
                session.render = views.renderFaithInfo; // Specifies what view should be used to generate the JSON response.

                let person = ActionController.firstEntityValue(entities, 'person');

                if (person && person.toLowerCase() == "jesus") {
                  context.info = true;
                  delete context.noInfo;
                } else {
                  context.noInfo = true;
                  delete context.info;

                }
                return resolve(context);
              });
            },
            getGeneralEventInfo({sessionId, context, entities}) {
              logger.debug(`Getting general event info ...`);
              return new Promise(function (resolve, reject) {
                let session = controller.sessions[sessionId]; // Gets the session object.
                session.intent = ActionController.getIntent(entities);
                session.intentConfidence = ActionController.getIntentConfidence(entities);
                session.events = [];

                // Retrieve the most imminent upcoming events.
                db.getGeneralEventRows(
                  function (err, rows, fields) {
                    if (err) throw err;

                    logger.debug(`Retrieved '${rows.length}' rows ...`);

                    // Adds the events to the context
                    for (let row of rows)
                      session.events.push(row)

                    session.render = views.renderGeneralEvent;
                    delete context.noInfo;
                    return resolve(context);
                  });
              });
            },
            getSpecificEventInfo({sessionId, context, entities}) {
              logger.debug(`Getting specific event info ...`);
              return new Promise(function (resolve, reject) {
                let session =  controller.sessions[sessionId]; // Gets the session object
                session.intent = ActionController.getIntent(entities);
                session.intentConfidence = ActionController.getIntentConfidence(entities);

                let eventType = ActionController.firstEntityValue(entities, 'event_type');
                if(!eventType) {
                  context.noInfo = true;
                  delete context.info;

                  session.render = views.renderSpecificEvent; // Specifies what view should be used to generate the JSON response.

                  return resolve(context);
                }

                if (eventType) {
                  let tagNode = Tag.byName.get(eventType);
                  let articleNode = Article.byName.get(eventType);

                  if(!tagNode) {
                    logger.warn(`No tag found for event type '${eventType}'.`);
                    return resolve(context);
                  }

                  logger.debug(`Found tag for event type '${eventType}' and UI name '${tagNode.uiName}'.`);

                  let catIds = traverse(tagNode).reduce((acc, node) => {
                    if (node && node instanceof EventCategory)
                      acc.push(node.id);
                    return acc;
                  }, []);

                  logger.debug(`Found the following category IDs for ${eventType}: ${catIds}`);


                  context.info = true;  // Makes sure that info is defined so it can be sent from wit.

                  session.events = [];
                  session.eventType = eventType;
                  session.uiEventType = tagNode.uiName;
                  session.tag = tagNode;
                  session.render = views.renderSpecificEvent; // Specifies what view should be used to generate the JSON response.

                  if (articleNode)
                    session.activity = articleNode;

                  if (catIds.length > 0) {
                    logger.debug(`Retrieving event data ...`);

                    db.getSpecificEventRows(catIds,
                      function (err, rows, fields) {
                      if (err) throw err;

                      logger.debug(`Retrieved '${rows.length}' rows ...`);

                      // Adds the events to the context
                      for (let row of rows)
                        session.events.push(row)

                      delete context.noInfo;
                      return resolve(context);
                    });
                  }
                  else
                    return resolve(context);

                }
              });
            },
            sayHello({sessionId, context, entities}) {
              return new Promise(function (resolve, reject) {
                let session =  controller.sessions[sessionId]; // Gets the session object.
                session.intent = ActionController.getIntent(entities);
                session.intentConfidence = ActionController.getIntentConfidence(entities);
                session.render = views.renderHello; // Specifies what view should be used to generate the JSON response.
                return resolve();
              });
            }
            // You should implement your custom actions here
            // See https://wit.ai/docs/quickstart
          };

          // Setting up our bot
          this.wit = new Wit({
            accessToken: WIT_TOKEN,
            actions: this.actions,
            logger
          });

          // ----------------------------------------------------------------------------
          // Wit.ai bot specific code

          // This will contain all user sessions.
          // Each session has an entry:
          // sessionId -> {userId: facebookUserId, context: sessionState}

          this.sessions = {};
        }

        findOrCreateSession(userId) {
          let sessionId;
          // Let's see if we already have a session for the user userId
          Object.keys(this.sessions).forEach(k => {
            if (this.sessions[k].userId === userId) {
              // Yep, got it!
              sessionId = k;
            }
          });
          if (!sessionId) {
            // No session found for user userId, let's create a new one
            sessionId = new Date().toISOString();
            this.sessions[sessionId] = {userId: userId, context: {}};
          }
          return sessionId;
        };

        static firstEntityValue(entities, entity) {
          const val = entities && entities[entity] &&
              Array.isArray(entities[entity]) &&
              entities[entity].length > 0 &&
                entities[entity][0].value
            ;
          if (!val) return null;

          return typeof val === 'object' ? val.value : val;
        };

        static getIntent(entities) {
          return ActionController.firstEntityValue(entities, 'intent');
        };

        static getIntentConfidence(entities) {
          const entity = 'intent';

          const val = entities && entities[entity] &&
              Array.isArray(entities[entity]) &&
              entities[entity].length > 0 &&
              entities[entity][0].confidence
            ;

          return val ? val : null;
        };


        processRequest(senderId, text, attachments, sticker_id, res, synchronous = false) {
          // We retrieve the user's current session, or create one if it doesn't exist
          // This is needed for our bot to figure out the conversation history
          const sessionId = this.findOrCreateSession(senderId);
          let session = this.sessions[sessionId];
          let context = session.context || {}; // Initialises the context if it doesn't exist already.
          session.context = context;
          session.render = undefined; // Specifies the default renderer.
          session.eventType = undefined;
          session.uiEventType = undefined;
          session.events = undefined;
          session.activityUrl = undefined;
          session.tag = undefined;
          session.activity = undefined;
          session.intentConfidence = 0;

          // If we're running synchronous mode then we need to collect all the responses to the user.
          if(synchronous)
            session.responses = [];

          // Let's tell the user that we received the request and we're working on it.
          if (senderId) {
            const body = {
              recipient: { id: senderId },
              sender_action: 'typing_on',
            };

            sendUserResponse(session, body);
          }

          if(sticker_id) {
            switch(sticker_id ) {
              case 369239263222822:
                sendUserResponse(session, views.renderThankYou(session));
                break;
              case 126361967548600:
                sendUserResponse(session, views.renderThatsFunny(session));
                break;
              default:
                var types = [
                  'face',
                  'label'
                ];

                if(attachments && attachments.length >= 1 && attachments[0].type == 'image') {
                  // Request sticker image and encode it with Base64.
                  fetch(attachments[0].payload.url).then(rsp => {
                    if (rsp.status == 200) {
                      const imageData = new Buffer(rsp.body).toString('base64');

                      fetch(url, {
                        method: `POST`,
                        headers: {'Content-Type': 'application/json'},
                        body: imageData,
                      })
                        .then(rsp => rsp.json())
                        .then(json => {
                          if (json.error && json.error.message) {
                            logger.error(`Facebook error response: ${json.error.message}`);
                            throw new Error(json.error.message)
                          }
                          return bodyJson;
                        });
                    }
                  });
                  return

                }
            }

          } else if (attachments) {
            // We received an attachment
            // Let's reply with an automatic message
            // TODO: add error handling res.body = resProcessor(sessionId, 'Sorry I can only process text messages for now.');
          } else if (text) {
            // Let's forward the message to the Wit.ai Bot Engine
            // This will run all actions until our bot has nothing left to do
            return this.wit.runActions(
              sessionId, // the user's current session
              text, // the user's message
              context // the user's current session state
            ).then(() => {

              // Updating the user's current session state
              session.context = context;

              if (synchronous)
                res.send(JSON.stringify(session.responses));

              return context

            })
          } else {
            res.status(500).send("Nothing to do.");
            return Promise.resolve(context);
          }
        };
      }

      return new ActionController(views);
    });
}

module.exports = init;