import { AclRule } from './interface/aclRule.interface';
import { AclConfig } from './interface/aclConfig.interface';
import { ACL_PERMISSION_GRANTED } from './constants';
import { AclRuleTemplate } from './interface/aclRuleTemplate.interface';

export class Aclatraz {
  protected rules: AclRule[] = [
    {
      id: 1,
      name: 'Login',
      slug: 'login',
    },
    {
      id: 2,
      name: 'Billing',
      slug: 'billing',
    },
    {
      id: 16,
      name: 'test',
      slug: 'test',
    },
    {
      id: 1000,
      name: 'test2',
      slug: 'test2',
    },
  ];

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
    const maxAclIndex: number = this.getMaxAclId();
    const binary: number[] = new Array(maxAclIndex).fill(0);

    for (const ruleId of ruleIdList) {
      if (ruleId > maxAclIndex) {
        // console.debug(`Invalid ruleId: [${ruleId}]. Skipping...`);
        continue;
      }
      const index = this.rules.findIndex((rule: AclRule) => rule.id === ruleId);
      if (index < 0) {
        // console.debug(`Invalid ruleId: [${ruleId}]. Skipping...`);
        continue;
      }
      binary[binary.length - ruleId] |= ACL_PERMISSION_GRANTED;
    }

    return this.encode(binary.join(''), this.options.chunkSize);
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

  /**
   * Split the binary into chunkSize pieces then convert
   * the chunks to hex codes. Finally join them with a
   * separator
   */
  protected encode(aclBinary: string, chunkSize: number): string {
    const aclArr = aclBinary.split('').map((b) => +b);

    const chunks: string[] = [];
    while (aclArr.length) {
      const chunk = aclArr.splice(chunkSize * -1).join('');
      chunks.push(
        parseInt(chunk, 2)
          .toString(this.options.encoding)
          .padStart(this.options.padding, this.options.paddingChar)
      );
    }

    return chunks.reverse().join('-');
  }

  protected decode(permission: string): string {
    const chunks = permission.split('-');

    let res = '';
    for (const chunk of chunks) {
      res += parseInt(chunk, this.options.encoding)
        .toString(2)
        .padStart(this.options.padding, this.options.paddingChar);
    }

    return res;
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
