import { Aclatraz } from 'aclatraz';

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
