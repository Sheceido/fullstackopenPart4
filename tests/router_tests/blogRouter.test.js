const mongoose = require('mongoose');
const supertest = require('supertest');
const app = require('../../app');
const api = supertest(app);
const jwt = require('jsonwebtoken');

const Blog = require('../../models/blog');
const User = require('../../models/user');
const helper = require('./test_helper');

const getLoginToken = async () => {
  const response = await api
    .post('/api/login')
    .send({ username: 'Sheceido', password: 'ayyylmao' })
    .expect(200)
    .expect('Content-Type', /application\/json/);
  return response.body.token;
};

beforeEach(async () => {
  await User.deleteMany({});
  await helper.populateUsers();

  await Blog.deleteMany({});
  const blogObjects = helper.initialBlogs.map(blog => new Blog(blog));
  const promiseArray = blogObjects.map(blog => blog.save());
  await Promise.all(promiseArray);

  const decodedToken = jwt.verify(await getLoginToken(), process.env.SECRET);
  const owner = await User.findById(decodedToken.id);

  const ownedBlog = new Blog({
    title: 'Testing blog',
    author: 'Leon',
    url: 'localhost:3001',
    likes: 0,
    user: owner._id
  });
  await ownedBlog.save();
  owner.blogs = owner.blogs.concat(ownedBlog._id);
  await owner.save();
}, 100000);

describe('GET requests for blogs', () => {
  test('blogs returned as json', async () => {
    await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/);
  });

  test('all blogs are returned', async () => {
    const response = await api.get('/api/blogs');
    expect(response.body)
      .toHaveLength(helper.initialBlogs.length + 1);
  });

  test('a specific blog title is within the returned blogs', async () => {
    const response = await api.get('/api/blogs');
    const titles = response.body.map(b => b.title);
    expect(titles)
      .toContain('TDD harms architecture');
  });

  test('retrieving a specific but invalid blog id returns 404', async () => {
    const invalidId = helper.invalidId;

    await api
      .get(`/api/blogs/${invalidId}`)
      .expect(404)
      .expect('Content-Type', /application\/json/);
  });

  test('all blogs should have unique id property', async () => {
    const response = await api.get('/api/blogs');

    const allIds = response.body.map(b => b.id);
    const allUniqueIds = [... new Set(allIds)];

    expect(allIds)
      .toHaveLength(helper.initialBlogs.length + 1);

    allIds
      .forEach(id => expect(id).toBeDefined());
    allUniqueIds
      .forEach(uniqueId => expect(uniqueId).toBeDefined());
  });
});

