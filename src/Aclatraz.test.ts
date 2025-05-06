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

  test('setOptions throws on too large chunkSize', () => {
    const acl = new Aclatraz([{ id: 1, slug: 'test' }]);
    expect(() => acl.setOptions({ chunkSize: 129 })).toThrow(
      'chunkSize too large: must be <= 128'
    );
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

  test('verify handles empty, null, and undefined permission', () => {
    const acl = new Aclatraz([{ id: 1, slug: 'test' }]);
    expect(acl.verify('', 1)).toBe(false);
    expect(acl.verify(null as any, 1)).toBe(false);
    expect(acl.verify(undefined as any, 1)).toBe(false);
  });

  test('generate Aclatraz permission code', () => {
    acl.addRule({ id: 6, slug: 'sixth' });
    acl.addRule({ id: 3, slug: 'another' });

    const permission = acl.generateAclCode([1, 3, 6]); // 0b100101 --> 0x25

    expect(permission).toBe('00000025');
  });

  test('generate Aclatraz permission code (big ids)', () => {
    acl.addRule({ id: 111, slug: 'a' });
    acl.addRule({ id: 212, slug: 'b' });

    let permissionToken = acl.generateAclCode([212]);
    expect(permissionToken).toBe(
      '00080000-00000000-00000000-00000000-00000000-00000000-00000000'
    );

    permissionToken = acl.grantPermission(permissionToken, [111]);
    expect(permissionToken).toBe(
      '00080000-00000000-00000000-00004000-00000000-00000000-00000000'
    );

    permissionToken = acl.grantPermission(permissionToken, [1]);
    expect(permissionToken).toBe(
      '00080000-00000000-00000000-00004000-00000000-00000000-00000001'
    );
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

    const permission = acl.generateAclCode([1, 3, 6, 100, 4]); // 0b100101 --> 0x25

    expect(permission).toBe('00000025');
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
    expect(newPermission).toBe('00000025');
  });

  test('should skip wrong ID at granting permission', () => {
    let newPermission = acl.grantPermission('', [1, 3, 6]);
    expect(newPermission).toBe('00000001');

    acl.addRule({ id: 3, slug: 'another' });
    acl.addRule({ id: 6, slug: 'sixth' });

    newPermission = acl.grantPermission(newPermission, [1, 3, 6, 100, 4]);
    expect(newPermission).toBe('00000025');
  });

  test('should revoke permission', () => {
    let newPermission = acl.revokePermission('00000001', [1]);
    acl.addRule({ id: 3, slug: 'another' });
    acl.addRule({ id: 6, slug: 'sixth' });
    expect(newPermission).toBe('00000000');

    newPermission = acl.grantPermission('', [1, 3, 6]);
    expect(newPermission).toBe('00000025');
    newPermission = acl.revokePermission(newPermission, [1]);
    expect(newPermission).toBe('00000024');
    newPermission = acl.revokePermission(newPermission, [3]);
    expect(newPermission).toBe('00000020');
  });

  test('should skip wrong ID at revoking permission', () => {
    acl.addRule({ id: 3, slug: 'another' });
    acl.addRule({ id: 6, slug: 'sixth' });
    let newPermission = acl.grantPermission('', [1, 3, 6]);

    newPermission = acl.revokePermission(newPermission, [1, 100, 4]);
    expect(newPermission).toBe('00000024');
  });

  test('random ruleset encode/decode integration', () => {
    const ruleIds = [
      1, 3, 6, 18, 19, 22, 25, 34, 67, 77, 82, 96, 97, 98, 99, 128, 156, 213,
    ];
    const testAcl = new Aclatraz();
    for (const rule of ruleIds) {
      testAcl.addRule({ id: rule, slug: `test-${rule}` });
    }
    const permission = testAcl.generateAclCode(ruleIds);
    // Verify the permission string is not empty
    expect(permission.length).toBeGreaterThan(0);

    // Verify each rule ID is correctly set in the permission
    for (const ruleId of ruleIds) {
      expect(testAcl.verify(permission, ruleId)).toBe(true);
    }

    // Verify a non-existent rule is not in the permission
    expect(testAcl.verify(permission, 999)).toBe(false);
  });
});

