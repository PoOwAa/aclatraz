import { ACL_PERMISSION_GRANTED, ACL_PERMISSION_DENIED } from './constants';

describe('Check ACL constants', () => {
  test('Permission granted bit should be 1', () => {
    expect(ACL_PERMISSION_GRANTED).toBe(1);
  });

  test('Permission denied bit should be 0', () => {
    expect(ACL_PERMISSION_DENIED).toBe(0);
  });
});
