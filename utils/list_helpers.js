const dummy = (blogs) => {
  return 1;
};

const totalLikes = (blogs) => {
  const likes = blogs.map(blog => blog.likes);

  return likes.reduce((sum, item) => sum + item, 0);
};

const favouriteBlog = (blogs) => {

  let mostLikedBlog = {};
  let likesCounter = 0;

  blogs.forEach(blog => {
    if (blog.likes > likesCounter) {
      mostLikedBlog = blog;
      likesCounter = blog.likes;
    }
  });
  return mostLikedBlog;
};

const mostBlogs = (blogs) => {
  const authors = [... new Set(
    blogs.map(blog => blog.author)
  )];

  const bloggers = authors.map(auth => {
    return { author: auth, blogs: 0 };
  });

  blogs.map(blog => {
    bloggers.forEach((blogger) => {
      if (blogger.author === blog.author) {
        blogger.blogs += 1;
      }
    });
  });

  const maxBlogs = Math.max(...bloggers.map(blogger => blogger.blogs));

  return bloggers.find(blogger => blogger.blogs === maxBlogs);
};

const mostLikes = (blogs) => {
  const authors = [... new Set(
    blogs.map(blog => blog.author)
  )];

  const bloggers = authors.map(auth => {
    return { author: auth, likes: 0 };
  });

  blogs.map(blog => {
    bloggers.forEach((blogger) => {
      if (blogger.author === blog.author) {
        blogger.likes += blog.likes;
      }
    });
  });

  const maxLikes = Math.max(...bloggers.map(blogger => blogger.likes));

  return bloggers.find(blogger => blogger.likes === maxLikes);
};

module.exports = {
  dummy,
  totalLikes,
  favouriteBlog,
  mostBlogs,
  mostLikes
};