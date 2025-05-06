import { AclRule } from './interface/aclRule.interface';
import { AclConfig } from './interface/aclConfig.interface';
import { ACL_PERMISSION_GRANTED, ACL_PERMISSION_DENIED } from './constants';
import { AclRuleTemplate } from './interface/aclRuleTemplate.interface';

export class Aclatraz {
  protected rules: AclRule[];

  protected defaultConfig: AclConfig = {
    chunkSize: 32,
    encoding: 16,
    padding: 8,
    paddingChar: '0',
  };

  protected options: AclConfig;

  constructor(aclRules: AclRule[] = [], options: Partial<AclConfig> = {}) {
    this.options = Object.assign(this.defaultConfig, options);
    this.rules = aclRules;
  }

  public addRule(aclRule: AclRule): void {
    const index = this.rules.findIndex(
      (rule: AclRule) => rule.id === aclRule.id
    );
    if (index > -1) {
      throw new Error(`Rule with ID [${aclRule.id}] already exists!`);
    }
    this.rules.push(aclRule);
  }

  public setRule(id: number, aclRule: Partial<AclRule>): void {
    const index = this.rules.findIndex((rule: AclRule) => rule.id === id);
    if (index > -1) {
      if (aclRule.id) {
        delete aclRule.id;
      }
      this.rules[index] = Object.assign(this.rules[index], aclRule);
    }
  }

  public delRule(id: number): void {
    const index = this.rules.findIndex((rule: AclRule) => rule.id === id);
    if (index > -1) {
      this.rules.splice(index, 1);
    }
  }

  public setOptions(aclConfig: Partial<AclConfig>): void {
    this.options = Object.assign(this.defaultConfig, this.options, aclConfig);
  }

  public getRules(): AclRule[] {
    return this.rules;
  }

  public verify(permission: string, ruleId: number): boolean {
    const binary = this.decode(permission);
    if (binary.length - ruleId < 0) {
      return false;
    }
    return binary[binary.length - ruleId] === '1';
  }

  public generateAclCode(ruleIdList: number[]): string {
    return this.grantPermission('', ruleIdList);
  }

  public generateRuleTemplate(): string {
    const res: AclRuleTemplate = {};
    for (const rule of this.rules) {
      res[rule.id] = {
        slug: rule.slug,
      };
      if (rule.name) {
        res[rule.id].name = rule.name;
      }
    }

    return JSON.stringify(res);
  }

  public grantPermission(
    currentPermission: string,
    ruleList: number[]
  ): string {
    let aclNumber = BigInt(`0b${this.decode(currentPermission)}`);
    const maxAclIndex = this.getMaxAclId();

    for (const ruleId of ruleList) {
      if (ruleId > maxAclIndex) {
        continue;
      }

      const index = this.rules.findIndex((rule: AclRule) => rule.id === ruleId);
      if (index < 0) {
        continue;
      }

      aclNumber |= 1n << BigInt(ruleId - 1);
    }

    return this.encode(aclNumber.toString(2), this.options.chunkSize);
  }

  public revokePermission(
    currentPermission: string,
    ruleList: number[]
  ): string {
    let aclNumber = BigInt(`0b${this.decode(currentPermission)}`);

    for (const ruleId of ruleList) {
      if (ruleId > this.getMaxAclId()) {
        continue;
      }

      const index = this.rules.findIndex((rule: AclRule) => rule.id === ruleId);
      if (index < 0) {
        continue;
      }

      aclNumber &= ~(1n << BigInt(ruleId - 1));
    }

    return this.encode(aclNumber.toString(2), this.options.chunkSize);
  }

  /**
   * Split the binary into chunkSize pieces then convert
   * the chunks to hex codes. Finally join them with a
   * separator
   */
  protected encode(aclBinary: string, chunkSize: number): string {
    const aclNumber = BigInt(`0b${aclBinary || '0'}`);
    if (aclNumber === 0n) {
      // Return a single chunk of zeros with the correct padding
      return '0'.repeat(this.options.padding);
    }
    const chunks: string[] = [];
    let mask = (1n << BigInt(chunkSize)) - 1n;
    let current = aclNumber;
    while (current > 0n) {
      const chunk = current & mask;
      chunks.push(
        chunk
          .toString(this.options.encoding)
          .padStart(this.options.padding, this.options.paddingChar)
      );
      current >>= BigInt(chunkSize);
    }
    return chunks.reverse().join('-');
  }

  protected decode(permission: string): string {
    if (!permission || permission.length < 1) {
      return '0'.padStart(this.options.padding, this.options.paddingChar);
    }

    const chunks = permission.split('-');
    let aclNumber = 0n;

    for (const chunk of chunks) {
      aclNumber =
        (aclNumber << BigInt(this.options.chunkSize)) |
        BigInt(BigInt(`0x${chunk}`));
    }

    return aclNumber
      .toString(2)
      .padStart(
        this.options.chunkSize * chunks.length,
        this.options.paddingChar
      );
  }

  protected getMaxAclId(): number {
    let max = 0;
    for (const permission of this.rules) {
      if (permission.id > max) {
        max = permission.id;
      }
    }

    return max;
  }
}
