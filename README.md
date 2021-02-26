# Aclatraz ![GitHub package.json dynamic](https://img.shields.io/github/package-json/keywords/PoOwAa/aclatraz)

![example branch parameter](https://github.com/PoOwAa/aclatraz/actions/workflows/test.yml/badge.svg?branch=main)
![Codecov](https://img.shields.io/codecov/c/github/PoOwAa/aclatraz?label=codecov&logo=codecov)
![npm](https://img.shields.io/npm/v/aclatraz?logo=javascript)
![npm bundle size](https://img.shields.io/bundlephobia/min/aclatraz?logo=npm)

Simple dependency-free package for ACL. It can handle hundreds of roles easily.

## Features

- dependency-free
- built-in TypeScript support
- can manipulate rules on the fly
- the generated permission token can be saved on client side (for example in JWT token) to avoid database queries to verify permission
- you can use as middleware in express/fastify/NestJS
- unit tests, 100% coverage

## Install

`npm install aclatraz`

## How it works

1. Create the rules (they can be roles as well)
2. Load them into Aclatraz
3. Generate permission tokens based on rules
4. Verify token

## Documentation

- [Examples](#Examples)
  - [TypeScript example](#tsExample)
  - [Express middleware](#expressMiddleware)
  - [Fastify middleware](#fastifyMiddleware)
  - [NestJS guard](#nestjsGuard)
- [Interfaces](#interfaces)
- [Methods](#Methods)
  - [create new Instance](#constructor)
  - [addRule](#addRule)
  - [setRule](#setRule)
  - [delRule](#delRule)
  - [setOptions](#setOptions)
  - [getRules](#getRules)
  - [verify](#verify)
  - [generateAclCode](#generateAclCode)
  - [generateRuleTemplate](#generateRuleTemplate)
  - [grantPermission](#grantPermission)
  - [revokePermission](#revokePermission)

## Examples

<a name="tsExample"></a>

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
    name: 'Glorious superadmin rule',
  },
]);

// Add new rule on the fly
acl.addRule({
  id: 3,
  slug: 'CREATE_USER',
  name: 'Protect user creation with this rule',
});

// User with this token can access id: 1 rule
let permissionToken = acl.generateAclCode([1]);
console.log(acl.verify(permissionToken, 1)); // true
console.log(acl.verify(permissionToken, 2)); // false
console.log(acl.verify(permissionToken, 3)); // false

// Grant superadmin permission to the user
permissionToken = acl.grantPermission(permissionToken, [2, 3]);
console.log(acl.verify(permissionToken, 1)); // true
console.log(acl.verify(permissionToken, 2)); // true
console.log(acl.verify(permissionToken, 3)); // true

// Revoke the superadmin permission
permissionToken = acl.revokePermission(permissionToken, [2]);
console.log(acl.verify(permissionToken, 1)); // true
console.log(acl.verify(permissionToken, 2)); // false
console.log(acl.verify(permissionToken, 3)); // true
```

<a name="expressMiddleware"></a>

### How to use as an express middleware (here is a more detailed [example](examples/express-middleware/README.md))

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

<a name="fastifyMiddleware"></a>

### How to use as a fastify middleware

```js
import jwt from 'jsonwebtoken';
import fastify from 'fastify';
import { Aclatraz } from 'aclatraz';

const app = fastify({
  logger: true,
});

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
  return (request, reply, done) => {
    // Get the authorization header
    const { authorization } = request.headers;

    if (!authorization) {
      return reply.status(401).send('Unauthorized');
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
      return res.status(403).send({
        status: 'error',
        message: 'No permission granted for this endpoint',
      });
    }

    // There is a match, we can let the user in
    done();
  };
}

// Actual endpoint. The second parameter is our guard as a middleware using onRequest hook, where we can define the rules by their ID
app.get(
  '/guardedEndpoint',
  {
    onRequest: permissionGuard(1, 2),
  },
  (request, reply) => {
    reply.send('Nice! You have permission to see this!');
  }
);

app.listen(3000, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
```

<a name="nestjsGuard"></a>

### How to use as a NestJS guard

_Soon..._

## Interfaces

```typescript
interface AclRule {
  id: number;
  name?: string;
  slug: string;
}

interface AclConfig {
  chunkSize: number;
  encoding: number;
  padding: number;
  paddingChar: string;
}

interface AclRuleTemplate {
  [key: number]: {
    slug: string;
    name?: string;
  };
}
```

## Methods

<a name="constructor"></a>

### `constructor(aclRules?: AclRule[], options?: Partial<AclConfig>)`

Create a new Aclatraz instance.

---

<a name="addRule"></a>

### `addRule(aclRule: AclRule): void;`

Add a rule.

---

<a name="setRule"></a>

### `setRule(id: number, aclRule: Partial<AclRule>): void;`

Update a rule by its ID.

---

<a name="delRule"></a>

### `delRule(id: number): void;`

Delete a rule.

---

<a name="setOptions"></a>

### `setOptions(aclConfig: Partial<AclConfig>): void;`

Update the Aclatraz options.

---

<a name="getRules"></a>

### `getRules(): AclRule[];`

List the rules.

---

<a name="verify"></a>

### `verify(permission: string, ruleId: number): boolean;`

Check if the given permission token has access to the rule.

---

<a name="generateAclCode"></a>

### `generateAclCode(ruleIdList: number[]): string;`

Generate the permission token from the given rules.

---

<a name="generateRuleTemplate"></a>

### `generateRuleTemplate(): string;`

Soon...

---

<a name="grantpermission"></a>

### `grantPermission(currentPermission: string, ruleList: number[]): string;`

Grant permission to an existing token. You can use this to create a new one, give empty string as currentPermission.

---

<a name="revokePermission"></a>

### `revokePermission(currentPermission: string, ruleList: number[]): string;`

Revoke permission from an existing token.