describe('POST requests for a new Blog', () => {
  test('POST succeeds and new blog will be included in GET for all blogs', async () => {
    const token = await getLoginToken();

    const newBlogObject = {
      title: 'Testing backend is rather interesting',
      author: 'Sheceido',
      url: 'localhost:3001/api/blogs',
      likes: 2
    };

    await api
      .post('/api/blogs')
      .set('Authorization', 'Bearer ' + token)
      .send(newBlogObject)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    const blogsAfterPOST = await helper.blogsInDb();
    expect(blogsAfterPOST)
      .toHaveLength(helper.initialBlogs.length + 2);

    const titles = blogsAfterPOST.map(b => b.title);
    expect(titles)
      .toContain(newBlogObject.title);
  });

  test('Saving object with absent like value defaults to value of zero', async () => {
    const token = await getLoginToken();

    const blogAbsentLikes = {
      title: 'Testing backend is rather interesting',
      author: 'Sheceido',
      url: 'localhost:3001/api/blogs',
    };

    await api
      .post('/api/blogs')
      .set('Authorization', 'Bearer ' + token)
      .send(blogAbsentLikes)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    const blogsAfterPOST = await helper.blogsInDb();
    expect(blogsAfterPOST)
      .toHaveLength(helper.initialBlogs.length + 2);

    const newBlog = blogsAfterPOST.find(blog => blog.title === blogAbsentLikes.title);
    expect(newBlog.title)
      .toEqual(blogAbsentLikes.title);

    expect(newBlog.likes)
      .toEqual(0);
  });

  test('Absent title or url returns 400 without saving new Blog', async () => {
    const token = await getLoginToken();

    const errorBlog = {
      author: 'Sheceido',
      likes: '2'
    };

    await api
      .post('/api/blogs')
      .set('Authorization', 'Bearer ' + token)
      .send(errorBlog)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    const blogsAfterPOST = await helper.blogsInDb();
    expect(blogsAfterPOST)
      .toHaveLength(helper.initialBlogs.length + 1);
  });

  test('invalid token authorization returns 401 without saving new Blog', async () => {
    const invalidJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IlNoZWNlaWRvIiwiaWQiOiI2MzVjYWQxYjEzODhhN2Q2MjJlMmE4NWUiLCJpYXQiOjE2NjcwNjA3NTEsImV4cCI6MTY2NzA2NDM1MX0._aGZi20TxgCyJdVdKm1k65guaLZ4W2VpPmSL_NtzYja';

    const blogToAdd = {
      title: 'Testing backend is rather interesting',
      author: 'Sheceido',
      url: 'localhost:3001/api/blogs',
      likes: 0
    };

    await api
      .post('/api/blogs')
      .set('Authorization', 'Bearer ' + invalidJWT)
      .send(blogToAdd)
      .expect(401)
      .expect('Content-Type', /application\/json/);

    const blogsAfterPOST = await helper.blogsInDb();
    expect(blogsAfterPOST)
      .toHaveLength(helper.initialBlogs.length + 1);
  });

  test('absent token authorization returns 401 without saving new Blog', async () => {
    const absentToken = '';

    const blogToAdd = {
      title: 'Testing backend is rather interesting',
      author: 'Sheceido',
      url: 'localhost:3001/api/blogs',
      likes: 0
    };

    await api
      .post('/api/blogs')
      .set('Authorization', 'Bearer ' + absentToken)
      .send(blogToAdd)
      .expect(401)
      .expect('Content-Type', /application\/json/);

    const blogsAfterPOST = await helper.blogsInDb();
    expect(blogsAfterPOST)
      .toHaveLength(helper.initialBlogs.length + 1);
  });

  test('absent authorization header returns 401 without saving new Blog', async () => {
    const blogToAdd = {
      title: 'Testing backend is rather interesting',
      author: 'Sheceido',
      url: 'localhost:3001/api/blogs',
      likes: 0
    };

    await api
      .post('/api/blogs')
      .send(blogToAdd)
      .expect(401)
      .expect('Content-Type', /application\/json/);

    const blogsAfterPOST = await helper.blogsInDb();
    expect(blogsAfterPOST)
      .toHaveLength(helper.initialBlogs.length + 1);
  });
});

describe('DELETE a specific blog', () => {
  test('return status 204 with deletion of valid blog', async () => {
    const token = await getLoginToken();

    const blogs = await helper.blogsInDb();
    const deleteBlog = blogs[blogs.length - 1];

    await api
      .delete(`/api/blogs/${deleteBlog.id}`)
      .set('Authorization', 'Bearer ' + token)
      .expect(204);

    const blogsAfterDeletion = await helper.blogsInDb();
    expect(blogsAfterDeletion)
      .toHaveLength(helper.initialBlogs.length);
  });

  test('return status 400 with attempt deletion of invalid blog', async () => {
    const token = await getLoginToken();

    const invalidBlogId = helper.invalidId;

    await api
      .delete(`/api/blogs/${invalidBlogId}`)
      .set('Authorization', 'Bearer ' + token)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    const blogsAfterAttempt = await helper.blogsInDb();
    expect(blogsAfterAttempt)
      .toHaveLength(helper.initialBlogs.length + 1);
  });

  test('invalid webtoken returns status 401 without deleting blog', async () => {
    const invalidJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IlNoZWNlaWRvIiwiaWQiOiI2MzVjYWQxYjEzODhhN2Q2MjJlMmE4NWUiLCJpYXQiOjE2NjcwNjA3NTEsImV4cCI6MTY2NzA2NDM1MX0._aGZi20TxgCyJdVdKm1k65guaLZ4W2VpPmSL_NtzYja';
    const blogs = await helper.blogsInDb();
    const deleteBlog = blogs[blogs.length - 1];

    await api
      .delete(`/api/blogs/${deleteBlog.id}`)
      .set('Authorization', 'Bearer ' + invalidJWT)
      .expect(401)
      .expect('Content-Type', /application\/json/);

    const blogsAfterAttempt = await helper.blogsInDb();
    expect(blogsAfterAttempt)
      .toHaveLength(helper.initialBlogs.length + 1);
  });

  test('absent webtoken returns status 401 without deleting blog', async () => {
    const absentToken = '';
    const blogs = await helper.blogsInDb();
    const deleteBlog = blogs[blogs.length - 1];

    await api
      .delete(`/api/blogs/${deleteBlog.id}`)
      .set('Authorization', 'Bearer ' + absentToken)
      .expect(401)
      .expect('Content-Type', /application\/json/);

    const blogsAfterAttempt = await helper.blogsInDb();
    expect(blogsAfterAttempt)
      .toHaveLength(helper.initialBlogs.length + 1);
  });

  test('absent authorization header returns status 401 without deleting blog', async () => {
    const blogs = await helper.blogsInDb();
    const deleteBlog = blogs[blogs.length - 1];

    await api
      .delete(`/api/blogs/${deleteBlog.id}`)
      .expect(401)
      .expect('Content-Type', /application\/json/);

    const blogsAfterAttempt = await helper.blogsInDb();
    expect(blogsAfterAttempt)
      .toHaveLength(helper.initialBlogs.length + 1);
  });
});

