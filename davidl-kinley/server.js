'use strict';

// DONE: Install and require the NPM Postgres package 'pg' into your server.js, and ensure that it is then listed as a dependency in your package.json
const FS = require('fs');
const EXPRESS = require('express');
const PG = require('pg');
// REVIEW: Require in body-parser for post requests in our server. If you want to know more about what this does, read the docs!
const BODYPARSER = require('body-parser');
const PORT = process.env.PORT || 3000;
const APP = EXPRESS();

// DONE: Complete the connection string for the url that will connect to your local postgres database
// Windows and Linux users; You should have retained the user/pw from the pre-work for this course.
// Your url may require that it's composed of additional information including user and password
// const conString = 'postgres://USER:PASSWORD@HOST:PORT/DBNAME';
const CONSTRING = process.env.DATABASE_URL;

// DONE: Our pg module has a Client constructor that accepts one argument: the conString we just defined.
//       This is how it knows the URL and, for Windows and Linux users, our username and password for our
//       database when CLIENT.connect is called on line 26. Thus, we need to pass our conString into our
//       pg.Client() call.
const CLIENT = new PG.Client(CONSTRING);

// REVIEW: Use the CLIENT object to connect to our DB.
CLIENT.connect();


// REVIEW: Install the middleware plugins so that our APP is aware and can use the body-parser module
APP.use(BODYPARSER.json());
APP.use(BODYPARSER.urlencoded({extended: true}));
APP.use(EXPRESS.static('./public'));


// REVIEW: Routes for requesting HTML resources
APP.get('/new', function(request, response) {
  // COMMENTed: What number(s) of the full-stack-diagram.png image correspond to the following line of code? Which method of article.js is interacting with this particular piece of `server.js`? What part of CRUD is being enacted/managed by this particular piece of code?
  // Put your response here: the above requests the server for new.html which is being sent with sendfile as the response, which is #5 on the diagram. There is nothing here interacting with article.js. We are Reading (the R in CRUD) new.html.
  response.sendFile('new.html', {root: './public'});
});


// REVIEW: Routes for making API calls to use CRUD Operations on our database
APP.get('/articles', function(request, response) {
  // COMMENTed: What number(s) of the full-stack-diagram.png image correspond to the following line of code? Which method of article.js is interacting with this particular piece of `server.js`? What part of CRUD is being enacted/managed by this particular piece of code?
  // Put your response here: Line 46 is querying the database (3), lines 47-48 are retrieving from the database (4), and sending to the browser (5). Lines 50-53 are sending the response(5) to the client of the result (4) if there was an error. In article.js, the data we retrieved is used with fetchall, which calls loadall, which makes new articles, and new articles now all use the method keys. This is Reading the data (R in CRUD).
  CLIENT.query('SELECT * FROM articles')
  .then(function(result) {
    response.send(result.rows);
  })
  .catch(function(err) {
    console.error(err)
  })
});

APP.post('/articles', function(request, response) {
  // COMMENTed: What number(s) of the full-stack-diagram.png image correspond to the following line of code? Which method of article.js is interacting with this particular piece of `server.js`? What part of CRUD is being enacted/managed by this particular piece of code?
  // Put your response here: CLIENT.query is a query (3), which is inserting things into our database, then lines 72-78 are a response (5) which tells the client the result (4) of their post. This interacts with the .insertRecord method in article.js. This is Creating data (C in CRUD).
  CLIENT.query(
    `INSERT INTO
    articles(title, author, "authorUrl", category, "publishedOn", body)
    VALUES ($1, $2, $3, $4, $5, $6);
    `,
    [
      request.body.title,
      request.body.author,
      request.body.authorUrl,
      request.body.category,
      request.body.publishedOn,
      request.body.body
    ]
  )
  .then(function() {
    response.send('insert complete')
  })
  .catch(function(err) {
    console.error(err);
  });
});

