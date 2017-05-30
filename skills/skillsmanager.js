'use strict';

const config = require('../config');

class Skill {
  static getIntent(entities) {
    return Skill.firstEntityValue(entities, 'intent');
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

  static getIntentConfidence(entities) {
    const entity = 'intent';

    const val = entities && entities[entity] &&
      Array.isArray(entities[entity]) &&
      entities[entity].length > 0 &&
      entities[entity][0].confidence
    ;

    return val ? val : null;
  };

}

class SkillsManager {
  constructor() {
    this.skills = [];
  }

  register(skill) {
    this.skills.push(skill);
    return skill;
  }

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

  static firstEntityValue(entities, entity) {
    const val = entities && entities[entity] &&
      Array.isArray(entities[entity]) &&
      entities[entity].length > 0 &&
      entities[entity][0].value
    ;
    if (!val) return null;

    return typeof val === 'object' ? val.value : val;
  }
}

const skillsManager = new SkillsManager();
module.exports = {skillsManager, Skill};