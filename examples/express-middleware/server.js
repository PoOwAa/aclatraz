import express from 'express';
import bodyParser from 'body-parser';
import MockUser from './mockUsers.js';
import jwt from 'jsonwebtoken';
import config from './config.js';
import acl from './acl.js';
import { authGuard, permissionGuard } from './authorization.guard.js';
import { Permission } from './permission.enum.js';

const PORT = 3000;
const app = express();

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send({
    message: 'Example app for Aclatraz express-middleware is working!',
  });
});

app.post('/login', (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).send({
      status: 'error',
      message: 'No username provided!',
    });
  }

  const user = MockUser.findByUsername(username);

  if (!user) {
    return res.status(404).send({
      status: 'error',
      message: 'Invalid username!',
    });
  }

  const accessToken = jwt.sign(user, config.jwt.secret);

  res.send({
    message: 'Successful login!',
    accessToken,
  });
});

app.get(
  '/user',
  [authGuard, permissionGuard(Permission.ADMIN, Permission.READ_OTHER_USERS)],
  (req, res) => {
    res.send(MockUser.getUserList());
  }
);

app.get('/user/me', authGuard, (req, res) => {
  const id = req.user.id;
  const me = MockUser.findById(id);

  if (!me) {
    return res.status(404).send({
      status: 'error',
      message: `You are not found. How the hell did you log in?`,
    });
  }

  res.send(me);
});

app.get('/user/:id', authGuard, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) {
    return res
      .status(400)
      .send({ status: 'error', message: 'No valid id provided!' });
  }
  const user = MockUser.findById(id);

  if (!user) {
    return res
      .status(404)
      .send({ status: 'error', message: 'User not found!' });
  }

  res.send(user);
});

app.post(
  '/admin/user/:id/permission/add',
  authGuard,
  permissionGuard(Permission.ADMIN),
  (req, res) => {
    const id = parseInt(req.params.id, 10);

    if (!id) {
      return res
        .status(400)
        .send({ status: 'error', message: `Invalid user id!` });
    }

    const user = MockUser.findById(id);

    if (!user) {
      return res
        .status(404)
        .send({ status: 'error', message: `User not found!` });
    }

    const { permissionList } = req.body;

    if (!permissionList) {
      return res
        .status(400)
        .send({ status: 'error', message: `Permission list is not provided!` });
    }

    const permissionToken = acl.generateAclCode(permissionList);

    MockUser.setPermission(id, permissionToken);

    res.send({
      message: `New permissions are set to [${id}]`,
      permissionToken,
    });
  }
);

app.post(
  '/admin/user/:id/permission/revoke',
  [authGuard, permissionGuard(Permission.ADMIN)],
  (req, res) => {
    const id = parseInt(req.params.id, 10);

    if (!id) {
      return res
        .status(400)
        .send({ status: 'error', message: 'Invalid user id!' });
    }

    const user = MockUser.findById(id);

    if (!user) {
      return res
        .status(404)
        .send({ status: 'error', message: 'User not found' });
    }

    const { permissionList } = req.body;

    if (!permissionList) {
      return res
        .status(400)
        .send({ status: 'error', message: 'Permission list is not provided!' });
    }

    const permissionToken = acl.revokePermission(
      user.permission,
      permissionList
    );

    MockUser.setPermission(id, permissionToken);

    res.send({
      message: `New permissions are set to [${id}]`,
      permissionToken,
    });
  }
);

app.listen(PORT, () => {
  console.log('app is listening...');
});
