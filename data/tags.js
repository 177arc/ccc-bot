const config = require('../config');
const { data, DataProvider, TaggedDataProvider, Dto, TaggedDto } = require('./datamanager');

class Tag extends Dto {
  constructor() {
    super();

    this.note = undefined;
  }

  init() {
    super.init();

    this.title = this.name;

    this.tags = [];
    this.articles = [];
    this.eventCategories = [];
    this.events = [];
    this.contacts = [];
    this.url =  `${config.url}/index.php?option=com_tags&Itemid=118&id[0]=${this.id}&lang=en&types[0]=1&view=tag`;

    try {
      if (this.note)
        Object.assign(this, JSON.parse(this.note));
    }
    catch(ex) {
      logger.warn(`Could not parse info parameter: ${this.note}`);
    }

    this.uiName = this.uiName || this.title;
    this.imageUrl = `${config.url}/${config.defaultImageUrl}`;
  }
}

data.register(
new DataProvider(Tag, `Tags`,
  `select t.id as id, t.parent_id as parentId, t.title as name, t.note as note
      from ccc_tags t
      where t.published = 1
      order by t.id`));

module.exports = {Tag};