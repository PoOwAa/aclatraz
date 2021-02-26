import fastify from 'fastify';
import mockUsers from './mockUsers.js';
import config from './config.js';
import jwt from 'jsonwebtoken';
import { acl } from './acl.js';
import { Permission } from './permission.enum.js';
import { permissionGuard, authGuard } from './authorization.guard.js';

const app = fastify({
  logger: true,
});

app.get('/', (request, reply) => {
  reply.send({
    message: 'Example app for Aclatraz fastify-middleware is working!',
  });
});

app.post('/login', (request, reply) => {
  const { username } = request.body;

  if (!username) {
    return reply.status(400).send({
      status: 'error',
      message: 'No username provided!',
    });
  }

  const user = mockUsers.findByUsername(username);

  if (!user) {
    return reply.status(404).send({
      status: 'error',
      message: 'Invalid username!',
    });
  }

  const accessToken = jwt.sign(user, config.jwt.secret);

  reply.send({
    message: 'Successful login!',
    accessToken,
  });
});

app.get(
  '/user',
  {
    onRequest: [
      authGuard,
      permissionGuard(Permission.ADMIN, Permission.READ_OTHER_USERS),
    ],
  },
  (request, reply) => {
    reply.send(mockUsers.getUserList());
  }
);

app.get(
  '/user/me',
  {
    onRequest: authGuard,
  },
  (request, reply) => {
    const id = request.user.id;
    const me = mockUsers.findById(id);

    if (!me) {
      return reply.status(404).send({
        status: 'error',
        message: 'You are not found. How the hell did you log in?',
      });
    }

    reply.send(me);
  }
);

app.get(
  '/user/:id',
  {
    onRequest: [
      authGuard,
      permissionGuard(Permission.ADMIN, Permission.READ_OTHER_USERS),
    ],
  },
  (request, reply) => {
    const id = parseInt(request.params.id, 10);

    if (!id) {
      return reply
        .status(400)
        .send({ status: 'error', message: 'No valid id provided!' });
    }

    const user = mockUsers.findById(id);

    if (!user) {
      return reply
        .status(404)
        .send({ status: 'error', message: 'User not found!' });
    }

    reply.send(user);
  }
);

app.post(
  '/admin/user/:id/permission/add',
  {
    onRequest: [authGuard, permissionGuard(Permission.ADMIN)],
  },
  (request, reply) => {
    const id = parseInt(request.params.id, 10);

    if (!id) {
      return reply
        .status(400)
        .send({ status: 'error', message: 'Invalid user id!' });
    }

    const user = mockUsers.findById(id);

    if (!user) {
      return reply
        .status(404)
        .send({ status: 'error', message: 'User not found!' });
    }

    const { permissionList } = request.body;

    if (!permissionList) {
      return reply
        .status(400)
        .send({ status: 'error', message: 'Permission list is not provided!' });
    }

    const permissionToken = acl.grantPermission(
      user.permission,
      permissionList
    );

    mockUsers.setPermission(id, permissionToken);

    reply.send({
      message: `New permissions are set to user [${id}]`,
      permissionToken,
    });
  }
);

app.post(
  '/admin/user/:id/permission/revoke',
  {
    onRequest: [authGuard, permissionGuard(Permission.ADMIN)],
  },
  (request, reply) => {
    const id = parseInt(request.params.id, 10);

    if (!id) {
      return reply
        .status(400)
        .send({ status: 'error', message: 'Invalid user id!' });
    }

    const user = mockUsers.findById(id);

    if (!user) {
      return reply
        .status(404)
        .send({ status: 'error', message: 'User not found!' });
    }

    const { permissionList } = request.body;

    if (!permissionList) {
      return reply
        .status(400)
        .send({ status: 'error', message: 'Permission list is not provided!' });
    }

    const permissionToken = acl.revokePermission(
      user.permission,
      permissionList
    );

    mockUsers.setPermission(id, permissionToken);

    reply.send({
      message: `New permissions are set to user [${id}]`,
      permissionToken,
    });
  }
);

app.listen(3000, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
