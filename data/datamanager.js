const mysql = require('mysql');
const config = require('../config');
const pool = mysql.createPool(config.db);
const logger = require('../log');
const data = {};

class DataProvider {
  constructor(dtoClass, name, dataSql) {
    // Defines the properties of the class.
    this.dtoClass = dtoClass;
    this.name = name;
    this.dataSql = dataSql;
  }

  map(dtoClass, row) {
    let dto = new dtoClass();

    if(!row.hasOwnProperty(`id`) || !row.hasOwnProperty(`name`))
      throw 'Data returned by SQL must have at least the following columns: id, name.';

    // Maps all the returned columns to DTO properties with the same name.
    for (let propertyName of Reflect.ownKeys(row)) {
      Dto.addPropertyIfMissing(dto, propertyName, undefined);
      dto[propertyName] = row[propertyName];
    }

    // Now that the properties are created and initialised, allow the object to create derived properties.
    dto.init();

    return dto;
  }

  load() {
    let dataSql = this.dataSql;
    let dtoClass = this.dtoClass;
    // Creates the index structures.
    let objectsById = new Map(), objectsByName = new Map();
    return new Promise(function(resolve) {
      pool.query(dataSql, function (err, rows) {
        if (err) {
          throw err;
        }

        resolve(rows);
      });
    }).then((rows) => {
      data[`${Dto.getVarPluralPrefix(dtoClass.name)}ById`] = objectsById;
      data[`${Dto.getVarPluralPrefix(dtoClass.name)}ByName`] = objectsByName;
      dtoClass.byId = objectsById;
      dtoClass.byName = objectsByName;

      rows.forEach(row => { let dto = this.map(dtoClass, row); objectsById.set(dto.id, dto); objectsByName.set(dto.name, dto);});
      logger.debug(`Loaded ${objectsById.size} ${this.name}.`);
    }).catch(err => {
      logger.error(err);
    })
  };
}

class TaggedDataProvider extends DataProvider {
  constructor(dtoClass, name, dataSql, typeAlias) {
    super(dtoClass, name, dataSql);

    if(!(dtoClass.prototype instanceof TaggedDto))
      throw `DTO class ${dtoClass.name} is not derived from TaggedDto.`;

    this.typeAlias = typeAlias;
  }

  load() {
    let dtoClass = this.dtoClass;
    return super.load().then(() => {
      let tagMapSql =
        `select tm.tag_id as tagId, tm.content_item_id as contentId
	       from ccc_contentitem_tag_map tm
         where tm.type_alias = '${this.typeAlias}'
	       order by tm.content_item_id`;

      return new Promise(function(resolve) {
        pool.query(tagMapSql, function (err, rows) {
          if (err) {
            throw err;
          }

          resolve(rows);
        });
      })
    }).then((rows) => {
      if (rows) {
        rows.filter(row => dtoClass.byId.has(row.contentId))
          .forEach(row => dtoClass.byId.get(row.contentId).addTag(data.tagsById.get(row.tagId)));
      }
    }).catch(function(err) {
      logger.error(err);
    });
  }
}

// Defines private properties.
var providers = Symbol();
class DataManager {
  constructor() {
    this[providers] = [];
  }

  register(provider) {
    this[providers].push(provider);
    return provider;
  }

  load() {
    // Loads the data of the providers sequentially.
    promiseSerial(this[providers].map(x => () => x.load()));
  }

}

class Dto {
  constructor() {
    // Defines the properties of the class.
    this.id = undefined;
    this.name = undefined;
    this.parentId = undefined;
    this.parent = new WeakSet();
  }

  static addPropertyIfMissing(object, propertyName, initialValue) {
    if(!object.hasOwnProperty(propertyName)) {
      object[propertyName] = initialValue;
      logger.info(`Class ${object.constructor.name} did not have a property with name ${propertyName} and therefore it was added automatically.`);
    };
  }

  // Initialises the DTO after the properties have been created by data provider.
  init() {
    if(this.hasOwnProperty(`parentId`))
      this.setParentById(this.parentId);
  }

  static getVarPrefix(name) {
    return name.charAt(0).toLowerCase()+name.slice(1);
  }

  static getVarPluralPrefix(name) {
    let singularName = Dto.getVarPrefix(name);
    if(singularName.slice(-1) == `y`)
      return singularName.slice(0, -1) + `ies`;
    else
      return singularName + `s`;
  }

  getVarPrefix() {
    return Dto.getVarPrefix(this.constructor.name);
  }

  getVarPluralPrefix() {
    return Dto.getVarPluralPrefix(this.constructor.name);
  }

  setParentById(parentId) {
    let byIdName = `${this.getVarPluralPrefix()}ById`;

    // Only sets the parent if the corresponding data map could be found.
    if(data.hasOwnProperty(byIdName)) {
      // Gets the data map to look up the parent by ID.
      let parent = data[byIdName].get(parentId);

      if (parent) {
        this.parent.add(parent);
        let childrenName = this.getVarPluralPrefix();
        Dto.addPropertyIfMissing(parent, childrenName, []);

        parent[childrenName].push(this);
      }
    }
  }
}

class TaggedDto extends Dto {
  constructor() {
    super();

    // Defines the properties of the class.
    this.tags = new WeakSet(); // Creates weak parent references to make sure that the traverse walker never follows parent references.
  }

  addTag(tag)  {
    if (!tag)
      return;

    this.tags.add(tag);

    let childrenName = this.getVarPluralPrefix();
    Dto.addPropertyIfMissing(tag, childrenName, []);

    tag[childrenName].push(this);
  }
}

// Copied from https://hackernoon.com/functional-javascript-resolving-promises-sequentially-7aac18c4431e
const promiseSerial = funcs =>
  funcs.reduce((promise, func) =>
      promise.then(result => func().then(Array.prototype.concat.bind(result))).catch(err => { logger.error(err) }),
    Promise.resolve([]));

const dataManager = new DataManager();
module.exports =  {dataManager, DataProvider, TaggedDataProvider, Dto, TaggedDto};
