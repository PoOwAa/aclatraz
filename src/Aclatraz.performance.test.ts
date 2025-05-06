import { performance } from 'perf_hooks';
import { Aclatraz } from './Aclatraz';

describe('Aclatraz performance test', () => {
  test('generate permission code for 10,000 rules', () => {
    const rules = [];
    for (let i = 1; i <= 10000; i++) {
      rules.push({ id: i, slug: `rule${i}` });
    }
    const acl = new Aclatraz(rules);

    const ruleIds = Array.from({ length: 10000 }, (_, i) => i + 1);

    const start = performance.now();
    const code = acl.generateAclCode(ruleIds);
    const end = performance.now();

    console.log(`Generated code length: ${code.length}`);
    console.log(`Time taken: ${(end - start).toFixed(2)} ms`);

    expect(typeof code).toBe('string');
  });

  test('grantPermission 100,000 times', () => {
    const rules = [];
    for (let i = 1; i <= 100; i++) {
      rules.push({ id: i, slug: `rule${i}` });
    }
    const acl = new Aclatraz(rules);
    const ruleIds = Array.from({ length: 100 }, (_, i) => i + 1);

    const start = performance.now();
    for (let i = 0; i < 100000; i++) {
      acl.grantPermission('', ruleIds);
    }
    const end = performance.now();
    console.log(
      `grantPermission 100,000 times took: ${(end - start).toFixed(2)} ms`
    );
    expect(true).toBe(true);
  });

  test('verify (decode) 100,000 times', () => {
    const rules = [];
    for (let i = 1; i <= 100; i++) {
      rules.push({ id: i, slug: `rule${i}` });
    }
    const acl = new Aclatraz(rules);
    const ruleIds = Array.from({ length: 100 }, (_, i) => i + 1);
    const permission = acl.grantPermission('', ruleIds);

    const start = performance.now();
    for (let i = 0; i < 100000; i++) {
      acl.verify(permission, 50); // Arbitrary ruleId in the middle
    }
    const end = performance.now();
    console.log(
      `verify (decode) 100,000 times took: ${(end - start).toFixed(2)} ms`
    );
    expect(true).toBe(true);
  });

  test('revokePermission 100,000 times', () => {
    const rules = [];
    for (let i = 1; i <= 100; i++) {
      rules.push({ id: i, slug: `rule${i}` });
    }
    const acl = new Aclatraz(rules);
    const ruleIds = Array.from({ length: 100 }, (_, i) => i + 1);
    const permission = acl.grantPermission('', ruleIds);

    const start = performance.now();
    for (let i = 0; i < 100000; i++) {
      acl.revokePermission(permission, [50]); // Arbitrary ruleId
    }
    const end = performance.now();
    console.log(
      `revokePermission 100,000 times took: ${(end - start).toFixed(2)} ms`
    );
    expect(true).toBe(true);
  });

  test('grantPermission with 100,000 rules', () => {
    const rules = [];
    for (let i = 1; i <= 100000; i++) {
      rules.push({ id: i, slug: `rule${i}` });
    }
    const acl = new Aclatraz(rules);
    const ruleIds = Array.from({ length: 100000 }, (_, i) => i + 1);

    const start = performance.now();
    const permission = acl.grantPermission('', ruleIds);
    const end = performance.now();
    console.log(
      `grantPermission with 100,000 rules took: ${(end - start).toFixed(
        2
      )} ms, token length: ${permission.length}`
    );
    expect(typeof permission).toBe('string');
  });

  test('verify (decode) with 100,000 rules', () => {
    const rules = [];
    for (let i = 1; i <= 100000; i++) {
      rules.push({ id: i, slug: `rule${i}` });
    }
    const acl = new Aclatraz(rules);
    const ruleIds = Array.from({ length: 100000 }, (_, i) => i + 1);
    const permission = acl.grantPermission('', ruleIds);

    const start = performance.now();
    let count = 0;
    for (let i = 1; i <= 100000; i += 10000) {
      if (acl.verify(permission, i)) count++;
    }
    const end = performance.now();
    console.log(
      `verify (decode) with 100,000 rules (checked every 10,000th): ${(
        end - start
      ).toFixed(2)} ms, found: ${count}`
    );
    expect(count).toBe(10);
  });

  test('revokePermission with 100,000 rules', () => {
    const rules = [];
    for (let i = 1; i <= 100000; i++) {
      rules.push({ id: i, slug: `rule${i}` });
    }
    const acl = new Aclatraz(rules);
    const ruleIds = Array.from({ length: 100000 }, (_, i) => i + 1);
    const permission = acl.grantPermission('', ruleIds);

    const start = performance.now();
    const revoked = acl.revokePermission(permission, [50000, 99999, 100000]);
    const end = performance.now();
    console.log(
      `revokePermission with 100,000 rules took: ${(end - start).toFixed(
        2
      )} ms, token length: ${revoked.length}`
    );
    expect(typeof revoked).toBe('string');
  });
});
