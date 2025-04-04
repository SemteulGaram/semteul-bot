import { Logger } from './logger';
import { AclListType, PermissionCheckResult } from './types/acl';
import { 
  KyuSqlite3Database,
} from './database/base';
import { ACLListEntity, ACLListTable, CommandACLEntity, CommandACLTable, UserRoleTable } from './database/acl';
import { SimpleCache } from './utils/simple-cache';
import { ReplyableError } from './utils/replyable-error';
import { KyushBot } from './kyushbot';

const CACHE_SIZE = 1024;

const log = new Logger({
  parentHierarchy: ['acl'],
});

/**
 * ACL Service for managing command permissions
 */
export class ACLService {
  private commandACLTable: CommandACLTable;
  private aclListTable: ACLListTable;
  private userRoleTable: UserRoleTable;
  private cachedCommandACLs: Map<string, CommandACLEntity> = new Map();
  private cachedACLs: SimpleCache<string, ACLListEntity> = new SimpleCache<string, ACLListEntity>(CACHE_SIZE);
  private cachedRoles: SimpleCache<string, string[]> = new SimpleCache<string, string[]>(CACHE_SIZE);
  private adminId: string | undefined;
  private registeredCommands: Set<string> = new Set();

  constructor(private ctx: KyushBot, db: KyuSqlite3Database) {
    log.i('Initializing ACLService');
    this.adminId = process.env.ADMIN_ID;
    this.commandACLTable = CommandACLTable.open(db);
    this.aclListTable = ACLListTable.open(db);
    this.userRoleTable = UserRoleTable.open(db);
    this.loadCommandData();
  }

  private generateCacheKey(command: string, listType: AclListType, value: string): string {
    return `${command}-${listType}-${value}`;
  }

  private loadCommandData(): void {
    try {
      this.cachedCommandACLs.clear();
      const commandACLs = this.commandACLTable.getAll();
      for (const aclEntity of commandACLs) {
        this.cachedCommandACLs.set(aclEntity.command, aclEntity);
      }

      log.i(`Loaded ${this.cachedCommandACLs.size} command ACLs`);
    } catch (err) {
      log.e('Error loading ACL data:', err);
    }
  }

  private getAclEntity(command: string, listType: AclListType, value: string): ACLListEntity | undefined {
    // Generate cache key
    const cacheKey = this.generateCacheKey(command, listType, value);
    
    // Check cache first
    const cachedResult = this.cachedACLs.get(cacheKey);
    if (cachedResult !== undefined) {
      return cachedResult;
    }
    
    // If not in cache, query the database
    const result = this.aclListTable.get(command, listType, value);
    if (result) {
      this.cachedACLs.set(cacheKey, result);
    }
    
    return result;
  }

  private getUserRoles(userId: string): string[] {
    const roles = this.cachedRoles.get(userId);
    if (roles !== undefined) {
      return roles;
    }
    
    const result = this.userRoleTable.getRoles(userId);
    this.cachedRoles.set(userId, result);
    return result;
  }

  /**
   * Register a command
   * @param command Command name
   */
  registerCommand(command: string): void {
    this.registeredCommands.add(command.toLowerCase());
  }

  /**
   * Check if a command is registered
   * @param command Command name
   * @returns Whether the command is registered
   */
  isCommandRegistered(command: string): boolean {
    return this.registeredCommands.has(command.toLowerCase());
  }

  /**
   * Check if a user can execute a command
   * @param command Command name
   * @param userId User ID
   * @param chatId Chat ID
   * @returns Permission check result
   */
  canExecute(command: string, userId: string, chatId: string): PermissionCheckResult {
    // Admin bypass
    if (this.adminId && userId === this.adminId) {
      log.i(`Admin bypass for command ${command} by user ${userId}`);
      return { granted: true };
    }

    // Get the ACL for this command
    let commandAcl = this.cachedCommandACLs.get(command);

    // If no ACL is defined, check default allow cmds and deny by default
    if (!commandAcl) {
      if (this.ctx.defaultAllowCmds.includes(command)) {
        commandAcl = {
          command,
          default_allow: 1,
          deny_message: undefined
        };
      } else {
        log.i(`No default ACL defined for command ${command}, denying by default`);
        commandAcl = {
          command,
          default_allow: 0,
          deny_message: 'You are not allowed to use this command.',
        };
      }
    }

    // Check user blacklist (highest priority)
    let acl = this.getAclEntity(command, AclListType.USER_BLACKLIST, userId);
    if (acl) {
      log.i(`User ${userId} is blacklisted for command ${command}`);
      return { 
        granted: false, 
        denyMessage: acl.reason
      };
    }

    // Check user whitelist (second priority)
    acl = this.getAclEntity(command, AclListType.USER_WHITELIST, userId);
    if (acl) {
      log.t(`User ${userId} is whitelisted for command ${command}`);
      return { granted: true, denyMessage: undefined };
    }

    // Check user roles
    const userRoles = this.getUserRoles(userId);
    for (const role of userRoles) {
      // Check role blacklist (third priority)
      acl = this.getAclEntity(command, AclListType.ROLE_BLACKLIST, role);
      if (acl) {
        log.i(`Role ${role} is blacklisted for command ${command}`);
        return { 
          granted: false, 
          denyMessage: acl.reason 
        };
      }
    }

    for (const role of userRoles) {
      // Check role whitelist (fourth priority)
      acl = this.getAclEntity(command, AclListType.ROLE_WHITELIST, role);
      if (acl) {
        log.t(`Role ${role} is whitelisted for command ${command}`);
        return { granted: true, denyMessage: undefined };
      }
    }

    // Check chat blacklist (fifth priority)
    acl = this.getAclEntity(command, AclListType.CHAT_BLACKLIST, chatId);
    if (acl) {
      log.i(`Chat ${chatId} is blacklisted for command ${command}`);
      return { 
        granted: false, 
        denyMessage: acl.reason 
      };
    }

    // Check chat whitelist (sixth priority)
    acl = this.getAclEntity(command, AclListType.CHAT_WHITELIST, chatId);
    if (acl) {
      log.t(`Chat ${chatId} is whitelisted for command ${command}`);
      return { granted: true, denyMessage: undefined };
    }

    // Use default permission if no specific rules match
    if (commandAcl.default_allow) {
      log.t(`Using default permission allow for command ${command}`);
      return { granted: true, denyMessage: undefined };
    } else {
      log.i(`Using default permission deny for command ${command}`);
      return { 
        granted: false,
        denyMessage: commandAcl.deny_message
      };
    }
  }

