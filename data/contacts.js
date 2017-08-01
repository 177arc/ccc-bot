const { data, DataProvider, TaggedDataProvider, Dto, TaggedDto } = require('./datamanager');
require('./tags');

class Contact extends TaggedDto {
  constructor() {
    super();

    this.phone = undefined;
    this.mobile = undefined;
    this.address = undefined;
    this.email = undefined;
    this.position = undefined;
    this.image = undefined;
    this.ordering = undefined;
  }
}

data.register(new TaggedDataProvider(Contact, `Contacts`,
    `select c.id as id, c.name as name, c.telephone as phone, c.mobile as mobile, c.address as address, 
      c.email_to as email, cat.rgt*1000+c.ordering as ordering, c.image as image, c.con_position as position
      from ccc_contact_details c
      join ccc_categories cat on c.catid = cat.id
      where cat.extension = 'com_contact' and cat.published = 1 and c.published = 1 `, `com_contact.contact`));

module.exports = {Contact};