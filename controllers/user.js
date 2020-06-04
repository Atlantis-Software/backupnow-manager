app.route('user', {
  login: [{
    input: {
      username: {
        type: 'string',
        required: true
      },
      password: {
        type: 'string',
        required: true
      }
    },
    policy: []
  }, function (req) {
    req.db.users.findOne({username: req.data.username}, function(err, user) {
      if (err) {
        return req.debug(err);
      }
      if (user && req.data.password === user.password) {
        var user = {
          username: req.data.username
        };
        req.session.user = user;
        req.session.save();
        req.resolve({ user, sessionID: req.session.id });
      } else {
        req.reject('Invalid Username or Password');
      }
    });
  }]
});