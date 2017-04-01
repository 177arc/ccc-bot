const mysql = require('mysql');
const config = require('../config');
const pool = mysql.createPool(config.db);
const logger = require('../log');

class DB {
  static getTagTreeRows(callback) {
    pool.query(`select t.id as tagId, t.parent_id as tagParentId, t.title as tagName, t.note as tagNote, c.id as catId, c.title as catName, ct.id as artId, ct.id as artId, ct.title as artTitle, ct.introtext as artIntro, ct.images as artImages,
      case tm.type_alias when 'com_dpcalendar.category' then 'Event Category' when 'com_content.article' then 'Article' end as type
      from ccc_tags t
      left join ccc_contentitem_tag_map tm on t.id = tm.tag_id and tm.type_alias in ('com_dpcalendar.category', 'com_content.article') and t.published = 1
      left join ccc_categories c on tm.content_item_id = c.id and tm.type_alias = 'com_dpcalendar.category' and c.published = 1
      left join ccc_content ct on tm.content_item_id = ct.id and tm.type_alias = 'com_content.article' and ct.state = 1
      order by t.id`, callback);
  }
  static getGeneralEventRows(callback) {
    DB.getSpecificEventRows(undefined, callback);
  }
  static getSpecificEventRows(catIds, callback) {
    const allCats = (catIds === undefined).toString();
    catIds = catIds || [-1];
    let query = `select ev.id as id, ev.title as title, ev.start_date as startDate, ev.end_date as endDate, ev.featured as featured, ev.images as images, ev.url as url from
                    ccc_dpcalendar_events as ev
                    inner join
                    ccc_categories as c on  ev.catid = c.id      
                    where (ev.end_date > now() or ev.end_date is null)
                    and (${allCats} or c.id in (${catIds}))
                    order by ev.featured desc, ev.start_date asc
                    limit 3`;
    pool.query(query, callback);
  }
}

module.exports = DB;