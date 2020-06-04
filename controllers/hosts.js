var Pagination = require('../pagination');
var PAGECOUNT = 10;

app.route('hosts', {
    create: [{
        input: {
            name: {
                type: 'string',
                required: true
            },
            host: {
                type: 'string',
                required: true
            },
            key: {
                type: 'string',
                required: true
            }
        }
    }, function(req) {
        req.db.hosts.create(req.data, function(err, host) {
            if (err) {
                req.debug(err);
                return req.reject('database error');
            }
            req.emit('master', {request: 'cluster.addCa', ca: req.data.key});
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
          "name",
          "host",
          "key"
        ];
        var pagination = new Pagination(req.db, req.session.user, "hosts", filter , fields, sort);
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
            name: {
                type: 'string',
                required: true
            },
            host: {
                type: 'string',
                required: true
            },
            key: {
                type: 'string',
                required: true
            }
        }
    }, function(req) {
        req.db.hosts.update(req.data.id, req.data, function(err) {
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
        req.db.hosts.destroy(req.data.id, function(err) {
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
        req.db.hosts.find({select: ['id', 'name']}, function(err, list) {
            if (err) {
                req.debug(err);
                return req.reject('database error');
            }
            req.resolve({list});
        });
    }]
});