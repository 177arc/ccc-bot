'use strict';

const traverse = require('traverse');
const config = require('../config');
const logger = require('../log');
const db = require('../data/db');
const tagtree = require('../data/tagtree');
require('../data/contacts');
require('../data/articles');
require('../data/events');
const { dataManager } = require('../data/datamanager');

const tagsByTitle = {}; // Provides a map from a given tag name to a tag node.
const tagsById = {}; // Provides a map from a given tag ID to a tag node.
const articlesByTitle = {}; // Provides a map form a given article title to an article node.
const eventCatsByTitle = {}; // Provides a map form a given event category title to an event category node.

const initData = function () {
  return new Promise(function (resolve, reject) {
    dataManager.load();

    // Creates a tree from the tags that have wit as the root node with corresponding articles and categories.
    db.getTagTreeRows(function (err, rows) {
      if (err) reject(err);

      logger.info(`Constructing tag tree ...`)

      for (let row of rows) {
        let parentNode = tagsById[row.tagParentId];

        // Adds the node to the tree.
        //logger.debug(`Adding tag node for ${row.tagName} ...`);
        let tagNode = tagsById[row.tagId] || new tagtree.Tag(parentNode, row.tagId, row.tagName, row.tagNote);
        tagsByTitle[row.tagName] = tagNode;
        tagsById[row.tagId] = tagNode;

        let articleNode;
        switch (row.type) {
          case 'Article':
            if (!row.artId)
              break;

            //logger.debug(`Adding article ${row.artTitle} to tag node ${tagNode.title} ...`);
            articleNode = articlesByTitle[row.artTitle];
            if(!articleNode) {
              let images = undefined;
              try { images = row.artImages ? JSON.parse(row.artImages) : undefined } catch(e) {};
              articleNode = new tagtree.Article(row.artId, row.artTitle, row.artIntro, images);
            }

            articleNode.addTag(tagNode);
            articlesByTitle[row.artTitle] = articleNode;
            break;

          case 'Event Category':
            if (!row.catId)
              break;


            articleNode = articlesByTitle[row.catName]; // Find us the article that this event category is associated with assuming the article and the event category have the same name.
            //logger.debug(`Adding event category ${row.catName} to tag node ${tagNode.title} ...`);

            //if (articleNode)
              //logger.debug(`Adding event category ${row.catName} to article node ${articleNode.title} ...`);

            let eventCatNode = eventCatsByTitle[row.artTitle]
              || new tagtree.EventCategory(tagNode, articleNode, row.catId, row.catName);
            eventCatsByTitle[row.catName] = eventCatNode;
            break;

        }
      }

      logger.debug(`Constructed tag tree.`)
      resolve([tagsByTitle, articlesByTitle, eventCatsByTitle]);
    })
  })
}

module.exports = initData;