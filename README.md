# RESTful API using Node.js, Express, Mongoose & TypeScript

![technologies](https://user-images.githubusercontent.com/43285317/45602339-ae69a100-b9d9-11e8-919b-a41b1c2fa66e.png)

This is a boilerplate for building scalable and robust REST APIs using Node.js & TypeScript.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Features](#features)
- [Getting Started](#getting-started)
  - [Installation](#installation)
  - [Directory Structure](#directory-structure)
  - [Available Routes](#available-routes)
  - [Available Scripts](#available-scripts)
- [License](#license)

## Prerequisites

You need to install [MongoDB](https://docs.mongodb.com/manual/administration/install-community/) either on your local machine or using a cloud service as [mLab](https://mlab.com/).

## Features

- [TypeScript](https://www.typescriptlang.org/) as Language

- Framework: [Express.js](https://expressjs.com/)

- ODM: [Mongoose](https://mongoosejs.com/)

- Linting and formatting code using [TSLint](https://palantir.github.io/tslint/) & [Prettier](https://prettier.io/)

- Authentication & Authorization with [JSON Web Tokens](https://jwt.io/)

- Easy configuration of environment variables thanks to [dotenv](https://github.com/motdotla/dotenv)

- [EditorConfig](https://editorconfig.org/)
  for maintain consistent coding style

- [Morgan](https://github.com/expressjs/morgan)
  for logging request

- Using the last ES6 / ES7 features as `async-await`

- Versioned routes for better scalability

## Getting Started

### Installation

1. install the dependencies using `npm install` or `npm i`

2. Rename the file `.env.example` to `.env`, then you need to configure the file `config.ts` located in `src/config`

3. Start the app using `npm run dev`

4. After that, go to: `http://localhost:3000/v1/users`

### Directory Structure

```
├── src
│   ├── apiV1
│   │   ├── auth
│   │   │  ├── auth.controller.ts
│   │   │  └── auth.route.ts
│   │   ├── users
│   │   │   ├── user.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   └── user.route.ts
│   │   └── index.ts
│   ├── config
│   │   ├── config.ts
│   │   └── db.ts
│   ├── helpers
│   │   ├── errorHandler.ts
│   │   └── verifyToken.ts
│   ├── .env.example
│   ├── App.ts
│   └── index.ts
├── .editorconfig
├── .gitignore
├── package.json
├── README.md
├── tsconfig.json
└── tslint.json
```

### Available routes

| Method   | Resource        | Description                                                                                                                                 |
| :------- | :-------------- | :------------------------------------------------------------------------------------------------------------------------------------------ |
| `POST`   | `/register`     | Create a new user in the DB. You need to specify in the body the following attributes: name, lastname, email & password.                    |
| `POST`   | `/authenticate` | Sign in with the email & password. If it's successful, then generates a token                                                               |
| `GET`    | `/users`        | Returns the collection of users present in the DB.                                                                                          |
| `GET`    | `/users/:id`    | It returns the specified id user. You need to specify the token in the header with the following format: `Authorization: Bearer your-token` |
| `PUT`    | `/users/:id`    | Updates an already created user in the DB                                                                                                   |
| `DELETE` | `/users/:id`    | Deletes a user from the DB                                                                                                                  |

### Available scripts

- `build` - Transpile TypeScript to ES6,
- `lint` - Lint your TS code,
- `dev` - To run the app without transpile to ES6,
- `clean` - Remove dist, node_modules, coverage folders,
- `start` - Run the transpiled app
- `prod` - Build & run the transpiled app

## License

MIT © Michael Méndez
