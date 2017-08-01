'use strict';

const config = require('../config');
const {SimpleResponse} = require('./../views/models');

class Skill {
  getIntent(entities) {
    return this.firstEntityValue(entities, 'intent');
  };

  firstEntityValue(entities, entity) {
    const val = entities && entities[entity] &&
      Array.isArray(entities[entity]) &&
      entities[entity].length > 0 &&
      entities[entity][0].value
    ;
    if (!val) return null;

    return typeof val === 'object' ? val.value : val;
  };

  getIntentConfidence(entities) {
    const entity = 'intent';

    const val = entities && entities[entity] &&
      Array.isArray(entities[entity]) &&
      entities[entity].length > 0 &&
      entities[entity][0].confidence
    ;

    return val ? val : null;
  };

  // Maps the given text to a simple response model.
  textToModel(text) {
      return new SimpleResponse({text: text});
  }
}

class SkillsManager {
  constructor() {
    this.skills = [];
  }

  register(skill) {
    this.skills.push(skill);
    return skill;
  }
}

const skillsManager = new SkillsManager();
module.exports = {skillsManager, Skill};