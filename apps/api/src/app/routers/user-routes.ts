import { TRPCError } from '@trpc/server';
import { z } from 'zod/v4';
import { generateId } from 'lucia';
import {
  protectedProcedure,
  publicAuthProcedure,
  publicProcedure,
  router,
} from '../trpc.js';
import db from '../db/index.js';
import { getUserInvitationsByEmail } from '../db/user-db.js';
import { createUserSessionCookie, lucia } from '../auth.js';
import { userSettingsValidator } from '@tapiz/board-commons/validators/user-settings.validator.js';
import { withDefaultUserSettings } from '@tapiz/board-commons';
import { generateApiToken, hashApiToken } from '../api-token.js';
import { hashPassword, verifyPassword } from '../password.js';

export const userRouter = router({
  register: publicAuthProcedure
    .input(
      z.object({
        username: z.string().trim().min(3).max(50),
        password: z.string().min(6).max(100),
      }),
    )
    .mutation(async (req) => {
      const username = req.input.username;

      const existing = await db.user.getUserByUsername(username);

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Username already taken',
        });
      }

      const userId = generateId(15);
      // The email column is NOT NULL + unique but unused for password accounts;
      // synthesize a unique placeholder from the generated id.
      const email = `${userId}@tapiz.local`;
      const passwordHash = await hashPassword(req.input.password);

      await db.user.createUserWithPassword({
        id: userId,
        username,
        name: username,
        email,
        passwordHash,
      });

      return { success: true };
    }),

  login: publicAuthProcedure
    .input(
      z.object({
        username: z.string().trim().min(1).max(50),
        password: z.string().min(1).max(100),
      }),
    )
    .mutation(async (req) => {
      const user = await db.user.getUserByUsername(req.input.username);

      const valid = user
        ? await verifyPassword(req.input.password, user.passwordHash)
        : false;

      if (!user || !valid) {
        // Same error whether the user is missing or the password is wrong.
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid username or password',
        });
      }

      const sessionCookie = await createUserSessionCookie(user.id);

      req.ctx.res.setCookie(sessionCookie.name, sessionCookie.value, {
        ...sessionCookie.attributes,
      });

      return {
        id: user.id,
        name: user.name,
        picture: user.picture ?? '',
        settings: withDefaultUserSettings(user.settings),
      };
    }),
  removeAccount: protectedProcedure.mutation(async (req) => {
    await lucia.invalidateUserSessions(req.ctx.user.sub);

    let teams = await db.team.getUserTeams(req.ctx.user.sub);

    teams = teams.filter(async (team) => {
      const members = await db.team.getTeamMembers(team.id);

      return members.length === 1;
    });

    const teamsWithMembers: string[] = [];
    const teamsWithoutMembers: string[] = [];

    for (const team of teams) {
      const members = await db.team.getTeamMembers(team.id);

      if (members.length === 1) {
        teamsWithoutMembers.push(team.id);
      } else {
        teamsWithMembers.push(team.id);
      }
    }

    teamsWithoutMembers.forEach(async (teamId) => {
      await db.team.deleteTeam(teamId);
    });

    teamsWithMembers.forEach(async (teamId) => {
      const members = await db.team.getTeamMembers(teamId);

      const newOwner = members.find((member) => member.id !== req.ctx.user.sub);

      if (newOwner) {
        await db.team.changeRole(teamId, newOwner.id, 'admin');
      }
    });

    const boards = await db.board.getBoards(req.ctx.user.sub);

    boards.forEach(async (board) => {
      const members = await db.board.getBoardUsers(board.id);

      if (members.length === 1 && !board.teamId) {
        db.board.deleteBoard(board.id);
      } else if (members.length > 1) {
        const newOwner = members.find(
          (member) => member.id !== req.ctx.user.sub,
        );

        if (newOwner) {
          await db.board.changeRole(board.id, newOwner.id, 'admin');
        }
      }
    });

    await db.user.deleteAccount(req.ctx.user.sub);

    return {
      success: true,
    };
  }),
  user: protectedProcedure.query(async (req) => {
    const user = await db.user.getUser(req.ctx.user.sub);

    return {
      name: req.ctx.user.name,
      id: req.ctx.user.sub,
      picture: req.ctx.user.picture ?? '',
      settings: withDefaultUserSettings(user?.settings),
    };
  }),
  settings: protectedProcedure.query(async (req) => {
    const user = await db.user.getUser(req.ctx.user.sub);

    return withDefaultUserSettings(user?.settings);
  }),
  updateSettings: protectedProcedure
    .input(userSettingsValidator)
    .mutation(async (req) => {
      const settings = withDefaultUserSettings(req.input);
      const savedSettings = await db.user.updateUserSettings(
        req.ctx.user.sub,
        settings,
      );

      return withDefaultUserSettings(savedSettings);
    }),
  apiToken: protectedProcedure.query(async (req) => {
    const tokenInfo = await db.user.getUserApiTokenInfo(req.ctx.user.sub);

    return tokenInfo ?? { hasToken: false, createdAt: null };
  }),
  generateApiToken: protectedProcedure.mutation(async (req) => {
    const token = generateApiToken();
    const createdAt = await db.user.updateUserApiToken(
      req.ctx.user.sub,
      hashApiToken(token),
    );

    return {
      token,
      createdAt,
    };
  }),
  invites: protectedProcedure.query(async (req) => {
    const email = req.ctx.user.email;

    const invitationsEmail = await getUserInvitationsByEmail(email);
    const invitations = await db.user.getUserInvitations(req.ctx.user.sub);

    return [...invitationsEmail, ...invitations];
  }),
  acceptInvite: protectedProcedure
    .input(z.object({ inviteId: z.string().uuid() }))
    .mutation(async (req) => {
      const result = await db.user.acceptInvitation(
        req.ctx.user.sub,
        req.ctx.user.email,
        req.input.inviteId,
      );

      if (!result) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return {
        success: true,
      };
    }),
  cancelInvite: protectedProcedure
    .input(z.object({ inviteId: z.string().uuid() }))
    .mutation(async (req) => {
      const invitation = await db.user.getInvitation(req.input.inviteId);

      if (!invitation) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      let authError = false;

      if (
        invitation.inviterId !== req.ctx.user.sub &&
        invitation.userId !== req.ctx.user.sub &&
        invitation.email !== req.ctx.user.email
      ) {
        if (invitation.teamId) {
          const admins = await db.team.getTeamAdmins(invitation.teamId);

          const isAdmin = !!admins.find(
            (admin) => admin.accountId === req.ctx.user.sub,
          );

          if (!isAdmin) {
            authError = true;
          }
        } else if (invitation.boardId) {
          const admins = await db.board.getBoardAdmins(invitation.boardId);

          const isAdmin = admins.includes(req.ctx.user.sub);

          if (!isAdmin) {
            authError = true;
          }
        }
      }

      if (authError) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      await db.user.deleteInvitation(req.input.inviteId);

      return {
        success: true,
      };
    }),
  logout: publicProcedure.query(async (req) => {
    const mayLogout: { user?: { sub: string } } = req.ctx;

    if (mayLogout.user) {
      await lucia.invalidateUserSessions(mayLogout.user.sub);
    }

    return {
      success: true,
    };
  }),
  notifications: protectedProcedure
    .input(z.object({ offset: z.number().int().optional().default(0) }))
    .query(async (req) => {
      const notifications = await db.user.getUserNotifications(
        req.ctx.user.sub,
        req.input.offset,
      );

      const size = await db.user.getUserNotificationsCount(req.ctx.user.sub);

      return {
        items: notifications,
        size,
      };
    }),
  clearNotifications: protectedProcedure.mutation(async (req) => {
    await db.user.clearUserNotifications(req.ctx.user.sub);

    return {
      success: true,
    };
  }),
});
