const config = require('../config');
const logger = require('../log');

class Tag {
  constructor(parent, id, title, info) {
    this.setParent(parent);
    this.id = id;
    this.title = title;

    this.tags = [];
    this.articles = [];
    this.eventCats = [];
    this.url = `${config.url}/index.php?option=com_tags&Itemid=118&id[0]=${this.id}&lang=en&types[0]=1&view=tag`;

    try {
      if (info)
        Object.assign(this, JSON.parse(info));
    }
    catch(ex) {
      logger.warn(`Could not parse info parameter: ${info}`);
    }

    this.uiName = this.uiName || this.title;
    this.imageUrl = `${config.url}/${config.defaultImageUrl}`;
  }

  setParent(tag) {
    // Create weak parent references to make sure that the traverse walker never follows parent references.
    this.parent = new WeakSet();

    if(tag) {
      this.parent.add(tag);
      tag.tags.push(this);
    }
  }
}

class EventCategory {
  constructor(tag, article, id, title) {
    this.setTag(tag);
    this.setArticle(article);
    this.id = id;
    this.name = title;
  }

  setTag(tag) {
    // Create weak parent references to make sure that the traverse walker never follows parent references.
    this.tag = new WeakSet();

    if(tag) {
      this.tag.add(tag);
      tag.eventCats.push(this);
    }
  }

  setArticle(article) {
    // Create weak parent references to make sure that the traverse walker never follows parent references.
    this.article = new WeakSet();

    if(article)
      this.article.add(article);

    if(article && article.eventCat != this)
      article.setEventCat(this);
  }
}

class Article {
  constructor(id, title, intro, image) {
    this.tags = [];
    this.id = id;
    this.title = title;
    this.intro = intro;
    this.image = image;
    this.imageUrl = image ?  `${config.url}/${image.image_intro}` : null;
    this.eventCat = undefined;
    this.url = `${config.url}/index.php?option=com_content&Itemid=150&id=${this.id}&lang=en&view=article`;
    this.uiName = title;
  }

  addTag(tag) {
    if(!tag)
      return;

    // Create weak parent references to make sure that the traverse walker never follows parent references.
    this.tags = new WeakSet();
    this.tags.add(tag);
    tag.articles.push(this);
  }

  setEventCat(eventCat) {
    this.eventCat = eventCat;

    if(eventCat && eventCat.article != this)
      eventCat.setArticle(this);
  }
}

class Event {

}

module.exports = {Tag, EventCategory, Article};