describe('UPDATE blog parameters', () => {
  test('status code 200 with successful update of likes', async () => {
    const token = await getLoginToken();

    const blogs = await helper.blogsInDb();
    const blogToUpdate = { ...blogs[blogs.length - 1] };
    blogToUpdate.likes += 1;

    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .set('Authorization', 'Bearer ' + token)
      .send(blogToUpdate)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const blogsAfterUpdate = await helper.blogsInDb();

    const updatedBlog = blogsAfterUpdate.find(b => b.title === blogs[blogs.length - 1].title);
    expect(updatedBlog.likes)
      .toEqual(blogs[blogs.length - 1].likes + 1);
  });

  test('status code 400 with invalid ID update request', async () => {
    const token = await getLoginToken();

    const invalidId = helper.invalidId;

    const invalidObject = {
      id: invalidId,
      title: 'Testing backend is rather interesting',
      author: 'Sheceido',
      url: 'localhost:3001/api/blogs',
      likes: 2
    };

    await api
      .put(`/api/blogs/${invalidId}`)
      .set('Authorization', 'Bearer ' + token)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    const blogsAfterAttempt = await helper.blogsInDb();
    expect(blogsAfterAttempt)
      .not.toContain(invalidObject.title);
  });

  test('invalid json webtoken returns status 401 without updating blog', async () => {
    const invalidJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IlNoZWNlaWRvIiwiaWQiOiI2MzVjYWQxYjEzODhhN2Q2MjJlMmE4NWUiLCJpYXQiOjE2NjcwNjA3NTEsImV4cCI6MTY2NzA2NDM1MX0._aGZi20TxgCyJdVdKm1k65guaLZ4W2VpPmSL_NtzYja';

    const blogs = await helper.blogsInDb();
    const blogToUpdate = { ...blogs[blogs.length - 1] };
    blogToUpdate.likes += 1;

    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .set('Authorization', 'Bearer ' + invalidJWT)
      .send(blogToUpdate)
      .expect(401)
      .expect('Content-Type', /application\/json/);

    const blogsAfterUpdate = await helper.blogsInDb();

    const updatedBlog = blogsAfterUpdate.find(b => b.title === blogs[blogs.length - 1].title);
    expect(updatedBlog.likes)
      .toEqual(blogs[blogs.length - 1].likes);
  });

  test ('absent webtoken returns status 401 without updating blog', async () => {
    const absentToken = '';

    const blogs = await helper.blogsInDb();
    const blogToUpdate = { ...blogs[blogs.length - 1] };
    blogToUpdate.likes += 1;

    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .set('Authorization', 'Bearer ' + absentToken)
      .send(blogToUpdate)
      .expect(401)
      .expect('Content-Type', /application\/json/);

    const blogsAfterUpdate = await helper.blogsInDb();

    const updatedBlog = blogsAfterUpdate.find(b => b.title === blogs[blogs.length - 1].title);
    expect(updatedBlog.likes)
      .toEqual(blogs[blogs.length - 1].likes);
  });

  test ('absent authorization header returns status 401 without updating blog', async () => {
    const blogs = await helper.blogsInDb();
    const blogToUpdate = { ...blogs[blogs.length - 1] };
    blogToUpdate.likes += 1;

    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(blogToUpdate)
      .expect(401)
      .expect('Content-Type', /application\/json/);

    const blogsAfterUpdate = await helper.blogsInDb();

    const updatedBlog = blogsAfterUpdate.find(b => b.title === blogs[blogs.length - 1].title);
    expect(updatedBlog.likes)
      .toEqual(blogs[blogs.length - 1].likes);
  });
});

afterAll(() => {
  mongoose.connection.close();
});