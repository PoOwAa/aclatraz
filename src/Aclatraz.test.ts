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

  test('Get rules', () => {
    const acl = new Aclatraz([{ id: 1, slug: 'testRule' }]);

    const rules = acl.getRules();
    expect(rules).toHaveLength(1);
    expect(rules[0]).toHaveProperty('id');
    expect(rules[0].id).toBe(1);
    expect(rules[0].slug).toBe('testRule');
  });

  test('Add rule', () => {
    const acl = new Aclatraz([{ id: 1, slug: 'testRule' }]);

    acl.addRule({ id: 2, slug: 'secondRule' });
    const rules = acl.getRules();

    expect(rules).toHaveLength(2);
    expect(rules[1]).toHaveProperty('id');
    expect(rules[1]).toHaveProperty('slug');
    expect(rules[1].id).toBe(2);
    expect(rules[1].slug).toBe('secondRule');
  });

  test('Should throw error when adding duplicated ID', () => {
    const acl = new Aclatraz([{ id: 1, slug: 'testRule' }]);

    expect(() => {
      acl.addRule({ id: 1, slug: 'secondRule' });
    }).toThrow();
  });

  test('Update a rule by ID', () => {
    const acl = new Aclatraz([{ id: 1, slug: 'testRule' }]);

    acl.setRule(1, { name: 'Test Name' });
    const rules = acl.getRules();
    expect(rules).toHaveLength(1);
    expect(rules[0]).toHaveProperty('id');
    expect(rules[0]).toHaveProperty('slug');
    expect(rules[0]).toHaveProperty('name');
    expect(rules[0].name).toBe('Test Name');
  });

  test('should not update a not existing rule', () => {
    const acl = new Aclatraz([{ id: 1, slug: 'testRule' }]);

    acl.setRule(2, { name: 'Not exists' });
    const rules = acl.getRules();
    expect(rules).toHaveLength(1);
  });

  test('Try to set new ID', () => {
    const acl = new Aclatraz([{ id: 1, slug: 'testRule' }]);

    acl.setRule(1, { id: 2, name: 'Test Name' });
    const rules = acl.getRules();
    expect(rules).toHaveLength(1);
    expect(rules[0]).toHaveProperty('id');
    expect(rules[0].id).toBe(1);
  });

  test('Delete a rule by ID', () => {
    const acl = new Aclatraz([{ id: 1, slug: 'testRule' }]);

    acl.delRule(1);

    const rules = acl.getRules();
    expect(rules).toHaveLength(0);
  });

  test('Should not delete not existing ID', () => {
    const acl = new Aclatraz([{ id: 1, slug: 'testRule' }]);

    acl.delRule(12531);
    const rules = acl.getRules();
    expect(rules).toHaveLength(1);
  });

  test('change config', () => {
    const acl = new Aclatraz();

    const spy = jest.spyOn(acl, 'setOptions');
    acl.setOptions({ chunkSize: 16 });
    expect(spy).toHaveBeenCalled();
  });

  test('verify the user permission for given rule', () => {
    const acl = new Aclatraz([{ id: 1, slug: 'testRule' }]);

    expect(acl.verify('00000001', 1)).toBe(true); // Permission with padding
    expect(acl.verify('11111111', 1)).toBe(true); // Superuser
    expect(acl.verify('1', 1)).toBe(true); // Permission without padding
    expect(acl.verify('00000000', 1)).toBe(false); // No permission with padding
    expect(acl.verify('0', 1)).toBe(false); // No permission
    expect(acl.verify('0000', 1)).toBe(false); // No permission
    expect(acl.verify('1', 15312)).toBe(false); // Too big ruleId
  });

  test('generate Aclatraz permission code', () => {
    const acl = new Aclatraz([{ id: 1, slug: 'testRule' }]);

    acl.addRule({ id: 6, slug: 'sixth' });
    acl.addRule({ id: 3, slug: 'another' });

    const permission = acl.generateAclCode([1, 3, 6]);

    expect(permission).toBe('00000025');
  });

  test('should be skipped wrong ruleId at generation', () => {
    const acl = new Aclatraz([{ id: 1, slug: 'testRule' }]);

    acl.addRule({ id: 3, slug: 'another' });
    acl.addRule({ id: 6, slug: 'sixth' });

    const permission = acl.generateAclCode([1, 3, 6, 100, 4]);

    expect(permission).toBe('00000025');
  });

  test('should generate a rule template JSON', () => {
    const acl = new Aclatraz([{ id: 1, slug: 'testRule' }]);

    acl.addRule({ id: 2, slug: 'secondRule', name: 'Second Rule' });
    const template = acl.generateRuleTemplate();
    expect(typeof template).toBe('string');
    expect(template).toBe(
      '{"1":{"slug":"testRule"},"2":{"slug":"secondRule","name":"Second Rule"}}'
    );
  });
});
