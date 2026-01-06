const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

// Debugging check to ensure functions are loaded
if (!register || !login) 
{
    console.error("CRITICAL ERROR: Auth Controllers not found. Check authController.js exports.");
}

router.post('/register', register);
router.post('/login', login);

module.exports = router;