describe('Aclatraz edge case and coverage tests', () => {
  test('constructor throws on too large chunkSize', () => {
    expect(() => new Aclatraz([], { chunkSize: 129 })).toThrow(
      'chunkSize too large: must be <= 128'
    );
  });

  test('decode supports non-hex encoding', () => {
    const acl = new Aclatraz([{ id: 1, slug: 'test' }], { encoding: 8 });
    // encoding: 8, so permission string is in octal
    // 1 in binary is '1', in octal is '1'
    const permission = acl.grantPermission('', [1]);
    // Should decode correctly
    expect(acl.verify(permission, 1)).toBe(true);
  });

  test('decode non-hex encoding with multi-digit octal', () => {
    const acl = new Aclatraz([{ id: 4, slug: 'test' }], { encoding: 8 });
    // 8 in decimal is '10' in octal, so decode('10') should be padded binary for 8
    expect((acl as any).decode('10')).toBe('00000000000000000000000000001000');
  });

  test('decode non-hex encoding triggers parseInt branch', () => {
    const acl = new Aclatraz([{ id: 8, slug: 'test' }], { encoding: 8 });
    // '20' in octal is 16 in decimal, which is padded binary for 16
    expect((acl as any).decode('20')).toBe('00000000000000000000000000010000');
  });

  test('decode non-hex encoding with multiple octal chunks', () => {
    const acl = new Aclatraz([{ id: 64, slug: 'test' }], {
      encoding: 8,
      chunkSize: 4,
      padding: 2,
    });
    // '10' in octal is 8 in decimal, so '10-10' should be (8 << 4) | 8 = 136, which is '10001000' in binary
    // With chunkSize 4 and 2 chunks, pad to 8 bits: '10001000'
    expect((acl as any).decode('10-10')).toBe('10001000');
  });

  test('grantPermission and revokePermission handle empty, null, and undefined permission', () => {
    const acl = new Aclatraz([{ id: 1, slug: 'test' }]);
    expect(acl.grantPermission('', [1])).toBe('00000001');
    expect(acl.grantPermission(null as any, [1])).toBe('00000001');
    expect(acl.grantPermission(undefined as any, [1])).toBe('00000001');
    expect(acl.revokePermission('', [1])).toBe('00000000');
    expect(acl.revokePermission(null as any, [1])).toBe('00000000');
    expect(acl.revokePermission(undefined as any, [1])).toBe('00000000');
  });

  test('grantPermission produces multi-chunk encoded permission', () => {
    const acl = new Aclatraz(
      [
        { id: 1, slug: 'a' },
        { id: 2, slug: 'b' },
        { id: 3, slug: 'c' },
        { id: 4, slug: 'd' },
        { id: 5, slug: 'e' },
        { id: 6, slug: 'f' },
        { id: 7, slug: 'g' },
        { id: 8, slug: 'h' },
      ],
      { chunkSize: 4, padding: 2, encoding: 16 }
    );
    // Grant all permissions, which will set bits 1-8 (0b11111111 = 0xFF)
    const permission = acl.grantPermission('', [1, 2, 3, 4, 5, 6, 7, 8]);
    // 0xFF with chunkSize 4: [0xF, 0xF] => '0F-0F'
    expect(permission).toBe('0F-0F');
  });

  test('encode method multi-chunk coverage via direct call', () => {
    const acl = new Aclatraz([{ id: 1, slug: 'test' }], {
      encoding: 16,
      chunkSize: 4,
      padding: 2,
    });
    // 0x1234 in binary is 0001 0010 0011 0100, with chunkSize 4: [1,2,3,4] => [0x1,0x2,0x3,0x4]
    // Should produce four chunks: '01-02-03-04'
    const result = (acl as any).encode('1001000110100', 4); // binary for 0x1234
    expect(result).toBe('01-02-03-04');
  });

  test('encode method single-chunk coverage via direct call', () => {
    const acl = new Aclatraz([{ id: 1, slug: 'test' }], {
      encoding: 16,
      chunkSize: 4,
      padding: 2,
    });
    // 0xA in binary is 1010, with chunkSize 4: [0xA]
    // Should produce one chunk: '0A'
    const result = (acl as any).encode('1010', 4); // binary for 0xA
    expect(result).toBe('0A');
  });

  test('encode returns zero padding for aclNumber 0', () => {
    const acl = new Aclatraz([{ id: 1, slug: 'test' }], {
      encoding: 16,
      chunkSize: 4,
      padding: 2,
    });
    expect((acl as any).encode('', 4)).toBe('00');
    expect((acl as any).encode('0', 4)).toBe('00');
  });
});

describe('Aclatraz additional coverage for encodeFromBigInt and decodeToBigInt', () => {
  test('encodeFromBigInt returns correct zero padding', () => {
    const acl = new Aclatraz([{ id: 1, slug: 'test' }]);
    expect((acl as any).encodeFromBigInt(0n)).toBe('00000000');
  });

  test('decodeToBigInt returns 0 for empty string', () => {
    const acl = new Aclatraz([{ id: 1, slug: 'test' }]);
    expect((acl as any).decodeToBigInt('')).toBe(0n);
  });

  test('decodeToBigInt returns 0 for empty or falsy permission', () => {
    const acl = new Aclatraz([{ id: 1, slug: 'test' }]);
    expect((acl as any).decodeToBigInt('')).toBe(0n);
    expect((acl as any).decodeToBigInt(null as any)).toBe(0n);
    expect((acl as any).decodeToBigInt(undefined as any)).toBe(0n);
  });

  test('decodeToBigInt with non-hex encoding', () => {
    const acl = new Aclatraz([{ id: 1, slug: 'test' }], { encoding: 8 });
    expect((acl as any).decodeToBigInt('7')).toBe(7n);
  });

  test('encodeFromBigInt with non-hex encoding', () => {
    const acl = new Aclatraz([{ id: 1, slug: 'test' }], { encoding: 8 });
    expect((acl as any).encodeFromBigInt(7n)).toBe('00000007');
  });

  test('encodeFromBigInt returns multi-chunk string', () => {
    const acl = new Aclatraz([{ id: 1, slug: 'test' }], {
      encoding: 16,
      chunkSize: 4,
      padding: 2,
    });
    // 0xAB in binary is 10101011, with chunkSize 4: [1010, 1011] => [0xA, 0xB]
    // Should produce two chunks: '0A-0B'
    expect((acl as any).encodeFromBigInt(0xabn)).toBe('0A-0B');
  });
});
