import { getUserId, Context, loadUser } from '../utils';

export const Query = {
  feed(parent, args, ctx: Context, info) {
    return ctx.db.query.posts({ where: { isPublished: true } }, info);
  },

  drafts(parent, args, ctx: Context, info) {
    const id = getUserId(ctx);

    const where = {
      isPublished: false,
      author: {
        id,
      },
    };

    return ctx.db.query.posts({ where }, info);
  },

  post(parent, { id }, ctx: Context, info) {
    return ctx.db.query.post({ where: { id } }, info);
  },

  async me(parent, args, ctx: Context, info) {
    const auth0Id = getUserId(ctx);
    let user = await ctx.db.query.user({ where: { auth0Id } }, info);
    if (!user) {
      const authUser = await loadUser(auth0Id);
      user = await ctx.db.mutation.createUser({
        data: {
          auth0Id,
          email: authUser.email,
        },
      });
    }
    return user;
  },

  // async user({ user: { id } }, args, ctx: Context, info) {
  //   return ctx.db.query.user({ where: { id } }, info);
  // },
};
