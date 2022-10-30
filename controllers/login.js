const jwt = require('jsonwebtoken');
const loginRouter = require('express').Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');

loginRouter.post('/', async (request, response) => {
  const { username, password } = request.body;

  const user = await User.findOne({ username });

  const passwordCorrect = user === null
    ? false
    : await bcrypt.compare(password, user.passwordHash);

  if (!(user && passwordCorrect)) {
    response.status(400).json({ error: 'Invalid username or password.' });
  }

  const userForToken = {
    username: user.username,
    id: user._id
  };

  const token = jwt.sign(
    userForToken,
    process.env.SECRET,
    { expiresIn: 60*60 }
  );

  response
    .status(200)
    .send({ token, username: user.username, name: user.name });
});

module.exports = loginRouter;