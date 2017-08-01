const logger = require('../log');

const {skillsManager, Skill} = require('./skillsmanager');

class GreetingsSkill extends Skill {
    sayHello({response}) {
        response.model = this.textToModel(`Hi there! How can I help? I know about church events, news, contacts, etc. `);
        return;
    }
}

skillsManager.register(new GreetingsSkill());