# Aclatraz

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
]);

// Add new rule on the fly
acl.addRule({
  id: 2,
  slug: 'CREATE_USER',
  name: 'Protect registration with this rule',
});

// User with this token can access id: 1 rule
const permissionToken = acl.generateAclCode([1]);

console.log(acl.verify(permissionToken, 1)); // true
console.log(acl.verify(permissionToken, 2)); // false
```

### How to use as an express middleware

_Soon..._

### How to use as a fastify middleware

_Soon..._

### How to use as a NestJS guard

_Soon..._