  /**
   * Set the ACL for a command
   * @param command Command name
   * @param defaultAllow Default permission
   * @param denyMessage Message to show when permission is denied
   * @returns Whether the operation was successful
   */
  setCommandACL(command: string, defaultAllow: boolean, denyMessage?: string): Error | null {
    if (!this.isCommandRegistered(command)) {
      log.i(`Trying to set ACL for unregistered command ${command}. Aborting.`);
      return new ReplyableError('Command is not registered');
    }
    log.i(`Setting command ACL for command ${command}: defaultAllow=${defaultAllow}, denyMessage=${denyMessage}`);
    try {
      // Check if the command ACL already exists
      const existingACL = this.commandACLTable.get(command);
      
      if (existingACL) {
        // Update existing ACL
        const success = this.commandACLTable.update(command, defaultAllow, denyMessage);
        if (success) {
          // Update the cache
          this.cachedCommandACLs.set(command, {
            command,
            default_allow: defaultAllow ? 1 : 0,
            deny_message: denyMessage
          });
          return null;
        }
        return new ReplyableError('Failed to update command ACL');
      } else {
        // Create new ACL
        const success = this.commandACLTable.create(command, defaultAllow, denyMessage);
        if (success) {
          // Add to cache
          this.cachedCommandACLs.set(command, {
            command,
            default_allow: defaultAllow ? 1 : 0,
            deny_message: denyMessage
          });
          return null;
        }
        return new ReplyableError('Failed to create command ACL');
      }
    } catch (err) {
      log.e('Error setting command ACL:', err);
      return new ReplyableError('Failed to set command ACL');
    }
  }

  /**
   * Add a value to an ACL list
   * @param command Command name
   * @param aclListType List type
   * @param value Value to add
   * @param reason Reason for adding
   * @returns Whether the operation was successful
   */
  addACL(command: string, aclListType: AclListType, value: string, reason?: string): Error | null {
    try {
      if (this.getAclEntity(command, aclListType, value)) {
        return new ReplyableError('ACL already exists');
      }
      const success = this.aclListTable.add(command, aclListType, value, reason);
      if (success) {
        // Update cache
        const cacheKey = this.generateCacheKey(command, aclListType, value);
        this.cachedACLs.set(cacheKey, {
          command,
          list_type: aclListType,
          value,
          reason
        });
        return null;
      }
      return new ReplyableError('Failed to add ACL');
    } catch (err) {
      log.error('Error adding to ACL list:', err);
      return new ReplyableError('Failed to add ACL');
    }
  }

  /**
   * Remove a value from an ACL list
   * @param command Command name
   * @param aclListType List type
   * @param value Value to remove
   * @returns Whether the operation was successful
   */
  removeACL(command: string, aclListType: AclListType, value: string): Error | null {
    try {
      if (!this.getAclEntity(command, aclListType, value)) {
        return new ReplyableError('ACL not found');
      }
      const success = this.aclListTable.remove(command, aclListType, value);
      if (success) {
        // Update cache
        const cacheKey = this.generateCacheKey(command, aclListType, value);
        this.cachedACLs.delete(cacheKey);
        return null;
      }
      return new ReplyableError('Failed to remove ACL');
    } catch (err) {
      log.error('Error removing from ACL list:', err);
      return new ReplyableError('Failed to remove ACL');
    }
  }

  /**
   * Add a role to a user
   * @param userId User ID
   * @param role Role name
   * @returns Whether the operation was successful
   */
  addRole(userId: string, role: string): boolean {
    try {
      const success = this.userRoleTable.assign(userId, role);
      if (success) {
        // Update cache if exists
        const roles = this.cachedRoles.get(userId);
        if (roles) roles.push(role);
        return true;
      }
      return false;
    } catch (err) {
      log.error('Error adding role:', err);
      return false;
    }
  }

  /**
   * Remove a role from a user
   * @param userId User ID
   * @param role Role name
   * @returns Whether the operation was successful
   */
  removeRole(userId: string, role: string): boolean {
    try {
      const success = this.userRoleTable.remove(userId, role);
      if (success) {
        // Update cache if exists
        const roles = this.cachedRoles.get(userId);
        if (roles) roles.splice(roles.indexOf(role), 1);
        return true;
      }
      return false;
    } catch (err) {
      log.error('Error removing role:', err);
      return false;
    }
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    log.i('Clearing ACL caches');
    this.cachedCommandACLs.clear();
    this.cachedACLs.clear();
    this.cachedRoles.clear();
  }

  /**
   * Reload command ACL data from the database
   */
  reload(): void {
    log.i('ACL data reload');
    this.clearCache();
    this.loadCommandData();
  }
}
