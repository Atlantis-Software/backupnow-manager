var Pagination = require('../pagination');
var PAGECOUNT = 10;

app.route('activities', {
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
        var sort = req.data.sort || {column: "start", direction: "DESC"};
        var filter = req.data.filter || {};
        var fields = [
          "id",
          "desc",
          "host",
          "state",
          "start",
          "end",
          "initiator"
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
    }]
});