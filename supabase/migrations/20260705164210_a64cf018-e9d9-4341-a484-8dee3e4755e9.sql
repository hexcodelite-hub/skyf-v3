
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'moderator');
CREATE TYPE public.order_status AS ENUM ('processing', 'shipped');
CREATE TYPE public.audit_category AS ENUM ('shop','order','points','permission','ban','auth');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  kick_id TEXT UNIQUE,
  kick_name TEXT NOT NULL,
  avatar_url TEXT,
  gems INT NOT NULL DEFAULT 0 CHECK (gems >= 0),
  trade_url TEXT,
  watch_seconds INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('owner','admin'));
$$;

CREATE POLICY "users see own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins see all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE TABLE public.skins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weapon TEXT NOT NULL,
  skin TEXT NOT NULL,
  wear TEXT,
  price_gems INT NOT NULL CHECK (price_gems >= 0),
  image_url TEXT,
  stock INT NOT NULL DEFAULT 1 CHECK (stock >= 0),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.skins TO anon, authenticated;
GRANT ALL ON public.skins TO service_role;
ALTER TABLE public.skins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "skins public read" ON public.skins FOR SELECT USING (true);

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skin_id UUID NOT NULL REFERENCES public.skins(id),
  price_gems INT NOT NULL,
  status order_status NOT NULL DEFAULT 'processing',
  trade_url_snapshot TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  shipped_at TIMESTAMPTZ
);
GRANT SELECT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = buyer_id OR public.is_admin(auth.uid()));

CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skin_id UUID NOT NULL REFERENCES public.skins(id),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.inventory TO authenticated;
GRANT ALL ON public.inventory TO service_role;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own inventory" ON public.inventory FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE TABLE public.ban_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  reason TEXT NOT NULL,
  duration_hours INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ban_templates TO anon, authenticated;
GRANT ALL ON public.ban_templates TO service_role;
ALTER TABLE public.ban_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ban templates public read" ON public.ban_templates FOR SELECT USING (true);

CREATE TABLE public.bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  duration_hours INT,
  expires_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bans TO authenticated;
GRANT ALL ON public.bans TO service_role;
ALTER TABLE public.bans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own bans" ON public.bans FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name TEXT,
  category audit_category NOT NULL,
  action TEXT NOT NULL,
  target TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.tg_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();
CREATE TRIGGER trg_skins_updated BEFORE UPDATE ON public.skins FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, kick_name, avatar_url, kick_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'kick_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1), 'user_' || substr(NEW.id::text,1,8)),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'kick_id'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.purchase_skin(_skin_id uuid)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _skin skins%ROWTYPE;
  _profile profiles%ROWTYPE;
  _order_id uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT * INTO _skin FROM skins WHERE id = _skin_id FOR UPDATE;
  IF NOT FOUND OR NOT _skin.active THEN RAISE EXCEPTION 'skin_unavailable'; END IF;
  IF _skin.stock <= 0 THEN RAISE EXCEPTION 'out_of_stock'; END IF;
  SELECT * INTO _profile FROM profiles WHERE id = _uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'profile_missing'; END IF;
  IF _profile.gems < _skin.price_gems THEN RAISE EXCEPTION 'insufficient_gems'; END IF;
  IF _profile.trade_url IS NULL OR _profile.trade_url = '' THEN RAISE EXCEPTION 'missing_trade_url'; END IF;
  IF EXISTS (SELECT 1 FROM bans WHERE user_id = _uid AND active AND (expires_at IS NULL OR expires_at > now())) THEN
    RAISE EXCEPTION 'user_banned';
  END IF;

  UPDATE profiles SET gems = gems - _skin.price_gems WHERE id = _uid;
  UPDATE skins SET stock = stock - 1 WHERE id = _skin_id;
  INSERT INTO orders (buyer_id, skin_id, price_gems, trade_url_snapshot)
    VALUES (_uid, _skin_id, _skin.price_gems, _profile.trade_url) RETURNING id INTO _order_id;
  INSERT INTO inventory (user_id, skin_id, order_id) VALUES (_uid, _skin_id, _order_id);
  INSERT INTO audit_logs (actor_id, actor_name, category, action, target, metadata)
    VALUES (_uid, _profile.kick_name, 'shop', 'purchased skin', _skin.weapon || ' | ' || _skin.skin,
            jsonb_build_object('order_id', _order_id, 'price', _skin.price_gems));
  RETURN _order_id;
