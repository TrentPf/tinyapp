const getUserByEmail = function(email, users) {
  for (const user in users) {
    if (email === users[user]["email"]) {
      return user;
    }
  }
  return undefined;
};

const urlsForUser = function(userID, users) {
  const availableURLs = {};
  for (const url in users) {
    if (userID === users[url].userID) {
      availableURLs[url] = users[url].longURL;
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

module.exports = { getUserByEmail, urlsForUser, generateRandomString };