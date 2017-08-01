const logger = require('../log');
const config = require('../config');

const {skillsManager, Skill} = require('./skillsmanager');
const {data} = require('../data/datamanager');
const {Contact} = require('../data/contacts');
const {ListResponse, CardResponse, ListItem, LinkButton, CallButton} = require('./../views/models');

class ContactSkill extends Skill {
    getGeneral({response}) {
        logger.debug(`Getting general contact info ...`);
        // Gets all the events and sorts them by start date/time.
        let contacts = Array.from(data.contactsById, ([key, value]) => { return value })
            .sort((a, b) => a.ordering - b.ordering)
            .slice(0, 5);

        response.model = this.contactsToModel(`Here are the key people in our church:`, contacts);
    }

    getSpecificByName({response, entities}) {
        logger.debug(`Getting specific contact info ...`);

        let contactName = this.firstEntityValue(entities, 'person');
        if (!contactName) {
            response.model = this.textToModel(`Sorry, I don't know anyone with such a name 😕`);
            return;
        }

        let contact = data.contactsByName.get(contactName);
        if(!contact) {
            response.model = this.textToModel(`Sorry, I don't know anything about ${contactName} 😕`);
            return;
        }

        response.model = this.contactToModel(contact);
    }

    // Maps the given contacts to a list model.
    contactsToModel(intro, contacts) {
        let model = new ListResponse({});
        model.text =  intro;
        model.list = contacts.map(contact => this.contactItemToModel(contact));

        model.more = new LinkButton({
            title: `See all`,
            linkUrl: `${config.url}/welcome/whos-who`
        });

        return model;
    }

    // Maps the given contact to a list item model.
    contactItemToModel(contact) {
        let listItem = new ListItem();
        listItem.title = contact.name;

        let details = [];
        if(contact.position) details.push(contact.position);
        if(contact.mobile) details.push(contact.mobile);
        if(contact.phone) details.push(contact.phone);
        if(contact.email) details.push(contact.email);
        listItem.subTitle = details.join('\n');

        listItem.imageUrl = contact.image ? `${config.url}/${contact.image}` : undefined;
        let linkUrl = `${config.url}/index.php?option=com_contact&Itemid=501&id=${contact.id}&lang=en&view=contact`;
        listItem.linkUrl = linkUrl;
        return listItem;
    }

    contactToModel(contact) {
        let model = new CardResponse();

        model.title = contact.name;
        model.imageUrl = contact.image ? `${config.url}/${contact.image}` : undefined;
        model.linkUrl =  `${config.url}/index.php?option=com_contact&Itemid=501&id=${contact.id}&lang=en&view=contact`;
        if(contact.position) model.subTitle = contact.position;

        model.buttons = [];
        if(contact.mobile)
            model.buttons.push(new CallButton({title: contact.mobile, phoneNumber: contact.mobile}));
        if(contact.phone)
            model.buttons.push(new CallButton({title: contact.phone, phoneNumber: contact.phone}));
        if(contact.email)
            model.buttons.push(new LinkButton({title: contact.email, linkUrl: config.botUrl+'/redirect?dest='+encodeURI('mailto:'+contact.email)}));

        return model;
    }
}

skillsManager.register(new ContactSkill());