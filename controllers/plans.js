var _ = require('lodash');
var Pagination = require('../pagination');
var PAGECOUNT = 10;

var chkTime = function (time) {
  var hm = time.split(':');
  if (hm.length !== 2) {
    return false;
  }
  var h = parseInt(hm[0]);
  var m = parseInt(hm[1]);
  if (_.isNaN(h) || h < 0 || h > 24) {
    return false;
  }
  if (_.isNaN(m) || m < 0 || m > 60) {
    return false;
  }
  return true;
};

app.route('plans', {
  create: [{
    input: {
      name: {
        type: "string",
        required: true
      },
      host: {
        type: "integer",
        required: true
      },
      backup: {
        type: "integer",
        required: true
      },
      type: {
        type: "string",
        required: true
      },
      src: {
        type: "string",
        required: true
      },
      mon: {
        type: "boolean"
      },
      tue: {
        type: "boolean"
      },
      wed: {
        type: "boolean"
      },
      thu: {
        type: "boolean"
      },
      fri: {
        type: "boolean"
      },
      sat: {
        type: "boolean"
      },
      sun: {
        type: "boolean"
      },
      time: {
        type: "string",
        required: true
      },
      keptCount: {
        type: "integer",
        required: true
      },
      keptPeriod: {
        type: "string",
        required: true
      }
    }
  }, function (req) {
    req.data.state = 'pending';
    if (!chkTime(req.data.time)) {
      return req.reject('invalid time field');
    }
    req.db.plans.create(req.data, function (err, plan) {
      if (err) {
        req.debug(err);
        return req.reject('database error');
      }
      req.db.plans.findOne(plan.id).populate('host').populate('backup').exec(function (err, plan) {
        if (err) {
          req.debug(err);
          return req.reject('could not schedule plan');
        }
        req.emit('manager', { request: 'schedule', plan }).asCallback(function (err, result) {
          if (err) {
            req.debug(err);
            return req.reject('could not schedule plan');
          }
          req.resolve(plan);
        });
      });
    });
  }],
  paginate: [{
    input: {
      filter: {
        type: 'object'
      },
      page: {
        type: 'integer',
        required: false
      },
      pageCount: {
        type: 'integer'
      },
      sort: {
        type: 'object'
      }
    }
  }, function (req) {
    var sort = req.data.sort || { column: "name", direction: "ASC" };
    var filter = req.data.filter || {};
    var fields = [
      "id",
      "name",
      "host",
      "backup",
      "type",
      "src",
      "mon",
      "tue",
      "wed",
      "thu",
      "fri",
      "sat",
      "sun",
      "time",
      "keptCount",
      "keptPeriod",
      "state",
      "last"
    ];
    var pagination = new Pagination(req.db, req.session.user, "plans", filter, fields, sort);
    pagination.setPage(req.data.page);
    pagination.setPageCount(req.data.pageCount || PAGECOUNT);
    pagination.getPage(function (err, page) {
      if (err) {
        req.debug(err);
        return req.reject("database error");
      }
      return req.resolve(page);
    });
  }],
  update: [{
    input: {
      id: {
        type: 'integer',
        required: true
      },
      name: {
        type: "string",
        required: true
      },
      host: {
        type: "integer",
        required: true
      },
      backup: {
        type: "integer",
        required: true
      },
      type: {
        type: "string",
        required: true
      },
      src: {
        type: "string",
        required: true
      },
      mon: {
        type: "boolean"
      },
      tue: {
        type: "boolean"
      },
      wed: {
        type: "boolean"
      },
      thu: {
        type: "boolean"
      },
      fri: {
        type: "boolean"
      },
      sat: {
        type: "boolean"
      },
      sun: {
        type: "boolean"
      },
      time: {
        type: "string",
        required: true
      },
      keptCount: {
        type: "integer",
        required: true
      },
      keptPeriod: {
        type: "string",
        required: true
      }
    }
  }, function (req) {
    if (!chkTime(req.data.time)) {
      return req.reject('invalid time field');
    }
    req.db.plans.update(req.data.id, req.data, function (err) {
      if (err) {
        req.debug(err);
        return req.reject('database error');
      }
      req.db.plans.findOne(req.data.id).populate('host').populate('backup').exec(function (err, plan) {
        if (err) {
          req.debug(err);
          return req.reject('could not schedule plan');
        }
        req.emit('manager', { request: 'schedule', plan }).asCallback(function (err, result) {
          if (err) {
            req.debug(err);
            return req.reject('could not schedule plan');
          }
          req.resolve({ updated: req.data.id });
        });
      });
    });
  }],
  delete: [{
    input: {
      id: {
        type: 'integer',
        required: true
      }
    }
  }, function (req) {
    req.db.plans.destroy(req.data.id, function (err, plan) {
      if (err) {
        req.debug(err);
        return req.reject('database error');
      }
      if (plan.length === 0) {
        return req.reject('invalid plan');
      }
      req.emit('manager', { request: 'unschedule', plan: plan[0] }).asCallback(function (err, result) {
        if (err) {
          req.debug(err);
          return req.reject('could not unschedule plan');
        }
        req.resolve({ deleted: req.data.id });
      });
    });
  }],
});