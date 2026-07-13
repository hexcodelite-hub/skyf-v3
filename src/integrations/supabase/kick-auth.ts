import { createMiddleware } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const requireKickOrSupabaseAuth = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const request = getRequest();
    const cookieHeader = request.heade
    console.log("Cookies v requeste:", request.headers.get('cookie'));
    const kickUserId = cookieHeader.match(/kick_user_id=([^;]+)/)?.[1];

    if (kickUserId) {
      return next({
        context: {
          supabase: supabaseAdmin,
          userId: kickUserId,
        },
      });
    }

    throw new Error('Unauthorized: No session found');
  },
);