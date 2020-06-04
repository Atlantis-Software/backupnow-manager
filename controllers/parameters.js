var asynk = require('asynk');
var _ = require('lodash');

var updateOrCreate = function(req, name, value, cb) {
    req.db.parameters.update({name}, {value} ,function(err, params) {
        if (err) {
          return cb(err);
        }
        if (params.length) {
          return cb(null, params);
        }
        req.db.parameters.create({name, value}, cb);
    });
};

var chkTime = function(time) {
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
  
app.route('parameters', {
    notifications_read: [{
        input: {}
    }, function(req) {
        req.db.parameters.find({name: [
            'notif_recipient',
            'notif_dailySum',
            'notif_time',
            'notif_onCritical',
            'notif_onError',
            'notif_onWarning',
            'notif_onSuccess'
        ]}, function(err, params) {
            if (err) {
                return req.reject('database error');
            }
            var notif = {
                dailySum: false,
                time: "00:00",
                recipients: [],
                onCritical: false,
                onError: false,
                onWarning: false,
                onSuccess: false
            };
            params.forEach(function(param) {
                switch(param.name) {
                    case 'notif_recipient':
                        notif.recipients.push(param.value);
                        break;
                    case 'notif_dailySum':
                        if (param.value === 'true') {
                            notif.dailySum = true;
                        }
                        break;
                    case 'notif_time':
                        notif.time = param.value;
                        break;
                    case 'notif_onCritical':
                        if (param.value === 'true') {
                            notif.onCritical = true;
                        }
                        break;
                    case 'notif_onError':
                        if (param.value === 'true') {
                            notif.onError = true;
                        }
                        break;
                    case 'notif_onWarning':
                        if (param.value === 'true') {
                            notif.onWarning = true;
                        }
                        break;
                    case 'notif_onSuccess':
                        if (param.value === 'true') {
                            notif.onSuccess = true;
                        }
                        break;   
                }
            });
            req.resolve({notif});
        });
    }],
    notifications_update: [{
        input: {
            dailySum: {
                type: "boolean",
                required: true
            },
            time: {
                type: "string",
                required: true
            },
            recipients: {
                type: "array",
                required: true
            },
            onCritical: {
                type: "boolean",
                required: true
            },
            onError: {
                type: "boolean",
                required: true
            },
            onWarning: {
                type: "boolean",
                required: true
            },
            onSuccess: {
                type: "boolean",
                required: true
            }
        }
    }, function(req) {
        if (!chkTime(req.data.time)) {
            return req.reject('invalid time field');
        }
        req.db.parameters.destroy({name: 'notif_recipient'}, function(err) {
            if (err) {
                return req.reject('database error');
            }
            var recipients = [];
            req.data.recipients.forEach(function(recipient) {
                recipients.push({name: 'notif_recipient', value: recipient});
            });
            asynk.add(function(cb) {
                req.db.parameters.create(recipients, cb);
            }).add(updateOrCreate).args(req, 'notif_dailySum', req.data.dailySum, asynk.callback)
              .add(updateOrCreate).args(req, 'notif_time', req.data.time, asynk.callback)
              .add(updateOrCreate).args(req, 'notif_onCritical', req.data.onCritical.toString(), asynk.callback)
              .add(updateOrCreate).args(req, 'notif_onError', req.data.onError.toString(), asynk.callback)
              .add(updateOrCreate).args(req, 'notif_onWarning', req.data.onWarning.toString(), asynk.callback)
              .add(updateOrCreate).args(req, 'notif_onSuccess', req.data.onSuccess.toString(), asynk.callback)
              .serie().asCallback(function(err) {
                if (err) {
                    return req.reject('database error');
                }
                req.resolve({updated: 'notif'});
            });
        });
    }],
    email_server_read: [{
        input: {}
    }, function(req) {
        req.db.parameters.find({name: [
            'smtp_host',
            'smtp_port',
            'smtp_isAuth',
            'smtp_username',
            'smtp_password',
            'smtp_secure',
            'smtp_email'
        ]}, function(err, params) {
            if (err) {
                return req.reject('error database');
            }
            var server = {};
            params.forEach(function(param) {
                switch(param.name) {
                    case 'smtp_host':
                        server.host = param.value;
                        break;
                    case 'smtp_port':
                        server.port = parseInt(param.value);
                        break;
                    case 'smtp_isAuth':
                        server.isAuth = false;
                        if (param.value === 'true') {
                            server.isAuth = true;
                        }
                        break;
                    case 'smtp_username':
                        server.username = param.value;
                        break;
                    case 'smtp_password':
                        server.password = param.value;
                        break;
                    case 'smtp_secure':
                        server.secure = false;
                        if (param.value === 'true') {
                            server.secure = true;
                        }
                        break;
                    case 'smtp_email':
                        server.email = param.value;
                        break;
                }
            });
            req.resolve({server});
        });
    }],
    email_server_update: [{
        input: {
            host: {
                type: "string",
                required: true
            },
            port: {
                type: "integer",
                required: true
            },
            isAuth: {
                type: "boolean",
                required: true
            },
            username: {
                type: "string"
            },
            password: {
                type: "string"
            },
            secure: {
                type: "boolean",
                required: true
            },
            email: {
                type: "string",
                required: true
            }
        }
    }, function(req) {
        asynk.add(updateOrCreate).args(req, 'smtp_host', req.data.host, asynk.callback)
          .add(updateOrCreate).args(req, 'smtp_port', req.data.port, asynk.callback)
          .add(updateOrCreate).args(req, 'smtp_isAuth', req.data.isAuth.toString(), asynk.callback)
          .add(updateOrCreate).args(req, 'smtp_username', req.data.username, asynk.callback)
          .add(updateOrCreate).args(req, 'smtp_password', req.data.password, asynk.callback)
          .add(updateOrCreate).args(req, 'smtp_secure', req.data.secure.toString(), asynk.callback)
          .add(updateOrCreate).args(req, 'smtp_email', req.data.email, asynk.callback)
          .serie().asCallback(function(err) {
            if (err) {
                return req.reject('error database');
            }
            req.resolve({updated: 'smtp_server'});
        });
    }]
});