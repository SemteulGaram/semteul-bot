import { KyushBot } from '@/kyushbot';
import { Logger } from '@/logger';
import { applyTextCommandCallback } from '@/command-util';
import { tgReplyText, tgSendHelp, tgUnhandleError } from '@/utils/tg-macro';
import { AclListType } from '@/types/acl';
import { ReplyableError } from '@/utils/replyable-error';

const log = new Logger({
  parentHierarchy: ['cmd', 'acl'],
});

/**
 * Apply ACL management commands to the bot
 * @param ctx KyushBot instance
 */
export function applyBotCommandACL(ctx: KyushBot): void {
  log.i('Applying ACL commands')

  // Command to set default permission for a command
  ctx.registerHelpMsg('setperm',
    `\`/setperm@${ctx.botId} [command] ['allow'|'deny'] [deny message (optional)]\`\n\\- Set default permission for a command`
  );
  applyTextCommandCallback(ctx, 'setperm', true, async (msg, cmd, argstr): Promise<void> => {
    try {
      // Argument validation
      if (!argstr) return tgSendHelp(ctx, msg, cmd);
      const matches = argstr.match(/^\s*([\S]+)\s+(allow|deny)(?:\s+([\s\S]*))?$/);
      if (!matches) return tgSendHelp(ctx, msg, cmd);
      const command = matches[1];
      const permission = matches[2];
      const denyMessage = matches[3] || undefined;

      const err = ctx.aclService.setCommandACL(
        command,
        permission === 'allow',
        denyMessage
      );

      if (err) {
        log.iH([cmd], `Failed to set permission for ${command}: ${err.message}`);
        tgReplyText(ctx.bot, msg, err.message || 'Failed to set permission.');
      } else {
        log.iH([cmd], `Successfully set permission for ${command}`);
        tgReplyText(ctx.bot, msg,
          `Default permission for /${command} set to ${permission}${
            denyMessage ? ` with message: "${denyMessage}"` : ''
          }`
        );
      }
    } catch (unhandledErr) {
      tgUnhandleError(ctx, msg, cmd, unhandledErr, log);
    }
  });

  // Command to add a user/chat/role to a command's whitelist
  ctx.registerHelpMsg('addacl',
    `\`/addacl@${ctx.botId} [command] ['allow'|'deny'] ['user'|'chat'|'role'] [user_id|chat_id|role] [deny message (optional)]\`\n\\- Add a user/chat/role to a command's whitelist`
  );
  applyTextCommandCallback(ctx, 'addacl', true, async (msg, cmd, argstr): Promise<void> => {
    try {
      if (!argstr) return tgSendHelp(ctx, msg, cmd);
      const matches = argstr.match(/^\s*([\S]+)\s+(allow|deny)\s+(user|chat|role)\s+([\S]+)(?:\s+([\s\S]*))?$/);
      if (!matches) return tgSendHelp(ctx, msg, cmd);
      const command = matches[1].toLowerCase();
      const permission = matches[2].toLowerCase();
      const typestr = matches[3].toLowerCase();
      const uid = matches[4];
      const denyMessage = matches[5] || undefined;

      let type: AclListType;
      switch (typestr) {
        case 'user':
          if (permission !== 'allow') type = AclListType.USER_BLACKLIST;
          else type = AclListType.USER_WHITELIST;
          break;
        case 'chat':
          if (permission !== 'allow') type = AclListType.CHAT_BLACKLIST;
          else type = AclListType.CHAT_WHITELIST;
          break;
        case 'role':
          if (permission !== 'allow') type = AclListType.ROLE_BLACKLIST;
          else type = AclListType.ROLE_WHITELIST;
          break;
        default:
          return tgSendHelp(ctx, msg, cmd);
      }

      const err = ctx.aclService.addACL(command, type, uid, denyMessage);

      if (err) {
        log.iH([cmd], `Failed to add ${typestr} ${uid} to ${permission} list for ${command}: ${err.message}`);
        tgReplyText(ctx.bot, msg,
          (err && err.message) || `Failed to add ${typestr} ${uid} to ${permission} list for /${command}. Check the logs for more details.`
        );
      } else {
        log.iH([cmd], `Added ${typestr} ${uid} to ${permission} list for ${command}`);
        tgReplyText(ctx.bot, msg, `${typestr} ${uid} added to ${permission} list for /${command}`);
      }
    } catch (unhandledErr) {
      tgUnhandleError(ctx, msg, cmd, unhandledErr, log);
    }
  });

  // Command to remove a user/chat/role from a command's whitelist
  ctx.registerHelpMsg('removeacl',
    `\`/removeacl@${ctx.botId} [command] ['allow'|'deny'] ['user'|'chat'|'role'] [user_id|chat_id|role]\`\n\\- Remove a user/chat/role from a command's whitelist`
  );
  applyTextCommandCallback(ctx, 'removeacl', true, async (msg, cmd, argstr) => {
    try {
      if (!argstr) return tgSendHelp(ctx, msg, cmd);
      const matches = argstr.match(/^\s*([\S]+)\s+(allow|deny)\s+(user|chat|role)\s+([\S]+)$/);
      if (!matches) return tgSendHelp(ctx, msg, cmd);
      const command = matches[1].toLowerCase();
      const permission = matches[2].toLowerCase();
      const typestr = matches[3].toLowerCase();
      const uid = matches[4];

      let type: AclListType;
      switch (typestr) {
        case 'user':
          if (permission !== 'allow') type = AclListType.USER_BLACKLIST;
          else type = AclListType.USER_WHITELIST;
          break;
        case 'chat':
          if (permission !== 'allow') type = AclListType.CHAT_BLACKLIST;
          else type = AclListType.CHAT_WHITELIST;
          break;
        case 'role':
          if (permission !== 'allow') type = AclListType.ROLE_BLACKLIST;
          else type = AclListType.ROLE_WHITELIST;
          break;
        default:
          return tgSendHelp(ctx, msg, cmd);
      }

      const err = ctx.aclService.removeACL(command, type, uid);

      if (err) {
        log.iH([cmd], `Failed to remove ${typestr} ${uid} to ${permission} list for ${command}: ${err.message}`);
        tgReplyText(ctx.bot, msg,
          (err && err.message) || `Failed to remove ${typestr} ${uid} to ${permission} list for /${command}. Check the logs for more details.`,
        );
      } else {
        log.iH([cmd], `Removed ${typestr} ${uid} to ${permission} list for ${command}`);
        tgReplyText(ctx.bot, msg,
          `${typestr} ${uid} removed from ${permission} list for /${command}`,
        );
      }
    } catch (unhandledErr) {
      tgUnhandleError(ctx, msg, cmd, unhandledErr, log);
    }
  });

  // Command to assign a role to a user
  ctx.registerHelpMsg('addrole',
    `\`/addrole@${ctx.botId} [user_id] [role]\`\n\\- Assign a role to a user`
  );
  applyTextCommandCallback(ctx, 'addrole', true, async (msg, cmd, argstr) => {
    try {
      if (!argstr) return tgSendHelp(ctx, msg, cmd);
      const matches = argstr.match(/^\s*([\S]+)\s+([\S]+)\s*$/);
      if (!matches) return tgSendHelp(ctx, msg, cmd);
      const userId = matches[1];
      const role = matches[2].toLowerCase();

      const success = ctx.aclService.addRole(userId, role);

      if (!success) {
        log.iH([cmd], `Failed to assign role ${role} to user ${userId}`);
        tgReplyText(ctx.bot, msg, 'Failed to assign role. Please try again.');
      } else {
        log.iH([cmd], `Assigned role ${role} to user ${userId}`);
        tgReplyText(ctx.bot, msg, `Role ${role} assigned to user ${userId}`);
      }
    } catch (unhandledErr) {
      tgUnhandleError(ctx, msg, cmd, unhandledErr, log);
    }
  });

  // Command to remove a role from a user
  ctx.registerHelpMsg('removerole',
    `\`/removerole@${ctx.botId} [user_id] [role]\`\n\\- Remove a role from a user`
  );
  applyTextCommandCallback(ctx, 'removerole', true, async (msg, cmd, argstr) => {
    try {
      if (!argstr) return tgSendHelp(ctx, msg, cmd);
      const matches = argstr.match(/^\s*([\S]+)\s+([\S]+)\s*$/);
      if (!matches) return tgSendHelp(ctx, msg, cmd);
      const userId = matches[1];
      const role = matches[2].toLowerCase();

      const success = ctx.aclService.removeRole(userId, role);

      if (!success) {
        log.iH([cmd], `Failed to remove role ${role} from user ${userId}`);
        tgReplyText(ctx.bot, msg, 'Failed to remove role. Please try again.');
      } else {
        log.iH([cmd], `Removed role ${role} from user ${userId}`);
        tgReplyText(ctx.bot, msg, `Role ${role} removed from user ${userId}`);
      }
    } catch (unhandledErr) {
      tgUnhandleError(ctx, msg, cmd, unhandledErr, log);
    }
  });
}
