# Aclatraz as an fastify-middleware

This example uses Aclatraz as an fastify-middleware, to determine if the user got permission.

## Install dependencies

`$ npm install`

## Usage

`npm start`

If you would like to use with nodemon to try more things, then use:

`npm run start:dev`

## Description

### acl.js

It contains an instance of Aclatraz with the rules. In real life, the rules should come from the database to update them on the fly. Rules can be changed via `addRule` `setRule` `delRule` methods.

### authorization.guard.js

The actual fastify-middleware. There are 2 methods inside:

- authGuard
- permissionGuard

AuthGuard verifies the user's JWT token and puts the decoded token data in `request.user`

PermissionGuard uses `request.user` to get the user's permission token (created via Aclatraz) and checks if the user has any of the permissions which the endpoint needs.

### config.js

Contains the JWT secret.

### mockUsers.js

It works like a user repository, but not async way.

### permission.enum.js

A simple object to pair the ruleIds (which should come from the database) with some understandable string. The example uses this enum as a parameter in permissionGuard to easily understand which permission should have the user.

### server.js

Simple fastify app with login, fetching users, and permission manipulation. In this example some endpoints don't require any authentication/authorization:

```js
app.post('/login', (request, reply) => {
```

Some endpoints require authentication (valid JWT token):

```js
app.get(
  '/user/me',
  {
    onRequest: authGuard,
  },
  (request, reply) => {
```

And finally, some endpoints require authentication (valid JWT token) and authorization (permission granted):

```js
app.get(
  '/user/:id',
  {
    onRequest: [
      authGuard,
      permissionGuard(Permission.ADMIN, Permission.READ_OTHER_USERS),
    ],
  },
  (request, reply) => {
```

onRequest hook is the most feasable, because it happens first, and authorization needs only request.headers.
