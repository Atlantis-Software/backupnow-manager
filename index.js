process.on('uncaughtException', function(err) {
    console.log(err);
});

var synapps = require('@synapps/core');
var session = require('@synapps/session');
var orm = require('@synapps/orm');
var path = require("path");

var staticDir = require('@backupnow/webif');
var port = 1234;

global.app = module.exports = synapps();
// config
app.set('staticDir', staticDir);
app.set('debug', 'ALL');

// middleware
var db = orm({});
app.use(db);
app.use(session());

var auth = function(req, next) {
  if (req.session.user) {
    return next();
  }
  next('forbidden acces');
};

app.policy('auth', auth);
app.set('defaultPolicy', 'auth');

require('./controllers/user');
require('./controllers/activities');
require('./controllers/backups');
require('./controllers/dashboard');
require('./controllers/hosts');
require('./controllers/parameters');
require('./controllers/plans');
require('./controllers/warnings');

app.set('logFile', '/var/log/backup-manager.log');

app.set('tls', {
  cert: '/etc/backup-manager/manager.crt',
  key: '/etc/backup-manager/manager.key',
  ca: [],
  host: '0.0.0.0',
  port: 12345
});

app.createWorker('manager', function(worker) {
  (require('./worker'))(worker, db);
});

app.listen(port);