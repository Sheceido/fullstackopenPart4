const mongoose = require('mongoose');
const supertest = require('supertest');
const app = require('../../app');
const api = supertest(app);

const User = require('../../models/user');
const helper = require('./test_helper');

beforeEach(async () => {
  await User.deleteMany({});
  await helper.populateUsers();
});

describe('Initially with one user in db', () => {
  test('creation successful with proper username and pw', async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: 'rootbeer',
      name: 'Lepeon',
      password: 'thissecretpw'
    };

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd)
      .toHaveLength(usersAtStart.length + 1);

    const usernames = usersAtEnd.map(u => u.username);
    expect(usernames)
      .toContain(newUser.username);
  });

  test('creation failed with incorrect username length', async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: 'r',
      name: 'Lepea',
      password: 'thissecretpw'
    };
    const newUser2 = {
      username: 'rootbeerssrootbeerssrootbeerss',
      name: 'Lepea',
      password: 'thissecretpw'
    };

    await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);
    await api
      .post('/api/users')
      .send(newUser2)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd)
      .toHaveLength(usersAtStart.length);

    const usernames = usersAtEnd.map(u => u.username);
    expect(usernames)
      .not.toContain(newUser.username);
    expect(usernames)
      .not.toContain(newUser2.username);
  });

  test('creation failed with incorrect password length', async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: 'rootbeer',
      name: 'Lepea',
      password: 'thissecretpwthissecretpwthissecretpwthissecretpwthissecretpwthissecretpw'
    };
    const newUser2 = {
      username: 'rootbeer',
      name: 'Lepea',
      password: 'th'
    };

    await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);
    await api
      .post('/api/users')
      .send(newUser2)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd)
      .toHaveLength(usersAtStart.length);

    const usernames = usersAtEnd.map(u => u.username);
    expect(usernames)
      .not.toContain(newUser.username);
    expect(usernames)
      .not.toContain(newUser2.username);
  });

  describe('creation failed with absence of username or password', () => {
    test('fail with absent username', async () => {
      const usersAtStart = await helper.usersInDb();

      const newUser = {
        username: '',
        name: 'Lepea',
        password: 'thissecretpw'
      };
      await api
        .post('/api/users')
        .send(newUser)
        .expect(400)
        .expect('Content-Type', /application\/json/);

      const usersAtEnd = await helper.usersInDb();
      expect(usersAtEnd)
        .toHaveLength(usersAtStart.length);

      const usernames = usersAtEnd.map(u => u.username);
      expect(usernames)
        .not.toContain(newUser.username);
    });

    test('fail with absent password', async () => {
      const usersAtStart = await helper.usersInDb();

      const newUser2 = {
        username: 'rootbeer',
        name: 'Lepea',
        password: ''
      };
      await api
        .post('/api/users')
        .send(newUser2)
        .expect(400)
        .expect('Content-Type', /application\/json/);

      const usersAtEnd = await helper.usersInDb();
      expect(usersAtEnd)
        .toHaveLength(usersAtStart.length);

      const usernames = usersAtEnd.map(u => u.username);
      expect(usernames)
        .not.toContain(newUser2.username);
    });

    test('fail with duplicate username', async () => {
      const usersAtStart = await helper.usersInDb();

      const newUser= {
        username: 'Sheceido',
        name: 'Lepea',
        password: 'secretpw'
      };
      await api
        .post('/api/users')
        .send(newUser)
        .expect(400)
        .expect('Content-Type', /application\/json/);

      const usersAtEnd = await helper.usersInDb();
      expect(usersAtEnd)
        .toHaveLength(usersAtStart.length);

      const usernames = usersAtEnd.map(u => u.username);
      expect(usernames)
        .toContain(newUser.username);
    });
  });
});

describe('login and json web token testing', () => {
  test('successful login returns jwt', async () => {
    const username = 'Sheceido';
    const password = 'ayyylmao';

    const response = await api
      .post('/api/login')
      .send({ username, password })
      .expect(200)
      .expect('Content-Type', /application\/json/);

    expect(response.body.token);
  });

  describe('incorrect username and password should fail login', () => {
    test('incorrect password returns status code 400', async () => {
      const username = 'Sheceido';
      const password = 'aylmao';

      await api
        .post('/api/login')
        .send({ username, password })
        .expect(400)
        .expect('Content-Type', /application\/json/);
    });

    test('incorrect username returns status code 400', async () => {
      const username2 = 'Shec';
      const password2 = 'ayyylmao';

      await api
        .post('/api/login')
        .send({ username2, password2 })
        .expect(400)
        .expect('Content-Type', /application\/json/);
    });

    test('absent password returns status code 400', async () => {
      const username3 = 'Sheceido';
      const password3 = '';

      await api
        .post('/api/login')
        .send({ username3, password3 })
        .expect(400)
        .expect('Content-Type', /application\/json/);
    });
  });
});

afterAll(() => {
  mongoose.connection.close();
});