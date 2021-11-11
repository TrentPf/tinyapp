const express = require("express");
const { getUserByEmail, urlsForUser, generateRandomString } = require("./helpers");
const app = express();
const PORT = 8080; // default port 8080

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieSession = require("cookie-session");
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

const bcrypt = require('bcryptjs');

app.set("view engine", "ejs");

//All requirements, express setup above this comment

//Contains urls
const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca",
              userID: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com",
              userID: "user2RandomID" }
};

//Contains user identification
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

//Home path goes to /login page if not logged in, redirects to /urls page if logged in
app.get("/", (req, res) => {
  if (users[req.session.user_id] === undefined) {
    res.redirect("/login");
  } else {
    res.redirect("/urls");
  }
});

//Render /urls page for specific user along with their unique urls
app.get("/urls", (req, res) => {
  const user = req.session.user_id;
  const userURLs = urlsForUser(user, urlDatabase);
  const templateVars = { user: users[user], urls: userURLs };
  res.render("urls_index", templateVars);
});

//If trying to go to "Create a new url", render the page if logged in, redirect to the login form if not
app.get("/urls/new", (req, res) => {
  if (users[req.session.user_id] === undefined) {
    res.redirect("/login");
  } else {
    const templateVars = { user: users[req.session.user_id] };
    res.render("urls_new", templateVars);
  }
});

//two different templateVars depending on if the url exists or not. Results in different html response pages in urls_show.ejs
app.get("/urls/:shortURL", (req, res) => {
  const user = req.session.user_id;
  if (urlDatabase[req.params.shortURL] === undefined) {
    const templateVars = { user: users[user], shortURL: req.params.shortURL, longURL: undefined, userURL: urlDatabase[req.params.shortURL] };
    res.render("urls_show", templateVars);
  } else {
    const templateVars = { user: users[user], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, userURL: urlDatabase[req.params.shortURL] };
    res.render("urls_show", templateVars);
  }
});

//like the app.get preceding, two different templateVars depending on if the url exists or not. Results in different html response pages in urls_show.ejs
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] === undefined) {
    const user = req.session.user_id;
    const templateVars = { user: users[user], shortURL: req.params.shortURL, longURL: undefined, userURL: urlDatabase[req.params.shortURL] };
    res.render("urls_show", templateVars);
  } else {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  }
});

//If not logged in, render a page that tells the user they need to log in to post urls, otherwise create the new url and redirect to the /urls page unique to the user
app.post("/urls", (req, res) => {
  if (users[req.session.user_id] === undefined) {
    const user = req.session.user_id;
    const templateVars = { user: users[user], shortURL: req.params.shortURL, longURL: undefined, userURL: urlDatabase[req.params.shortURL] };
    res.render("urls_show", templateVars);
  } else {
    const newShort = generateRandomString();
    urlDatabase[newShort] = { longURL: req.body.longURL,
                              userID: req.session.user_id };
    res.redirect(`/urls/${newShort}`);
  }
});

//if else to handle restrictions for curl terminal commands. Let user update their urls if they are logged in to the correct account
app.post("/urls/:id", (req, res) => {
  const user = req.session.user_id;
  if (urlDatabase[req.params.id] && user === urlDatabase[req.params.id].userID) {
    urlDatabase[req.params.id] = { longURL: req.body.longURL,
                                   userID: req.session.user_id};
    res.redirect("/urls");
  } else {
    const templateVars = { user: users[user], shortURL: req.params.shortURL, longURL: undefined, userURL: urlDatabase[req.params.shortURL] };
    console.log("Error 403: You do not have permission to edit this URL");
    res.render("urls_show", templateVars);
  }
});

//Same as preceding. if else handles restrictions for curl terminal commands. Let user delete urls only from the ones unique to them
app.post("/urls/:shortURL/delete", (req, res) => {
  const user = req.session.user_id;
  if (urlDatabase[req.params.shortURL] && user === urlDatabase[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    const templateVars = { user: users[user], shortURL: req.params.shortURL, longURL: undefined, userURL: urlDatabase[req.params.shortURL] };
    console.log("Error 403: You do not have permission to delete this URL");
    res.render("urls_show", templateVars);
  }
});

//If not logged in, render urls_login page. If logged in, redirect to /urls
app.get("/login", (req, res) => {
  if (users[req.session.user_id] === undefined) {
    const templateVars = { user: users[req.session.user_id] };
    res.render("urls_login", templateVars);
  } else {
    res.redirect("/urls");
  }
});

//If not logged in, render urls_register page. If logged in, redirect to /urls
app.get("/register", (req, res) => {
  if (users[req.session.user_id] === undefined) {
    const templateVars = { user: users[req.session.user_id] };
    res.render("urls_register", templateVars);
  } else {
    res.redirect("/urls");
  }
});

//If the email matches one in the database, allow the user to login if the encrypted cookie matches, otherwise render an html response. 
//If the email doesn't match, render an invalid html response
app.post("/login", (req, res) => {
  const user = getUserByEmail(req.body.email, users);
  if (getUserByEmail(req.body.email, users)) {
    if (bcrypt.compareSync(req.body.password, users[user]["password"])) {
      req.session.user_id = user;
      res.redirect("urls");
    } else {
      const templateVars = { user: users[user], emailExist: false };
      res.render("urls_invalid", templateVars);
    }
  } else {
    const templateVars = { user: users[user], emailExist: false };
    res.render("urls_invalid", templateVars);
  }
});

//If email is empty, password is empty, or email already exists in database, render an invalid html response
//Otherwise, register the user's credentials, encrypt them and store, redirect to /urls
app.post("/register", (req, res) => {
  const user = req.session.user_id;
  if (req.body.email === "" || req.body.password === "") {
    const templateVars = { user: users[user], emailExist: false };
    res.render("urls_invalid", templateVars);
  } else if (getUserByEmail(req.body.email, users)) {
    const templateVars = { user: users[user], emailExist: true };
    res.render("urls_invalid", templateVars);
  } else {
    const newID = generateRandomString();
    const hashedPassword = bcrypt.hashSync(req.body.password, 10);
    users[newID] = {id: newID,
                    email: req.body.email,
                    password: hashedPassword};
    req.session.user_id = newID;
    res.redirect("/urls");
  }
});

//Get rid of session cookie when user logs out, redirect them to /urls
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});