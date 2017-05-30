const { data, DataProvider, TaggedDataProvider, Dto, TaggedDto } = require('./datamanager');
require('./tags');

class Contact extends TaggedDto {
  constructor() {
    super();

    this.phone = undefined;
    this.mobile = undefined;
    this.address = undefined;
    this.email = undefined;
  }
}

data.register(new TaggedDataProvider(Contact, `Contacts`,
    `select c.id as id, c.name as name, c.telephone as phone, c.mobile as mobile, c.address as address, c.email_to as email
      from ccc_contact_details c
      where c.published = 1`, `com_contact.contact`));

module.exports = {Contact};