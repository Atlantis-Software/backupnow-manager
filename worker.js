var asynk = require('asynk');

module.exports = function(worker, db) {
  db(worker, function(err) {
    if (err) {
      return worker.debug(err);
    }
    var scheduled = {};

    var execPlan = function(plan) {
      worker.db.activities.create({
        "desc": "execute backup plan " + plan.name,
        "host": plan.host.id,
        "state": "running",
        "start": new Date(),
        "initiator": "Plan " + plan.name
      }, function(err, activitie) {
        if (err) {
          return worker.debug(err);
        }
        // send order to agent
        var order = worker.emit(plan.host.name, {
          request: 'backup',
          backup: plan.backup,
          type: plan.type,
          src: plan.src
        });

        order.fail(function(err) {
          var failDate = new Date();
          asynk.add(function(cb) {
            worker.db.activities.update(activitie.id, {
              "state": "fail",
              "end": failDate
            }, cb);
          }).add(function(cb) {
            worker.db.warnings.create({
              "desc": "backup plan failure " + plan.name + " " + err,
              "host": plan.host.id,
              "state": "CRITICAL",
              "date": failDate
            }, cb);
          }).add(function(cb) {
            worker.db.plans.update(plan.id, {
              state: 'fail',
              last: failDate
            }, cb);
          }).parallel().asCallback(function(dberr) {
            if (dberr) {
              worker.debug(dberr);
            }
            worker.debug("Plan " + plan.name + " execution fail");
            worker.debug(err);
          });
        });

        order.done(function() {
          var doneDate = new Date();
          asynk.add(function(cb) {
            worker.db.activities.update(activitie.id, {
              "state": "ok",
              "end": doneDate
            }, cb);
          }).add(function(cb) {
            worker.db.plans.update(plan.id, {
              state: 'ok',
              last: doneDate
            }, cb);
          }).parallel().asCallback(function(err) {
            if (err) {
              worker.debug(err);
            }
            worker.debug("Plan " + plan.name + " done successfully");
          });
        });


      });
    };

    var schedulePlan = function(plan) {
        if (scheduled[plan.id]) {
          clearTimeout([plan.id]);
        }
        var week = [plan.sun, plan.mon, plan.tue, plan.wed, plan.thu, plan.fri, plan.sat];
        var hm = plan.time.split(':');
        var h = parseInt(hm[0]);
        var m = parseInt(hm[1]);
        var d = new Date();
        var next = null
        var nextDay = function(day){
          var d = new Date();
          d.setDate(d.getDate() + (day + 7 - d.getDay()) % 7);
          return d;
        };
        // should today?
        if (week[d.getDay()] && (h > d.getHours() || (h === d.getHours() && m > d.getMinutes()))) {
          next = new Date();
          next.setHours(h);
          next.setMinutes(m);
          next.setSeconds(0);
          next.setMilliseconds(0);
        } else {
          for (var i = d.getDay() + 1; i < d.getDay() + 6; i++) {
            if (i > 6) {
              i = i - 6;
            }
            if (week[i]) {
              next = nextDay(i);
              next.setHours(h);
              next.setMinutes(m);
              next.setSeconds(0);
              next.setMilliseconds(0);
              break;
            }
          }
        }
        if (next) {
          var ms = next.getTime() - d.getTime();
          worker.debug('Plan ' + plan.name + ' scheduled at ', next);
          scheduled[plan.id] = setTimeout(function() {
            schedulePlan(plan);
            execPlan(plan);
          }, ms);
        }
    };

    // schedule all plan at startup
    worker.db.plans.find().populate('host').populate('backup').exec(function(err, plans) {
      if (err) {
        return worker.debug(err);
      }

      plans.forEach(function(plan) {
        schedulePlan(plan);
      });
    });

    worker.db.hosts.find({}, function(err, hosts) {
      if (err) {
        return req.debug(err);
      }
      hosts.forEach(function(host) {
        worker.emit('master', {request: 'cluster.addCa', ca: host.key});
      });
    });

    worker.on('request', function(req) {
      switch(req.data.request) {
        case 'schedule':
          schedulePlan(req.data.plan);
          req.resolve({ scheduled: req.data.plan.id });
          break;
        case 'unschedule':
          clearTimeout(scheduled[req.data.plan.id]);
          worker.debug('unscheduled plan ' + req.data.plan.name);
          req.resolve({ unscheduled: req.data.plan.id });
          break;
      }
    });

  });
};

