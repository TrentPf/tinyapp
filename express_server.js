const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require("cookie-parser");
app.use(cookieParser());

app.set("view engine", "ejs");

const urlsForUser = function(userID) {
  let availableURLs = {};
  for (let url in urlDatabase) {
    if (userID === urlDatabase[url].userID) {
      availableURLs[url] = urlDatabase[url].longURL;
    }
  }
  return availableURLs;
};

const generateRandomString = function() {
  const randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = "";

  for (let i = 0; i < 6; i++) {
    result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
  }
  return result;
};

const emailCheck = function(email, users) {
  for (let user in users) {
    if (email === users[user]["email"]) {
      return user;
    }
  }
  return null;
};

const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca",
              userID: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com",
              userID: "user2RandomID" }
};

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

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  const user = req.cookies["user_id"];
  let userURLs = urlsForUser(user);
  const templateVars = { user: users[user], urls: userURLs };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (users[req.cookies["user_id"]] === undefined) {
    res.redirect("/login");
  } else {
    const templateVars = { user: users[req.cookies["user_id"]] };
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] === undefined) {
    console.log("Error: status code 400: shortURL does not exist");
    res.redirect("/urls");
  } else {
    const user = req.cookies["user_id"];
    let templateVars = { user: users[user], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]["longURL"], userURL: urlDatabase[req.params.shortURL]["userID"] };
    res.render("urls_show", templateVars);
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/register", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("urls_login", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const user = req.cookies["user_id"];
  if (urlDatabase[req.params.shortURL] && user === urlDatabase[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    console.log("You do not have permission to delete this URL");
    res.redirect("/urls");
  }
});

app.post("/urls/:id", (req, res) => {
  const user = req.cookies["user_id"];
  if (urlDatabase[req.params.id] && user === urlDatabase[req.params.id].userID) {
    urlDatabase[req.params.id] = { longURL: req.body.longURL,
                                   userID: req.cookies["user_id"]};
    res.redirect("/urls");
  } else {
    console.log("You do not have permission to edit this URL");
    res.redirect("/urls");
  }
});

app.post("/urls", (req, res) => {
  if (users[req.cookies["user_id"]] === undefined) {
    console.log("Error: you cannot add a new url while not logged in to a registered account");
  } else {
    const newShort = generateRandomString();
    urlDatabase[newShort] = { longURL: req.body.longURL,
                              userID: req.cookies["user_id"] };
    res.redirect(`/urls/${newShort}`);
  }
});

app.post("/login", (req, res) => {
  if (emailCheck(req.body.email, users)) {
    const user = emailCheck(req.body.email, users);
    if (req.body.password === users[user]["password"]) {
      res.cookie("user_id", user);
      res.redirect("urls");
    } else {
      console.log("Error: status code 403: invalid password");
    }
  } else {
    console.log("Error: status code 403: email not registered");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  if (req.body.email === "" || req.body.password === "") {
    console.log("Error: status code 400: invalid email or password");
  } else if (emailCheck(req.body.email, users)) {
    console.log("Error: status code 400: email already exists");
  } else {
    const newID = generateRandomString();
    users[newID] = {id: newID,
                    email: req.body.email,
                    password: req.body.password};
    res.cookie("user_id", newID);
    res.redirect("/urls");
  }
});

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] === undefined) {
    console.log("Error: status code 400: shortURL does not exist");
    res.redirect("/urls");
  } else {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  }
});