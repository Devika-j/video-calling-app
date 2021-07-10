const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');

const {
  v4: uuidV4
} = require('uuid')

//user model
const User = require('../models/User');
const {
  forwardAuthenticated
} = require('../config/auth');

// login Page
router.get('/login', forwardAuthenticated, (req, res) => res.render('login'));

// Register Page
router.get('/register', forwardAuthenticated, (req, res) => res.render('register'));

// Register
router.post('/register', (req, res) => {
  const {
    name,
    email,
    password,
    password2
  } = req.body;
  let errors = [];

  if (!name || !email || !password || !password2) {
    errors.push({
      msg: 'Please enter all fields'
    });
  }

  if (password != password2) {
    errors.push({
      msg: 'Passwords do not match'
    });
  }

  if (password.length < 6) {
    errors.push({
      msg: 'Password must be at least 6 characters'
    });
  }

  if (errors.length > 0) {
    res.render('register', {
      errors,
      name,
      email,
      password,
      password2
    });
  } else {
    //validation passed

    User.findOne({
      name: name
    }).then(user => {
      if (user) {
        errors.push({
          msg: 'Username already exists'
        });
        res.render('register', {
          errors,
          name,
          email,
          password,
          password2
        });
      };
    });

    User.findOne({
      email: email
    }).then(user => {
      if (user) {
        errors.push({
          msg: 'Email already exists'
        });
        res.render('register', {
          errors,
          name,
          email,
          password,
          password2
        });
      } else {
        const newUser = new User({
          name,
          email,
          password
        });

        //hash password
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            //set password to hashed
            newUser.password = hash;
            newUser.save()
              .then(user => {
                req.flash('success_msg', 'You are now registered and can login');
                res.redirect('/users/login');
              })
              .catch(err => console.log(err));
          });
        });
      }
    });
  }

});

router.post('/chat', (req, res) => {
  res.render('chat', {
    roomId: req.body.room_id,
    name: req.user.name
  });
});

//create meeting room
router.get('/room', (req, res) => {
  res.render('chat', {
    roomId: uuidV4(),
    name: req.user.name
  });
});

//join meeting room
router.post('/join', (req, res) => {
  res.render('room', {
    roomId: req.body.room_id,
    name: req.body.name
  });
});

// Back to Page
router.get('/chat/:roomId', (req, res) => {
  res.render('chat', {
    roomId: req.params.roomId,
    name: req.user.name
  });
});

// Login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/users/login',
    failureFlash: true
  })(req, res, next);
});

// Logout
router.get('/logout', (req, res) => {
  req.logout();
  req.flash('success_msg', 'You are logged out');
  res.redirect('/users/login');
});


module.exports = router;
