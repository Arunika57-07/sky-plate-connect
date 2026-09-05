-- Roles
CREATE TYPE public.app_role AS ENUM ('customer','delivery','admin');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT '',
  is_premium boolean NOT NULL DEFAULT false,
  vehicle_number text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'delivery'));
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- Signup trigger: profile + role (admin only via @buggy.admin email)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  requested text := COALESCE(NEW.raw_user_meta_data->>'role','customer');
  final_role public.app_role;
BEGIN
  IF NEW.email LIKE '%@buggy.admin' THEN
    final_role := 'admin';
  ELSIF requested = 'delivery' THEN
    final_role := 'delivery';
  ELSE
    final_role := 'customer';
  END IF;

  INSERT INTO public.profiles (id, full_name, email, phone, address, city, state, vehicle_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name',''),
    COALESCE(NEW.email,''),
    COALESCE(NEW.raw_user_meta_data->>'phone',''),
    COALESCE(NEW.raw_user_meta_data->>'address',''),
    COALESCE(NEW.raw_user_meta_data->>'city',''),
    COALESCE(NEW.raw_user_meta_data->>'state',''),
    NEW.raw_user_meta_data->>'vehicle_number'
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, final_role)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Restaurants and menu
CREATE TABLE public.restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cuisine text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  rating numeric(2,1) NOT NULL DEFAULT 4.3,
  eta_minutes int NOT NULL DEFAULT 30,
  drone_enabled boolean NOT NULL DEFAULT true,
  image_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.restaurants TO anon, authenticated;
GRANT ALL ON public.restaurants TO service_role;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "restaurants public read" ON public.restaurants FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "restaurants admin write" ON public.restaurants FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric(8,2) NOT NULL,
  is_veg boolean NOT NULL DEFAULT true,
  image_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.menu_items TO anon, authenticated;
GRANT ALL ON public.menu_items TO service_role;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "menu public read" ON public.menu_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "menu admin write" ON public.menu_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Orders
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE SET NULL,
  courier_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total numeric(10,2) NOT NULL DEFAULT 0,
  delivery_mode text NOT NULL DEFAULT 'bike',
  status text NOT NULL DEFAULT 'placed',
  address text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer reads own orders" ON public.orders FOR SELECT TO authenticated
  USING (auth.uid() = customer_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'delivery'));
CREATE POLICY "customer creates own orders" ON public.orders FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "courier or admin updates orders" ON public.orders FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'delivery'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'delivery'));

-- Seed restaurants
INSERT INTO public.restaurants (id, name, cuisine, city, state, rating, eta_minutes, drone_enabled, image_url) VALUES
('11111111-1111-1111-1111-111111111101','Madurai Idli Kadai','South Indian','Madurai','Tamil Nadu',4.6,25,true,'/images/masala-dosa.jpg'),
('11111111-1111-1111-1111-111111111102','Chettinad Mess','Chettinad','Karaikudi','Tamil Nadu',4.5,35,true,'/images/chettinad-chicken.jpg'),
('11111111-1111-1111-1111-111111111103','Charminar Biryani House','Hyderabadi','Hyderabad','Telangana',4.7,30,true,'/images/hyderabadi-biryani.jpg'),
('11111111-1111-1111-1111-111111111104','Dadar Vada Pav Centre','Maharashtrian','Mumbai','Maharashtra',4.4,20,true,'/images/vada-pav.jpg'),
('11111111-1111-1111-1111-111111111105','Kochi Coconut Kitchen','Kerala','Kochi','Kerala',4.5,28,true,'/images/appam-stew.jpg'),
('11111111-1111-1111-1111-111111111106','Amritsar Tandoor Junction','North Indian','Amritsar','Punjab',4.6,32,false,'/images/butter-chicken.jpg'),
('11111111-1111-1111-1111-111111111107','Park Street Mishti Ghar','Bengali Sweets','Kolkata','West Bengal',4.8,26,true,'/images/bengali-sweets.jpg'),
('11111111-1111-1111-1111-111111111108','Ahmedabad Thali Company','Gujarati','Ahmedabad','Gujarat',4.3,34,false,'/images/gujarati-thali.jpg');

INSERT INTO public.menu_items (restaurant_id, name, description, price, is_veg, image_url) VALUES
('11111111-1111-1111-1111-111111111101','Ghee Roast Masala Dosa','Crispy dosa with potato masala, chutney and sambar',129,true,'/images/masala-dosa.jpg'),
('11111111-1111-1111-1111-111111111101','Podi Idli Plate','Soft idlis tossed in milagai podi and ghee',99,true,'/images/masala-dosa.jpg'),
('11111111-1111-1111-1111-111111111102','Chettinad Chicken Curry','Fiery pepper masala chicken with parotta',249,false,'/images/chettinad-chicken.jpg'),
('11111111-1111-1111-1111-111111111102','Kothu Parotta','Shredded parotta tossed with egg and salna',189,false,'/images/chettinad-chicken.jpg'),
('11111111-1111-1111-1111-111111111103','Hyderabadi Chicken Dum Biryani','Handi biryani with raita and mirchi ka salan',299,false,'/images/hyderabadi-biryani.jpg'),
('11111111-1111-1111-1111-111111111103','Veg Dum Biryani','Slow-cooked vegetable biryani with boiled egg',229,true,'/images/hyderabadi-biryani.jpg'),
('11111111-1111-1111-1111-111111111104','Butter Vada Pav (2 pcs)','Mumbai street classic with dry garlic chutney',79,true,'/images/vada-pav.jpg'),
('11111111-1111-1111-1111-111111111104','Pav Bhaji','Buttery bhaji with toasted pav and onions',149,true,'/images/vada-pav.jpg'),
('11111111-1111-1111-1111-111111111105','Appam with Veg Stew','Lace appams with coconut milk stew',169,true,'/images/appam-stew.jpg'),
('11111111-1111-1111-1111-111111111105','Kerala Sadya Mini','Rice, avial, sambar, thoran and payasam',219,true,'/images/appam-stew.jpg'),
('11111111-1111-1111-1111-111111111106','Butter Chicken with Naan','Creamy tomato gravy with butter naan',329,false,'/images/butter-chicken.jpg'),
('11111111-1111-1111-1111-111111111106','Dal Makhani Combo','Slow-cooked dal with laccha paratha',219,true,'/images/butter-chicken.jpg'),
('11111111-1111-1111-1111-111111111107','Rasgulla Pot (6 pcs)','Spongy rasgulla in light sugar syrup',159,true,'/images/bengali-sweets.jpg'),
('11111111-1111-1111-1111-111111111107','Mishti Doi','Earthen pot sweet yoghurt',89,true,'/images/bengali-sweets.jpg'),
('11111111-1111-1111-1111-111111111108','Gujarati Unlimited Thali','Dhokla, undhiyu, rotli, dal, rice and shrikhand',279,true,'/images/gujarati-thali.jpg'),
('11111111-1111-1111-1111-111111111108','Dhokla Box','Steamed besan dhokla with green chutney',119,true,'/images/gujarati-thali.jpg');
