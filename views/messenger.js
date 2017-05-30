'use strict';

const config = require('../config');
const dateFormat = require('dateformat');

class Messenger {
  renderDefault({userId}) {
    return this.renderText(userId, `Sorry, I'm not entirely sure what you mean. Please try to say it in a different way.`);
  }

  renderText(userId, text) {
    return {
      recipient: {id: userId},
      message: {text: text}
    };
  }

  renderButtons(userId, text, buttons) {
    return {
      recipient: {id: userId},
      message: {
        attachment: {
          type: "template",
          payload: {
            template_type: "button",
            text: text,
            buttons
          }
        }
      }
    };
  }

  renderEvents({userId, eventType, uiEventType, events, tag, activity}) {
    let eventsText;

    if (!eventType && events.length == 0) {
      return messenger.renderText(userId, `Ops ... really sorry. We don't run any such events.`);
    } else if (eventType && events.length == 0) {
      return messenger.renderText(userId, `There are currently no ${uiEventType} events planned.`);
    }

    eventsText = `We have some events that you may be interested in.`;
    return this.renderEventList(userId, eventsText, events, tag, activity);
  }

  renderEventList(userId, intro, events, tag, activity) {
    let style = "compact";
    let result = [
      {
        recipient: {id: userId},
        message: {text: intro}
      },
      {
        recipient: {id: userId},
        message: {
          attachment: {
            type: "template",
            payload: {
              template_type: "list",
              top_element_style: style,
              elements: [],
              buttons: []
            }
          }
        }
      }];

    if (tag || activity) {
      let eventResult = {
        title: `Find out more`,
        type: "web_url",
        url: activity ? activity.url : tag.url,
        messenger_extensions: true,
      };

      result[1].message.attachment.payload.buttons.push(eventResult);
    }

    for (let event of events) {
      if (result[1].message.attachment.payload.elements.length >= 4)
        break;

      let images = undefined;
      try {
        images = event.images ? JSON.parse(event.images) : undefined
      } catch (ex) {
      }

      // If a master URL is available, let's us that, if not, create a URL to the event.
      let url = event.url ? `${config.url}${event.url}` : `${config.url}/whats-on/event-calendar/${event.id}`;
      let eventResult = {
        title: event.name,
        subtitle: `${dateFormat(event.startDate, "dS mmm, h:MM TT")}`,
        image_url: images ? `${config.url}/${images.image1}` : undefined,
        default_action: {
          type: "web_url",
          url: `${config.url}/whats-on/event-calendar/${event.id}`,
          messenger_extensions: true,
        },
        buttons: [
          {
            title: "Find out more",
            type: "web_url",
            url: url,
            messenger_extensions: true,
          }
        ]
      };

      result[1].message.attachment.payload.elements.push(eventResult);
    }

    return result;
  };
}

let messenger = new Messenger();
module.exports = {messenger};