APP.put('/articles/:id', function(request, response) {
  // COMMENTed: What number(s) of the full-stack-diagram.png image correspond to the following line of code? Which method of article.js is interacting with this particular piece of `server.js`? What part of CRUD is being enacted/managed by this particular piece of code?
  // Put your response here: The query is a query (3), then lines 99-105 are the response (5) to the user, of the result (4) of their update. This interacts with the .updateRecord method in article.js. This is an Update, (U in CRUD).
  CLIENT.query(
    `UPDATE articles
    SET
      title=$1, author=$2, "authorUrl"=$3, category=$4, "publishedOn"=$5, body=$6
    WHERE article_id=$7;
    `,
    [
      request.body.title,
      request.body.author,
      request.body.authorUrl,
      request.body.category,
      request.body.publishedOn,
      request.body.body,
      request.params.id
    ]
  )
  .then(function() {
    response.send('update complete')
  })
  .catch(function(err) {
    console.error(err);
  });
});

APP.delete('/articles/:id', function(request, response) {
  // COMMENTed: What number(s) of the full-stack-diagram.png image correspond to the following line of code? Which method of article.js is interacting with this particular piece of `server.js`? What part of CRUD is being enacted/managed by this particular piece of code?
  // The following code pertains to number 3 on the diagram and it also sends a result back to the browser in a response which is numbers 4 and 5. This is interacting with the deleteRecord method. This is the D in CRUD.
  CLIENT.query(
    `DELETE FROM articles WHERE article_id=$1;`,
    [request.params.id]
  )
  .then(function() {
    response.send('Delete complete')
  })
  .catch(function(err) {
    console.error(err);
  });
});

APP.delete('/articles', function(request, response) {
  // COMMENT: What number(s) of the full-stack-diagram.png image correspond to the following line of code? Which method of article.js is interacting with this particular piece of `server.js`? What part of CRUD is being enacted/managed by this particular piece of code?
  // The following code corresponds to numbers 3, 4 and 5 on the diagram. This is interacting with the truncateTable method on article.js. This is also the D in CRUD.
  CLIENT.query(
    'DELETE FROM articles;'
  )
  .then(function() {
    response.send('Delete complete')
  })
  .catch(function(err) {
    console.error(err);
  });
});

// COMMENT: What is this function invocation doing?
// If there isnt already a table setup for the articles, it is setting up a table with the propery column and attributes. Then it runs the function loadArticles.
loadDB();

APP.listen(PORT, function() {
  console.log(`Server started on port ${PORT}!`);
});


//////// ** DATABASE LOADER ** ////////
////////////////////////////////////////
function loadArticles() {
  // COMMENT: What number(s) of the full-stack-diagram.png image correspond to the following line of code? Which method of article.js is interacting with this particular piece of `server.js`? What part of CRUD is being enacted/managed by this particular piece of code?
  // The following code all happens in the DB and does not pertain to a number on the diagram. It doesnt interact with any method in the article.js file. 
  CLIENT.query('SELECT COUNT(*) FROM articles')
  .then(result => {
    // REVIEW: result.rows is an array of objects that Postgres returns as a response to a query.
    //         If there is nothing on the table, then result.rows[0] will be undefined, which will
    //         make count undefined. parseInt(undefined) returns NaN. !NaN evaluates to true.
    //         Therefore, if there is nothing on the table, line 151 will evaluate to true and
    //         enter into the code block.
    if(!parseInt(result.rows[0].count)) {
      FS.readFile('./public/data/hackerIpsum.json', (err, fd) => {
        JSON.parse(fd.toString()).forEach(ele => {
          CLIENT.query(`
            INSERT INTO
            articles(title, author, "authorUrl", category, "publishedOn", body)
            VALUES ($1, $2, $3, $4, $5, $6);
          `,
            [ele.title, ele.author, ele.authorUrl, ele.category, ele.publishedOn, ele.body]
          )
        })
      })
    }
  })
}

function loadDB() {
  // COMMENT: What number(s) of the full-stack-diagram.png image correspond to the following line of code? Which method of article.js is interacting with this particular piece of `server.js`? What part of CRUD is being enacted/managed by this particular piece of code?
  // Put your response here...
  CLIENT.query(`
    CREATE TABLE IF NOT EXISTS articles (
      article_id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      author VARCHAR(255) NOT NULL,
      "authorUrl" VARCHAR (255),
      category VARCHAR(20),
      "publishedOn" DATE,
      body TEXT NOT NULL);`
    )
    .then(function() {
      loadArticles();
    })
    .catch(function(err) {
      console.error(err);
    }
  );
}
