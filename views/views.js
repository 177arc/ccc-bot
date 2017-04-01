'use strict'

const dateFormat = require('dateformat');
const config = require('../config');

const renderText = (userId, text) => {
  return {
    recipient: {id: userId},
    message: {text: text}
  };
};

const renderButtons = (userId, text, buttons) => {
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
};

const renderEvents = (userId, intro, events, tag, activity) => {
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

  if(tag || activity) {
    let eventResult =  {
      title: `Find out more`,
      type: "web_url",
      url: activity ? activity.url : tag.url,
      messenger_extensions: true,
    };

    result[1].message.attachment.payload.buttons.push(eventResult);
  }

  for(let event of events) {
    if(result[1].message.attachment.payload.elements.length >= 3)
      break;

    let images = undefined;
    try { images = event.images ? JSON.parse(event.images) : undefined } catch (ex) {}

    // If a master URL is available, let's us that, if not, create a URL to the event.
    let url = event.url ? `${config.url}${event.url}` : `${config.url}/whats-on/event-calendar/${event.id}`;
    let eventResult = {
      title: event.title,
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

const views = {
  renderGeneralEvent: ({userId, events}) => {
    let eventsText;

    if (events.length) {
      eventsText = `We have some events that you may be interested in.`;
    }
    else
      eventsText = `There are currently no events planned.`;

    return renderEvents(userId, eventsText, events);
  },
  renderSpecificEvent: ({userId, eventType, uiEventType, events, tag, activity}) => {
    let eventsText;

    if (!eventType) {
      eventsText = `Ops ... really sorry. We don't run any such events.`;
    } else if (events.length > 0) {
      eventsText = `We have some events that you may be interested in.`;
    }
    else
      eventsText = `There are currently no ${uiEventType} events planned.`;

    return renderEvents(userId, eventsText, events, tag, activity);
    if (activityUrl) {
      return renderButtons(userId, eventsText, [
        {
          type: "web_url",
          url: activityUrl,
          title: "Find out more"
        }
      ])
    }
  },
  renderFaithInfo: ({userId, person}) => {
    if (person && person.toLowerCase() == "jesus") {
      return renderText(userId, 'Ah, I\'ve got a video on that: https://www.youtube.com/watch?v=rlcWSp7PwJI');
    }
    else {
      return renderText(userId, `Sorry, I don't know anything on ${person} but Google may ...`);
    }
  },
  renderDefault: ({userId}) => {
    return renderText(userId, `Sorry, I'm not entirely sure what you mean. Please try to say it in a different way.`);
  },
  renderThankYou: ({userId}) => {
    return renderText(userId, `Thankx! 😀`);
  },
  renderThatsFunny: ({userId}) => {
    return renderText(userId, `Yah, that's funny 😀`);
  },
  renderHello: ({userId}) => {
    return renderText(userId, `Hi there! How can I help?`);
  }
};

module.exports = views;