const blogsRouter = require('express').Router();
const Blog = require('../models/blog');
const User = require('../models/user');
const jwt = require('jsonwebtoken');

blogsRouter.get('/', async (request, response) => {

  const blogs = await Blog
    .find({})
    .populate('user', { username: 1, name: 1 });

  return response.json(blogs);
});

blogsRouter.post('/', async (request, response) => {

  if (!request.body.title || !request.body.author || !request.body.url) {
    return response.status(400).json({
      error: 'All blog parameters must be filled out'
    });
  }

  const decodedToken = jwt.verify(request.token, process.env.SECRET);
  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' });
  }
  const user = await User.findById(decodedToken.id);

  if (!user) {
    return response.status(400).json({
      error: 'Unauthorized to create a new blog post'
    });
  }

  const blog = new Blog({
    title: request.body.title,
    author: request.body.author,
    url: request.body.url,
    likes: request.body.likes === undefined ? 0 : request.body.likes,
    user: user._id
  });

  const savedBlog = await blog.save();

  user.blogs = user.blogs.concat(savedBlog._id);
  await user.save();

  return response.status(201).json(savedBlog);
});

blogsRouter.delete('/:id', async (request, response) => {

  await Blog.findById(request.params.id);

  if (await hasOwnership(request)) {
    await Blog.findByIdAndDelete(request.params.id);
    return response.status(204).end();

  } else {
    return response.status(401).json({
      error: 'unauthorized access to delete blog'
    });
  }
});

blogsRouter.put('/:id', async (request, response) => {

  await Blog.findById(request.params.id);

  if (await hasOwnership(request)) {
    const { title, author, url, likes } = request.body;

    const updatedBlog = await Blog.findByIdAndUpdate(
      request.params.id,
      { title, author, url, likes },
      { new: true, runValidators: true, context: 'query' }
    );
    return response.status(200).json(updatedBlog);

  } else {
    return response.status(401).json({ error: 'unauthorized access to modify blog' });
  }
});

const hasOwnership = async (request) => {

  if (request.user) {
    const userOwnsBlog = request.user.blogs.find(
      blogObjectId => blogObjectId.toJSON() === request.params.id
    );

    if (userOwnsBlog) {
      return true;
    }
  }

  return false;
};

module.exports = blogsRouter;