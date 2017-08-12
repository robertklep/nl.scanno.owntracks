const Homey = require('homey');
module.exports = [{
   description:	'Notify on settings changed',
   method:      'POST',
   path:        '/test/settingschange/',
   requires_authorization: true,
   role: 'owner',
   fn: function(args, callback) {
      var result = Homey.app.changedSettings(args);
      if( result instanceof Error ) return callback( result );
      return callback( null, result );
   }
},
{
   description:	'Show latst loglines',
   method:      'GET',
   path:        '/test/getloglines/',
   requires_authorization: true,
   role: 'owner',
   fn: function( args, callback ) {
      var result = Homey.app.getLogLines();
      callback(null, result);
   }
},
{
   description:	'Get Array with user info',
   method:      'GET',
   path:        '/test/getUserArray/',
   requires_authorization: true,
   role: 'owner',
   fn: function(args, callback) {
      var result = Homey.app.getUserArray();
      callback(null, result);
   }
},
{
   description:	'Get Array with fence info',
   method:      'GET',
   path:        '/test/getFenceArray/',
   requires_authorization: true,
   role: 'owner',
   fn: function(args, callback) {
      var result = Homey.app.getFenceArray();
      callback(null, result);
   }
},
{
   description:	'Purge userdata',
   method:      'GET',
   path:        '/test/purgeUserData/',
   requires_authorization: true,
   role: 'owner',
   fn: function(args, callback) {
      var result = Homey.app.purgeUserData(args);
      callback(null, result);
   }
},
{
   description:	'Add new User',
   method:      'POST',
   path:        '/test/addNewUser/',
   requires_authorization: true,
   role: 'owner',
   fn: function(args, callback) {
      result = Homey.app.addNewUser(args);
      if( result instanceof Error ) return callback( result );
      return callback( null, result );
   }
},
{
   description:	'Delete User',
   method:      'POST',
   path:        '/test/deleteUser/',
   requires_authorization: true,
   role: 'owner',
   fn: function(args, callback) {
      var result = Homey.app.deleteUser(args);
      if( result instanceof Error ) return callback( result );
      return callback( null, result );
   }
},
{
   description:	'Add new Fence',
   method:      'POST',
   path:        '/test/addNewFence/',
   requires_authorization: true,
   role: 'owner',
   fn: function(args, callback) {
      var result = Homey.app.addNewFence(args);
      if( result instanceof Error ) return callback( result );
      return callback( null, result );
   }
},
{
   description:	'Delete Fence',
   method:      'POST',
   path:        '/test/deleteFence/',
   requires_authorization: true,
   role: 'owner',
   fn: function(args, callback) {
      var result = Homey.app.deleteFence(args);
      if( result instanceof Error ) return callback( result );
      return callback( null, result );
   }
},
{
   description:	'Receive owntracks events',
   method:      'POST',
   path:        '/events/',
   public: true,
//   requires_authorization: false,
   fn: function(args, callback) {
      var result = Homey.app.handleOwntracksEvents(args);
      console.log("Result of POST: "+result);
      if( result instanceof Error ) callback( result );
      callback( null, result );
   }
}

]




