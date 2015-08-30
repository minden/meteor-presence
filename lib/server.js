var connections = {};

var presenceExpiration = 10000; 

var expire = function(id) {
  Presences.remove(id);
  delete connections[id];
};

var tick = function(id) {
  connections[id].lastSeen = Date.now();
};

Meteor.startup(function() {
  Presences.remove({});
});

Meteor.onConnection(function(connection) {
  // console.log('connectionId: ' + connection.id);
  Presences.insert({ _id: connection.id });

  connections[connection.id] = {};
  tick(connection.id);

  connection.onClose(function() {
    // console.log('connection closed: ' + connection.id);
    expire(connection.id);
  });
});

Meteor.methods({
  presenceTick: function() {
    check(arguments, [Match.Any]);
    if (this.connection && connections[this.connection.id])
      tick(this.connection.id);
  }
});

Meteor.methods({
  setPresenceExpiration: function(time) {
    presenceExpiration = time;
  }
});

Meteor.setInterval(function() {
  _.each(connections, function(connection, id) {
    if (connection.lastSeen < (Date.now() - presenceExpiration))
      expire(id);
  });
}, 5000);
