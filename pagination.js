var asynk = require('asynk');

var pagination = function(db, user, type, filter, fields, order) {
  this.db = db;
  this.user = user;
  this.type = type;
  this.filter = filter || {};
  this.fields = fields || [];
  this.order = order || {column: "", direction: ""};
  if (this.order && !Array.isArray(this.order)) {
    this.order = [this.order];
  }
  this.page = 1;
  this.pages = 1;
  this.count = 0;
  this.current = 0;
  this.start = 0;
  this.end = 0;
  this.pageCount = 20;
};

pagination.prototype.setPage = function(page) {
  if (page >= 1) {
    this.page = page;
  }
};

pagination.prototype.setOrder = function(order) {
  this.order = order;
  if (this.order && !Array.isArray(this.order)) {
    this.order = [this.order];
  }
};

pagination.prototype.setPageCount = function(count) {
  this.pageCount = count;
};

pagination.prototype.getPage = function(callback) {
  var self = this;
  var defaultPageCount;
  if (self.user && self.user.params && self.user.params.count_mail) {
    defaultPageCount = self.user.params.count_mail;
  }
  var pageCount = defaultPageCount || self.pageCount;
  this.start = (this.page - 1) * pageCount;
  var db = self.db[this.type];
  if (!db) {
    return callback(new Error('type ' + this.type + ' invalide'));
  }
  var pop = {};
  var typefield = [];
  for (var i in this.fields) {
    var last_point_pos = this.fields[i].lastIndexOf('.');
    if (last_point_pos >= 0) {
      var modelRelations = this.fields[i].slice(0, last_point_pos);
      var attrSelect = this.fields[i].slice(last_point_pos+1, this.fields[i].length);
      pop[modelRelations] = pop[modelRelations] || [];
      pop[modelRelations].push(attrSelect);
    } else {
      typefield.push(this.fields[i]);
    }
  }

  var count_defer = asynk.deferred();
  db.count(this.filter).exec(function(err, countModel) {
    if (err) {
      return count_defer.reject(err);
    }

    count_defer.resolve(countModel);
  });
  var page_defer = asynk.deferred();

  if (!this.order || !this.order.query) {
    var filter = {
      select: typefield,
      where: this.filter,
      limit: pageCount,
      skip: this.start
    };
    var sorts = [];
    this.order.forEach(function(order) {
      if (order.column) {
        if (order.direction !== 'ASC' && order.direction !== 'DESC') {
          throw "Wrong Order Direction";
        }
        sorts.push(order.column + " " + order.direction);
      }
    });
    if (sorts.length > 0) {
      filter.sort = sorts;
    }
    var request = db.find(filter);
    for (var modelPop in pop) {
      var fields = {};
      fields.select = pop[modelPop];
      request.populate(modelPop, fields);
    }
    request.exec(function(err, page) {
      if (err) {
        return page_defer.reject(err);
      }
      page_defer.resolve(page);
    });
  } else {
    db.query(this.order.query, function(err, page) {
      if (err) {
        return page_defer.reject(err);
      }
      delete self.order.query;
      page_defer.resolve(page);
    });
  }

  asynk.when(count_defer, page_defer).done(function(count, page) {
    self.count = count;
    self.current = page.length;
    self.pages = Math.ceil(self.count / pageCount);
    if (self.pages === 0) {
      self.pages = 1;
    }
    self.end = self.start + page.length;
    var pagination = {
      page: self.page,
      pages: self.pages,
      count: self.count,
      current: self.current,
      start: self.start + 1,
      end: self.end,
      pageCount: pageCount,
      order: self.order,
      list: page
    };
    callback(null, pagination);
  }).fail(function(err) {
    callback(err);
  });
};

module.exports = pagination;
