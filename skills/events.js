const logger = require('../log');
const {messenger} = require('../views/messenger');
const traverse = require('traverse');
const {skillsManager, Skill} = require('./skillsmanager');
const {EventCategory} = require('../data/events');
const {data} = require('../data/datamanager');

class SpecificEventsSkill extends Skill {
  getGeneral({session, context, entities}) {
    logger.debug(`Getting general event info ...`);
    return new Promise(function (resolve, reject) {
      session.intent = Skill.getIntent(entities);
      session.intentConfidence = Skill.getIntentConfidence(entities);

      session.events = [];
      data.eventsById.forEach(event => session.events.push(event));
      session.events = session.events.sort((a, b) => a.startDate > b.startDate);
      session.render = args => messenger.renderEvents(args);
      return resolve();
    });
  }

  getSpecific({session, context, entities}) {
    logger.debug(`Getting specific event info ...`);

    return new Promise(function (resolve, reject) {
      session.intent = Skill.getIntent(entities);
      session.intentConfidence = Skill.getIntentConfidence(entities);

      let eventType = Skill.firstEntityValue(entities, 'event_type');
      if (!eventType) {
        context.noInfo = true;
        delete context.info;

        session.render = args => messenger.renderDefault(args); // Specifies what view should be used to generate the JSON response.

        return resolve();
      }

      if (eventType) {
        let tagNode = data.tagsByName.get(eventType);
        let articleNode = data.articlesByName.get(eventType);

        if (!tagNode) {
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
        session.render = args => messenger.renderEvents(args); // Specifies what view should be used to generate the JSON response.

        if (articleNode)
          session.activity = articleNode;

        if (catIds.length > 0) {
          logger.debug(`Getting event data ...`);

          // Gets all events with for the given category IDs, sorts it by start date in reverse order.
          catIds.forEach(catId => data.eventCategoriesById.get(catId).events
            .forEach(event => session.events.push(event)));
          session.events = session.events.sort((a, b) => a.startDate > b.startDate);
        }

        return resolve();
      }
    });
  }

}

skillsManager.register(new SpecificEventsSkill());