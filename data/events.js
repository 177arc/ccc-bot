const {data, DataProvider, TaggedDataProvider, Dto, TaggedDto } = require('./datamanager');
const {Tag} = require('./tags');
const {Article} = require('./articles');

class EventCategory extends TaggedDto  {
  constructor() {
    super();

    // Create weak parent references to make sure that the traverse walker never follows parent references.
    this.article = new WeakSet();
    this.events = [];
  }

  init() {
    super.init();

    // Associates the article with the same name as the category if there is one.
    this.setArticle(Article.byName.get(this.name));
  }

  setArticle(article) {
    if(article)
      this.article.add(article);

    if(article && article.eventCat != this)
      article.setEventCat(this);
  }

  addEvent(event) {
    this.events.push(event);

    if(event.eventCategory != this)
      event.setEventCategory(this);
  }
}

class Event extends TaggedDto {
  constructor() {
    super();

    this.startDate = undefined;
    this.endDate = undefined;
    this.featured = undefined;
    this.images = undefined;
    this.url = undefined;
    this.categoryId = undefined;

    // Create weak parent references to make sure that the traverse walker never follows parent references.
    this.eventCategory = new WeakSet();
  }

  init() {
    super.init();

    this.setEventCategory(EventCategory.byId.get(this.categoryId));
  }

  setEventCategory(eventCategory) {
    if(!eventCategory)
      return;

    this.eventCategory.add(eventCategory);

    if(eventCategory.events && !eventCategory.events.includes(this))
      eventCategory.events.push(this);
  }
}

data.register(new TaggedDataProvider(EventCategory, `Event Categories`,
    `select c.id as id, c.title as name
      from ccc_categories c
      join ccc_contentitem_tag_map tm on tm.content_item_id = c.id and tm.type_alias in ('com_dpcalendar.category')
      where c.published = 1`, `com_dpcalendar.category`));

data.register(new TaggedDataProvider(Event, `Events`,
    `select ev.id as id, ev.title as name, ev.start_date as startDate, ev.end_date as endDate, ev.featured as featured, ev.images as images, ev.url as url, c.id as categoryId from
      ccc_dpcalendar_events as ev
      inner join
      ccc_categories as c on ev.catid = c.id      
      where (ev.end_date > now() or ev.end_date is null)
      and ev.state = 1
      order by ev.featured desc, ev.start_date asc`, `com_dpcalendar.event`));

module.exports = {EventCategory, Event};