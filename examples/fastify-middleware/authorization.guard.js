import jwt from 'jsonwebtoken';
import config from './config.js';
import { acl } from './acl.js';

export function authGuard(request, reply, done) {
  const { authorization } = request.headers;

  if (!authorization) {
    return reply.status(401).send({
      status: 'error',
      message: 'Unauthorized',
    });
  }

  const [_, token] = authorization.split(' ');

  const user = jwt.verify(token, config.jwt.secret);

  if (!user) {
    return reply.status(403).send({
      status: 'error',
      message: 'Forbidden',
    });
  }

  request.user = user;

  done();
}

export function permissionGuard(...permissionList) {
  return async (request, reply, done) => {
    const { permission } = request.user;

    let verified = false;
    for (const ruleId of permissionList) {
      if (acl.verify(permission, ruleId)) {
        verified = true;
        break;
      }
    }

    if (!verified) {
      return reply.status(403).send({
        status: 'error',
        message: 'No permission for this endpoint',
      });
    }

    done();
  };
}
