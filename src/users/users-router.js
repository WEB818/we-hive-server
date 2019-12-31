const express = require("express");
const path = require("path");
const Joi = require("@hapi/joi");
const UsersService = require("./users-service");
const usersRouter = express.Router();
const jsonBodyParser = express.json();

usersRouter.post("/", jsonBodyParser, (req, res, next) => {
  const { first_name, user_name, user_email, password } = req.body;
  const newUser = { first_name, user_name, user_email, password };

  for (const [key, value] of Object.entries(newUser)) {
    if (!value) {
      return res.status(400).json({
        error: `Missing '${key}' in request body`
      });
    }
  }
  const passwordError = UsersService.validatePassword(password);

  if (passwordError) {
    return res.status(400).json({ error: passwordError });
  }

  UsersService.hasUserWithUserName(req.app.get("db"), user_name)
    .then(hasUserWithUserName => {
      if (hasUserWithUserName)
        return res.status(400).json({ error: "Username already taken" });

      return UsersService.hashPassword(password).then(hashedPassword => {
        const newUser = {
          first_name,
          user_name,
          user_email,
          password: hashedPassword,
          date_created: "now()"
        };

        return UsersService.insertUser(req.app.get("db"), newUser).then(
          user => {
            res
              .status(201)
              .location(path.posix.join(req.originalUrl, `/${user.id}`))
              .json(UsersService.serializeUser(user));
          }
        );
      });
    })
    .catch(next);
});

module.exports = usersRouter;
