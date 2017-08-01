const logger = require('../log');
const dateFormat = require('dateformat');
const traverse = require('traverse');
const config = require('../config');

const {skillsManager, Skill} = require('./skillsmanager');
const {EventCategory} = require('../data/events');
const {ListResponse, ListItem, LinkButton} = require('./../views/models');
const {data} = require('../data/datamanager');

class SpecificEventsSkill extends Skill {
  getGeneral({response}) {
    logger.debug(`Getting general event info ...`);
    // Gets all the events and sorts them by start date/time.
      let events = Array.from(data.eventsById, ([key, value]) => { return value })
          .sort((a, b) => a.startDate - b.startDate)
          .slice(0, 5);

      response.model = this.eventsToModel(`Here are some events that you maybe interested in:`, events);
      context.info = true;  // Makes sure that info is defined so it can be sent from wit.
      return;
  }

  getSpecific({context, entities, response}) {
    logger.debug(`Getting specific event info ...`);

    let eventType = this.firstEntityValue(entities, 'event_type');
    if (!eventType) {
      context.noInfo = true;
      delete context.info;

      response.model = this.textToModel(`Sorry, we don't have any such events 😕`);
      return context;
    }

    let tag = data.tagsByName.get(eventType);
    let activity = data.articlesByName.get(eventType);

    if (!tag) {
      logger.warn(`No tag found for event type '${eventType}'.`);
      response.model = this.textToModel(`Yeah, I recognise this but I can't find any ${eventType} events. Sorry 😕`);
      return context;
    }

    logger.debug(`Found tag for event type '${eventType}' and UI name '${tag.uiName}'.`);

    let categories = traverse(tag).reduce((acc, node) => {
        if (node && node instanceof EventCategory)
            acc.push(node);
        return acc;
    }, []);

    logger.debug(`Found ${categories.length} event categories found for ${eventType}.`);

    // Gets all events with for the given category IDs, sorts it by start date in reverse order.
    let events = [];
    categories.forEach(category => category.events.forEach(event => events.push(event)));
    events = events.sort((a, b) => a.startDate - b.startDate);
    response.model = this.eventsToModel(`Next up are:`, events, tag, activity);
    context.info = true;  // Makes sure that info is defined so it can be sent from wit.

    return context;
  }

  // Maps the given events and context information to a list response model.
  eventsToModel(intro, events, tag, activity) {
    let model = new ListResponse({});
    model.text =  intro;
    model.list = events.map(event => this.eventToModel(event));

    if(tag || activity)
      model.more = new LinkButton({
          title: `Find out more`,
          linkUrl: activity ? activity.url : tag.url
      });

    return model;
  }

  // Maps the given event to a list item model.
  eventToModel(event) {
    let listItem = new ListItem();
    listItem.title = event.name;
    listItem.subTitle = `${dateFormat(event.startDate, "dS mmm, h:MM TT")}`;

    let images = undefined;
    try {
        images = event.images ? JSON.parse(event.images) : undefined
    } catch (ex) {
    }

    listItem.imageUrl = images ? `${config.url}/${images.image1}` : undefined;
    // If a master URL is available, let's use that, if not, create a URL to the event.
    let url = event.url ? `${config.url}${event.url}` : `${config.url}/whats-on/event-calendar/${event.id}`;
    listItem.linkUrl = url;

    let button = new LinkButton();
    button.title = `Find more`;
    button.linkUrl = url;

    listItem.button = button;
    return listItem;
  }
}

skillsManager.register(new SpecificEventsSkill());