END; $$;
GRANT EXECUTE ON FUNCTION public.purchase_skin(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_adjust_gems(_user_id uuid, _delta int, _note text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _actor uuid := auth.uid(); _target_name text; _actor_name text;
BEGIN
  IF NOT public.is_admin(_actor) THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE profiles SET gems = GREATEST(0, gems + _delta) WHERE id = _user_id RETURNING kick_name INTO _target_name;
  IF _target_name IS NULL THEN RAISE EXCEPTION 'user_not_found'; END IF;
  SELECT kick_name INTO _actor_name FROM profiles WHERE id = _actor;
  INSERT INTO audit_logs (actor_id, actor_name, category, action, target, metadata)
  VALUES (_actor, _actor_name, 'points',
          CASE WHEN _delta >= 0 THEN 'added ' || _delta || ' gems' ELSE 'removed ' || abs(_delta) || ' gems' END,
          _target_name, jsonb_build_object('delta', _delta, 'note', _note));
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_adjust_gems(uuid,int,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_order_status(_order_id uuid, _status order_status)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _actor uuid := auth.uid(); _actor_name text; _buyer_name text; _skin_label text;
BEGIN
  IF NOT public.is_admin(_actor) THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE orders SET status = _status, shipped_at = CASE WHEN _status='shipped' THEN now() ELSE NULL END WHERE id = _order_id;
  SELECT p.kick_name, s.weapon || ' | ' || s.skin INTO _buyer_name, _skin_label
    FROM orders o JOIN profiles p ON p.id=o.buyer_id JOIN skins s ON s.id=o.skin_id WHERE o.id = _order_id;
  SELECT kick_name INTO _actor_name FROM profiles WHERE id = _actor;
  INSERT INTO audit_logs (actor_id, actor_name, category, action, target, metadata)
  VALUES (_actor, _actor_name, 'order', 'set order ' || _status::text, _buyer_name || ' — ' || _skin_label,
          jsonb_build_object('order_id', _order_id));
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_set_order_status(uuid, order_status) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_grant_role(_user_id uuid, _role app_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _actor uuid := auth.uid(); _actor_name text; _target_name text;
BEGIN
  IF NOT public.is_admin(_actor) THEN RAISE EXCEPTION 'forbidden'; END IF;
  INSERT INTO user_roles (user_id, role) VALUES (_user_id, _role) ON CONFLICT DO NOTHING;
  SELECT kick_name INTO _target_name FROM profiles WHERE id = _user_id;
  SELECT kick_name INTO _actor_name FROM profiles WHERE id = _actor;
  INSERT INTO audit_logs (actor_id, actor_name, category, action, target, metadata)
  VALUES (_actor, _actor_name, 'permission', 'granted ' || _role::text, _target_name, '{}'::jsonb);
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_grant_role(uuid, app_role) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_revoke_role(_user_id uuid, _role app_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _actor uuid := auth.uid(); _actor_name text; _target_name text;
BEGIN
  IF NOT public.has_role(_actor, 'owner') THEN RAISE EXCEPTION 'forbidden'; END IF;
  DELETE FROM user_roles WHERE user_id = _user_id AND role = _role;
  SELECT kick_name INTO _target_name FROM profiles WHERE id = _user_id;
  SELECT kick_name INTO _actor_name FROM profiles WHERE id = _actor;
  INSERT INTO audit_logs (actor_id, actor_name, category, action, target, metadata)
  VALUES (_actor, _actor_name, 'permission', 'revoked ' || _role::text, _target_name, '{}'::jsonb);
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_revoke_role(uuid, app_role) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_ban_user(_user_id uuid, _reason text, _duration_hours int)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _actor uuid := auth.uid(); _actor_name text; _target_name text; _ban_id uuid; _exp timestamptz;
BEGIN
  IF NOT public.is_admin(_actor) THEN RAISE EXCEPTION 'forbidden'; END IF;
  _exp := CASE WHEN _duration_hours IS NULL THEN NULL ELSE now() + make_interval(hours => _duration_hours) END;
  UPDATE bans SET active = false WHERE user_id = _user_id AND active;
  INSERT INTO bans (user_id, reason, duration_hours, expires_at, created_by)
    VALUES (_user_id, _reason, _duration_hours, _exp, _actor) RETURNING id INTO _ban_id;
  SELECT kick_name INTO _target_name FROM profiles WHERE id = _user_id;
  SELECT kick_name INTO _actor_name FROM profiles WHERE id = _actor;
  INSERT INTO audit_logs (actor_id, actor_name, category, action, target, metadata)
  VALUES (_actor, _actor_name, 'ban',
          CASE WHEN _duration_hours IS NULL THEN 'permanent ban' ELSE 'temp ban (' || _duration_hours || 'h)' END,
          _target_name, jsonb_build_object('reason', _reason, 'expires_at', _exp));
  RETURN _ban_id;
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_ban_user(uuid,text,int) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_unban_user(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _actor uuid := auth.uid(); _actor_name text; _target_name text;
BEGIN
  IF NOT public.is_admin(_actor) THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE bans SET active = false WHERE user_id = _user_id AND active;
  SELECT kick_name INTO _target_name FROM profiles WHERE id = _user_id;
  SELECT kick_name INTO _actor_name FROM profiles WHERE id = _actor;
  INSERT INTO audit_logs (actor_id, actor_name, category, action, target, metadata)
  VALUES (_actor, _actor_name, 'ban', 'unbanned', _target_name, '{}'::jsonb);
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_unban_user(uuid) TO authenticated;

INSERT INTO public.ban_templates (label, reason, duration_hours) VALUES
  ('Spam (1d)', 'Spamování v chatu', 24),
  ('Toxic (7d)', 'Toxické chování vůči komunitě', 168),
  ('Cheating (perm)', 'Podvádění / zneužívání systému', NULL),
  ('Warning (3h)', 'Mírné porušení pravidel', 3);
