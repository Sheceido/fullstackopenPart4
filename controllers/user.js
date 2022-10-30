const bcrypt = require('bcrypt');
const usersRouter = require('express').Router();
const User = require('../models/user');

usersRouter.get('/', async (request, response) => {
  const users = await User
    .find({})
    .populate('blogs',{ url: 1, title: 1, author: 1 });

  return response.status(200).json(users);
});

usersRouter.post('/', async (request, response) => {
  const { username, name, password } = request.body;

  if (!username || !password) {
    return response.status(400).json({
      error:'please enter a valid username and/or password'
    });
  }

  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return response.status(400).json({
      error: 'username must be unique'
    });
  }

  if (username.length < 3 || username.length > 20) {
    return response.status(400).json({
      error: 'username must be between 3 - 20 characters in length'
    });
  }

  if (password.length < 3 || password.length > 50) {
    return response.status(400).json({
      error: 'password must be between 3 - 50 characters in length'
    });
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const user = new User({
    username,
    name,
    passwordHash,
  });

  const savedUser = await user.save();
  response.status(201).json(savedUser);
});

module.exports = usersRouter;