const config = require('../config');
const { data, TaggedDataProvider, TaggedDto } = require('./datamanager');
require('./tags');

class Article extends TaggedDto {
  constructor() {
    super();

    this.intro = undefined;
    this.images = undefined;
    this.eventCat = undefined;
    this.imageUrl = undefined;
    this.url = undefined;
    this.title = undefined;
    this.uiName = undefined;
  }

  init() {
    super.init();

    this.title = this.name;
    this.imageUrl = this.image ? `${config.url}/${image.image_intro}` : null;
    this.url = `${config.url}/index.php?option=com_content&Itemid=150&id=${this.id}&lang=en&view=article`;
    this.uiName = this.title;
  }

  setEventCat(eventCat) {
    this.eventCat = eventCat;

    if(eventCat && eventCat.article !== this)
      eventCat.setArticle(this);
  }
}

data.register(new TaggedDataProvider(Article, `Articles`,
    `select ct.id as id, ct.title as name, ct.introtext as intro, ct.images as images 
      from ccc_content ct
      join ccc_contentitem_tag_map tm on tm.content_item_id = ct.id and tm.type_alias in ('com_content.article')
      where type_alias = 'com_content.article' and ct.state = 1`, `com_content.article`));

module.exports = {Article};