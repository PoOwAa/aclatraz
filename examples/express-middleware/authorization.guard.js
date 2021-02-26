import jwt from 'jsonwebtoken';
import config from './config.js';
import acl from './acl.js';

export function authGuard(req, res, next) {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).send({
      status: 'error',
      message: 'Unauthorized',
    });
  }

  const [_, token] = authorization.split(' ');

  const user = jwt.verify(token, config.jwt.secret);

  if (!user) {
    return res.status(403).send({
      status: 'error',
      message: 'Forbidden',
    });
  }

  req.user = user;
  console.log(req.user);
  next();
}

export function permissionGuard(...permissionList) {
  return (req, res, next) => {
    const { permission } = req.user;

    let verified = false;
    for (const ruleId of permissionList) {
      if (acl.verify(permission, ruleId)) {
        verified = true;
        break;
      }
    }

    if (!verified) {
      return res.status(403).send({
        status: 'error',
        message: 'No permission for this endpoint',
      });
    }

    next();
  };
}
