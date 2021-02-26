# Aclatraz ![GitHub package.json dynamic](https://img.shields.io/github/package-json/keywords/PoOwAa/aclatraz)

![Travis (.com)](https://img.shields.io/travis/com/PoOwAa/aclatraz?logo=travis)
![Codecov](https://img.shields.io/codecov/c/github/PoOwAa/aclatraz?label=codecov&logo=codecov)
![npm](https://img.shields.io/npm/v/aclatraz?logo=javascript)
![npm bundle size](https://img.shields.io/bundlephobia/min/aclatraz?logo=npm)

Simple dependency-free package for ACL. It can handle hundreds of roles easily.

## Install

`npm install aclatraz`

## How it works

1. Create the rules (they can be roles as well)
2. Load them into Aclatraz
3. Generate permission tokens based on rules
4. Verify token

### TypeScript example

```typescript
import { Aclatraz } from 'aclatraz';

// Create an ACL instance. Don't forget to store
// somewhere the rules (preferably in DB, or in a file)
const acl = new Aclatraz([
  {
    id: 1,
    slug: 'READ_USER',
  },
  {
    id: 2,
    slug: 'SUPERADMIN',
  },
]);

// Add new rule on the fly
acl.addRule({
  id: 2,
  slug: 'CREATE_USER',
  name: 'Protect registration with this rule',
});

// User with this token can access id: 1 rule
let permissionToken = acl.generateAclCode([1]);
console.log(acl.verify(permissionToken, 1)); // true
console.log(acl.verify(permissionToken, 2)); // false

// Grant superadmin permission to the user
permissionToken = acl.grantPermission(permissionToken, [2]);
console.log(acl.verify(permissionToken, 1)); // true
console.log(acl.verify(permissionToken, 2)); // true

// Revoke the superadmin permission
permissionToken = acl.revokePermission(permissionToken, [2]);
console.log(acl.verify(permissionToken, 1)); // true
console.log(acl.verify(permissionToken, 2)); // false
```

### How to use as an express middleware

```js
import jwt from 'jsonwebtoken';
import express from 'express';
import { Aclatraz } from 'aclatraz';

const app = express();

// Create the Aclatraz instance. Store the rules in redis/database etc.
export const acl = new Aclatraz([
  {
    id: 1,
    slug: 'ADMIN',
  },
  {
    id: 2,
    slug: 'USER',
  },
  {
    id: 3,
    slug: 'READ_OTHER_USERS',
  },
  {
    id: 4,
    slug: 'CREATE_USER',
  },
]);

// Create a guard which takes the permission from JWT
function permissionGuard(...permissionList) {
  return (req, res, next) => {
    // Get the authorization header
    const { authorization } = req.headers;

    if (!authorization) {
      return res.sendStatus(401);
    }

    // Get the token from the Bearer token
    const [_, token] = authorization.split(' ');

    // Decode the token
    const user = jwt.decode(token, 'JWTSECRET');

    // The Aclatraz permission token stored under user.permission in this example
    const permission = user.permission;

    // Check if the user permission matches any of the rules
    let permissionGranted = false;
    for (const ruleId of permissionList) {
      if (acl.verify(permission, ruleId)) {
        permissionGranted = true;
        break;
      }
    }

    // No match, then forbidden
    if (!permissionGranted) {
      return res.sendStatus(403);
    }

    // There is a match, we can let the user in
    next();
  };
}

// Actual endpoint. The second parameter is our guard as a middleware, where we can define the rules by their ID
app.get('/guardedEndpoint', permissionGuard(1, 2), (req, res) => {
  res.send('Nice! You have permission to see this!');
});

app.listen(3000, () => {
  console.log('app is listening...');
});
```

### How to use as a fastify middleware

_Soon..._

### How to use as a NestJS guard

_Soon..._
