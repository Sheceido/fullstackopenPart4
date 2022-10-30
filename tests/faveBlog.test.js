const favouriteBlog = require('../utils/list_helpers').favouriteBlog;

describe('favourite blog', () => {

  const blogList1 = [];

  const blogList2 = [
    {
      title: 'Canonical string reduction',
      author: 'Edsger W. Dijkstra',
      likes: 12
    }
  ];

  const blogList3 = [
    {
      title: 'React patterns',
      author: 'Michael Chan',
      likes: 21,
    },
    {
      title: 'Go To Statement Considered Harmful',
      author: 'Edsger W. Dijkstra',
      likes: 5,
    },
    {
      title: 'Canonical string reduction',
      author: 'Edsger W. Dijkstra',
      likes: 12,
    },
    {
      title: 'First class tests',
      author: 'Robert C. Martin',
      likes: 10,
    },
    {
      title: 'TDD harms architecture',
      author: 'Robert C. Martin',
      likes: 0,
    },
    {
      title: 'Type wars',
      author: 'Robert C. Martin',
      likes: 2,
    }
  ];

  const answer1 = {};

  const answer2 = {
    title: 'Canonical string reduction',
    author: 'Edsger W. Dijkstra',
    likes: 12
  };

  const answer3 = {
    title: 'React patterns',
    author: 'Michael Chan',
    likes: 21,
  };

  test('of empty list returns an empty object', () => {
    expect(favouriteBlog(blogList1)).toEqual(answer1);
  });

  test('of one blog to equal to the same blog', () => {
    expect(favouriteBlog(blogList2)).toEqual(answer2);
  });

  test('of a list of blogs returns the blog with the most likes', () => {
    expect(favouriteBlog(blogList3)).toEqual(answer3);
  });
});