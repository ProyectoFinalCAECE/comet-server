'use strict';

/**

 * Module dependencies

 */

var expect = require('expect.js');

describe('models/user', function () {

  var created_id = null;

  beforeEach(function () {
    this.User = require('../../models').User;
  });

  after(function() {
    if(created_id != null){
      this.User.findById(created_id).then(function(usr) {
        usr.destroy()
      })
    }
  });

  describe('create', function () {
    it('creates an User', function () {
        var user = this.User.build({ email: 'test@email.com',
                                    firstName: 'test_first_name',
                                    lastName: 'test_last_name',
                                    alias: 'test_first_name'.toLowerCase() + 'test_last_name'.toLowerCase()
                                  });
        user.setPassword('thebestpasswordever');

        return user.save().then(function(userCreated) {
                created_id = userCreated.id
                expect(userCreated.email).to.equal(user.email);
                expect(userCreated.firstName).to.equal(user.firstName);
                expect(userCreated.lastName).to.equal(user.lastName);
                expect(userCreated.alias).to.equal(user.alias);
          });
    });
  });
});
