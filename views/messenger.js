'use strict';

const config = require('../config');
const {SimpleResponse, ListResponse, CardResponse, CallButton, LinkButton} = require('./../views/models');

class Messenger {
    render({userId, model}) {
        if (model instanceof ListResponse)
            return this.renderList(userId, model);
        else if (model instanceof SimpleResponse)
            return this.renderText(userId, model);
        else if (model instanceof CardResponse)
            return this.renderCard(userId, model);
    }

    renderDefault({userId}) {
        return this.renderText(userId, `Sorry, I'm not entirely sure what you mean. Please try to say it in a different way.`);
    }

    renderText(userId, {text}) {
        return {
            recipient: {id: userId},
            message: {text: text}
        };
    }

    renderCard(userId, {title, subTitle, imageUrl, linkUrl, buttons}) {
        return {
            recipient: {id: userId},
            message: {
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "generic",
                        image_aspect_ratio: "square",
                        elements: [
                            {
                                title: title,
                                subtitle: subTitle,
                                image_url: imageUrl,
                                default_action: {
                                    type: "web_url",
                                    url: linkUrl,
                                    webview_height_ratio: "tall"
                                },
                                buttons: this.renderButtons(buttons)
                            }
                        ]
                    }
                }
            }
        };
    }

    renderList(userId, {text, list, more}) {
        let style = "compact";
        let result = [
            {
                recipient: {id: userId},
                message: {text: text}
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

        if (more) {
            result[1].message.attachment.payload.buttons.push({
                title: more.title,
                type: "web_url",
                url: more.linkUrl
            });
        }

        list.forEach(listItem => {
            if (result[1].message.attachment.payload.elements.length >= 4)
                return;

            let item = {
                title: listItem.title,
                subtitle: listItem.subTitle,
                image_url: listItem.imageUrl,
                default_action: {
                    type: "web_url",
                    url: listItem.linkUrl
                }
            };

            if(listItem.button)
                item.buttons = [this.renderButton(listItem.button)];

            result[1].message.attachment.payload.elements.push(item);
        });

        return result;
    };

    renderButtons(buttons) {
        let result = [];

        buttons.forEach(button => result.push(this.renderButton(button)));

        return result;
    }

    renderButton(button) {
        if(button instanceof CallButton)
            return {
                title: button.title,
                type: `phone_number`,
                payload: button.phoneNumber
            };

        if(button instanceof LinkButton)
            return {
                title: button.title,
                type: `web_url`,
                url: button.linkUrl
            };
    }

}


let messenger = new Messenger();
module.exports = {messenger};