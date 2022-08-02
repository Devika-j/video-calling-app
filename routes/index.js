const express = require('express');
const router = express.Router();
const {
  ensureAuthenticated,
  forwardAuthenticated
} = require('../config/auth');

// Welcome Page
router.get('/', forwardAuthenticated, (req, res) => res.render('welcome'));

//Dashboard
router.get('/dashboard', ensureAuthenticated, (req, res) => res.render('dashboard', {
  name: req.user.name,
  email: req.user.email
}));



module.exports = router;
