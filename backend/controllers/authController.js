const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Generate JWT
const generateToken = (id) => 
{
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// desc    Register new user
// route   POST /api/auth/register
const register = async (req, res) => 
{
  const { username, email, password, age, college, address } = req.body;

  if (!username || !email || !password) 
  {
    return res.status(400).json({ message: 'Please add all required fields' });
  }

  try 
  {
    const userExists = await User.findOne({ email });
    if (userExists) 
    {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create(
      {
      username:username,
      email:email,
      password: hashedPassword,
      age: age || null,
      college: college || '',
      address: address || ''
     }
  );

    if (user) 
      {
      res.status(201).json({
        token: generateToken(user._id),
        user: 
        {
          _id: user._id,
          username: user.username,
          email: user.email,
          age: user.age,
          college: user.college,
          address: user.address,
          rank: user.rank,
          wins: user.wins
        }
      });
    } 
    else 
    {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } 
  catch (error) 
  {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

//  Authenticate a user
//  POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;

  try 
  {
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) 
      {
      res.json({
        token: generateToken(user._id),
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          age: user.age,
          college: user.college,
          address: user.address,
          rank: user.rank,
          wins: user.wins,
          matchesPlayed: user.matchesPlayed
        }
      });
    } else {
      res.status(400).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


module.exports = { register, login };