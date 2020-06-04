var Pagination = require('../pagination');
var PAGECOUNT = 10;

app.route('backups', {
    create: [{
        input: {
            type: {
                type: 'string',
                required: true
            },
            name: {
                type: 'string',
                required: true
            },
            host: {
                type: 'string',
                required: true
            },
            port: {
              type: 'integer',
              required: true
            },
            username: {
                type: 'string'
            },
            password: {
                type: 'string'
            },
            path: {
                type: 'string',
                required: true
            }
        }
    }, function(req) {
        req.db.backups.create(req.data, function(err, host) {
            if (err) {
                req.debug(err);
                return req.reject('database error');
            }
            req.resolve(host);
        });
    }],
    paginate: [{
        input: {
            filter: {
                type: 'object'
            },
            page:  {
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
    }, function(req) {
        var sort = req.data.sort || {column: "name", direction: "ASC"};
        var filter = req.data.filter || {};
        var fields = [
          "id",
          "type",
          "name",
          "host",
          "port",
          "username",
          "password",
          "path"
        ];
        var pagination = new Pagination(req.db, req.session.user, "backups", filter , fields, sort);
        pagination.setPage(req.data.page);
        pagination.setPageCount(req.data.pageCount || PAGECOUNT);
        pagination.getPage(function(err, page) {
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
            type: {
                type: 'string',
                required: true
            },
            name: {
                type: 'string',
                required: true
            },
            host: {
                type: 'string',
                required: true
            },
            port: {
              type: 'integer',
              required: true
            },
            username: {
                type: 'string'
            },
            password: {
                type: 'string'
            },
            path: {
                type: 'string',
                required: true
            }
        }
    }, function(req) {
        req.db.backups.update(req.data.id, req.data, function(err) {
            if (err) {
                req.debug(err);
                return req.reject('database error');
            }
            req.resolve({updated: req.data.id});
        });
    }],
    delete: [{
        input: {
            id: {
                type: 'integer',
                required: true
            }
        }
    }, function(req) {
        req.db.backups.destroy(req.data.id, function(err) {
            if (err) {
                req.debug(err);
                return req.reject('database error');
            }
            req.resolve({deleted: req.data.id});
        });
    }],
    list: [{
        input: {}
    }, function(req) {
        req.db.backups.find({select: ['id', 'name']}, function(err, list) {
            if (err) {
                req.debug(err);
                return req.reject('database error');
            }
            req.resolve({list});
        });
    }]
});