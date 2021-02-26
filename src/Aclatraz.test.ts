import { Aclatraz } from './Aclatraz';

describe('ACL class test', () => {
  test('Create ACL instance without parameter', () => {
    const acl = new Aclatraz();

    expect(acl).toBeInstanceOf(Aclatraz);
  });

  test('Create ACL without config', () => {
    const acl = new Aclatraz([{ id: 1, slug: 'testRule' }]);

    expect(acl).toBeInstanceOf(Aclatraz);
  });

  test('Create ACL with custom config', () => {
    const acl = new Aclatraz([{ id: 1, slug: 'testRule' }], { chunkSize: 16 });

    expect(acl).toBeInstanceOf(Aclatraz);
  });
});

describe('Aclatraz method tests', () => {
  let acl: Aclatraz;
  beforeEach(() => {
    acl = new Aclatraz([{ id: 1, slug: 'testRule' }]);
  });

  test('Get rules', () => {
    const rules = acl.getRules();
    expect(rules).toHaveLength(1);
    expect(rules[0]).toHaveProperty('id');
    expect(rules[0].id).toBe(1);
    expect(rules[0].slug).toBe('testRule');
  });

  test('Add rule', () => {
    acl.addRule({ id: 2, slug: 'secondRule' });
    const rules = acl.getRules();

    expect(rules).toHaveLength(2);
    expect(rules[1]).toHaveProperty('id');
    expect(rules[1]).toHaveProperty('slug');
    expect(rules[1].id).toBe(2);
    expect(rules[1].slug).toBe('secondRule');
  });

  test('Should throw error when adding duplicated ID', () => {
    expect(() => {
      acl.addRule({ id: 1, slug: 'secondRule' });
    }).toThrow();
  });

  test('Update a rule by ID', () => {
    acl.setRule(1, { name: 'Test Name' });
    const rules = acl.getRules();
    expect(rules).toHaveLength(1);
    expect(rules[0]).toHaveProperty('id');
    expect(rules[0]).toHaveProperty('slug');
    expect(rules[0]).toHaveProperty('name');
    expect(rules[0].name).toBe('Test Name');
  });

  test('should not update a not existing rule', () => {
    acl.setRule(2, { name: 'Not exists' });
    const rules = acl.getRules();
    expect(rules).toHaveLength(1);
  });

  test('Try to set new ID', () => {
    acl.setRule(1, { id: 2, name: 'Test Name' });
    const rules = acl.getRules();
    expect(rules).toHaveLength(1);
    expect(rules[0]).toHaveProperty('id');
    expect(rules[0].id).toBe(1);
  });

  test('Delete a rule by ID', () => {
    acl.delRule(1);

    const rules = acl.getRules();
    expect(rules).toHaveLength(0);
  });

  test('Should not delete not existing ID', () => {
    acl.delRule(12531);
    const rules = acl.getRules();
    expect(rules).toHaveLength(1);
  });

  test('change config', () => {
    const spy = jest.spyOn(acl, 'setOptions');
    acl.setOptions({ chunkSize: 16 });
    expect(spy).toHaveBeenCalled();
  });

  test('verify the user permission for given rule', () => {
    expect(acl.verify('00000001', 1)).toBe(true); // Permission with padding
    expect(acl.verify('11111111', 1)).toBe(true); // Superuser
    expect(acl.verify('1', 1)).toBe(true); // Permission without padding
    expect(acl.verify('0004', 3)).toBe(true); // Permission madness
    expect(acl.verify('00000000', 1)).toBe(false); // No permission with padding
    expect(acl.verify('0', 1)).toBe(false); // No permission
    expect(acl.verify('0000', 1)).toBe(false); // No permission
    expect(acl.verify('0010', 1)).toBe(false); // No permission
    expect(acl.verify('0004', 2)).toBe(false); // No permission
    expect(acl.verify('1', 15312)).toBe(false); // Too big ruleId
  });

  test('generate Aclatraz permission code', () => {
    acl.addRule({ id: 6, slug: 'sixth' });
    acl.addRule({ id: 3, slug: 'another' });

    const permission = acl.generateAclCode([1, 3, 6]);

    expect(permission).toBe('00000007');
  });

  test('generate empty permission code', () => {
    expect(acl.generateAclCode([])).toBe('00000000');
    expect(acl.generateAclCode([1])).toBe('00000001');
  });

  test('grant empty permission', () => {
    expect(acl.grantPermission('', [])).toBe('00000000');
    expect(acl.grantPermission('', [1])).toBe('00000001');
  });

  test('should be skipped wrong ruleId at generation', () => {
    acl.addRule({ id: 3, slug: 'another' });
    acl.addRule({ id: 6, slug: 'sixth' });

    const permission = acl.generateAclCode([1, 3, 6, 100, 4]);

    expect(permission).toBe('00000007');
  });

  test('should generate a rule template JSON', () => {
    acl.addRule({ id: 2, slug: 'secondRule', name: 'Second Rule' });
    const template = acl.generateRuleTemplate();
    expect(typeof template).toBe('string');
    expect(template).toBe(
      '{"1":{"slug":"testRule"},"2":{"slug":"secondRule","name":"Second Rule"}}'
    );
  });

  test('should grant permission', () => {
    let newPermission = acl.grantPermission('00000000', [1]);
    expect(newPermission).toBe('00000001');
    acl.addRule({ id: 2, slug: 'another' });
    acl.addRule({ id: 3, slug: 'another' });
    acl.addRule({ id: 4, slug: 'another' });
    acl.addRule({ id: 5, slug: 'another' });
    acl.addRule({ id: 6, slug: 'sixth' });
    newPermission = acl.grantPermission(newPermission, [3, 6]);
    expect(newPermission).toBe('00000025');
  });

  test('should grant permission when not rules are not autoincremented', () => {
    acl.addRule({ id: 3, slug: 'another' });
    acl.addRule({ id: 6, slug: 'sixth' });
    const newPermission = acl.grantPermission('', [1, 3, 6]);
    expect(newPermission).toBe('00000007');
  });

  test('should skip wrong ID at granting permission', () => {
    let newPermission = acl.grantPermission('', [1, 3, 6]);
    expect(newPermission).toBe('00000001');

    acl.addRule({ id: 3, slug: 'another' });
    acl.addRule({ id: 6, slug: 'sixth' });

    newPermission = acl.grantPermission(newPermission, [1, 3, 6, 100, 4]);
    expect(newPermission).toBe('00000007');
  });

  test('should revoke permission', () => {
    let newPermission = acl.revokePermission('00000001', [1]);
    acl.addRule({ id: 3, slug: 'another' });
    acl.addRule({ id: 6, slug: 'sixth' });
    expect(newPermission).toBe('00000000');

    newPermission = acl.grantPermission('', [1, 3, 6]);
    expect(newPermission).toBe('00000007');
    newPermission = acl.revokePermission(newPermission, [1]);
    expect(newPermission).toBe('00000006');
    newPermission = acl.revokePermission(newPermission, [3]);
    expect(newPermission).toBe('00000004');
  });

  test('should skip wrong ID at revoking permission', () => {
    acl.addRule({ id: 3, slug: 'another' });
    acl.addRule({ id: 6, slug: 'sixth' });
    let newPermission = acl.grantPermission('', [1, 3, 6]);

    newPermission = acl.revokePermission(newPermission, [1, 100, 4]);
    expect(newPermission).toBe('00000006');
  });
});
