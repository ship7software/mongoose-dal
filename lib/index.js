'use strict';

class Controller {
  constructor(facade) {
    this.facade = facade;
  }

  find(req, res, next) {
    var query = req.query;
    var sort = query.sort;
    var limit = query.limit;
    var skip = query.skip;
    delete query['sort'];
    delete query['limit'];
    delete query['skip'];

    if(skip && limit) {
      this.facade.count(query).then(count => {
        return this.facade.findWithPagination(req.query, null, sort, limit, skip)
        .then(collection => {
          res.status(200).json({ items: collection, total: count });
        }).catch(err => { next(err) });
      }).catch(err => { next(err) });
    }
    else {
      return this.facade.find(req.query)
      .then(collection => { 
        res.status(200).json(collection); 
      })
      .catch(err => { next(err); })
    }
  }

  findById(req, res, next) {
    return this.facade.findById(req.params.id)
    .then(doc => {
      if (!doc) { return res.status(404).end(); }
      return res.status(200).json(doc);
    })
    .catch(err => { next(err); })
  }

  create(req, res, next) {
    this.facade.create(req.body).then(doc => { res.status(201).json(doc); })
    .catch(err => { next(err); })
  }

  update(req, res, next) {
    var conditions = { _id: req.params.id };

    this.facade.update(conditions, req.body)
    .then(doc => {
      if (!doc || (doc.nModified == 0 && doc.n == 0)) { 
        return res.status(404).json(doc);
      }
      return res.status(200).json(doc);
    })
    .catch(err => { next(err); })
  }

  remove(req, res, next) {
    this.facade.remove(req.params.id)
    .then(doc => {
      if (!doc) { return res.status(404).end(); }
      return res.status(204).end();
    })
    .catch(err => { next(err); })
  }
}

class Facade {
  constructor(Schema) {
    this.Schema = Schema;
  }

  create(input) {
    var schema = new this.Schema(input);
    return schema.save();
  }

  update(conditions, update, upsert) {
    return this.Schema
    .update(conditions, update, { new: true, upsert: upsert })
    .exec();
  }

  find(query, projection) {
    return this.Schema
    .find(query, projection)
    .exec();
  }

  count(query) {
    return this.Schema.count(query).exec();
  }

  findWithPagination(query, projection, sort, limit, skip) {
    return this.Schema
    .find(query, projection)
    .sort(sort)
    .skip(Number(skip))
    .limit(Number(limit))
    .exec();
  }

  findOne(query, populate) {
    var dbQuery = this.Schema.findOne(query);
    if(populate)
      dbQuery = dbQuery.populate(populate);
    return dbQuery.exec();
  }

  findById(id) {
    return this.Schema
    .findById(id)
    .exec();
  }

  remove(id) {
    return this.Schema
    .findByIdAndRemove(id)
    .exec();
  }

  bulkInsert(objs){
    return this.Schema.insertMany(objs);
  }

  bulkRemoveAll(){
    return this.Schema.remove({}).exec();
  }
}

module.exports = { Controller, Facade };
