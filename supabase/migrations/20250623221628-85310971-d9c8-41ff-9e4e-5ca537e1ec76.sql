
-- Create users profiles table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  handicap INTEGER DEFAULT 20 CHECK (handicap >= 0 AND handicap <= 54),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create courses table
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  holes INTEGER[] NOT NULL DEFAULT ARRAY[4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT holes_length CHECK (array_length(holes, 1) = 18),
  CONSTRAINT holes_values CHECK (holes <@ ARRAY[3,4,5])
);

-- Create games table
CREATE TABLE public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  course_name TEXT NOT NULL,
  game_name TEXT NOT NULL,
  join_code TEXT UNIQUE NOT NULL,
  max_players INTEGER DEFAULT 4 CHECK (max_players >= 2 AND max_players <= 8),
  status TEXT DEFAULT 'lobby' CHECK (status IN ('lobby', 'in_progress', 'finished')),
  par_values INTEGER[] NOT NULL DEFAULT ARRAY[4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT par_values_length CHECK (array_length(par_values, 1) = 18),
  CONSTRAINT par_values_range CHECK (par_values <@ ARRAY[3,4,5])
);

-- Create players table (junction table for games and users)
CREATE TABLE public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_host BOOLEAN DEFAULT FALSE,
  handicap_at_start INTEGER NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(game_id, user_id)
);

-- Create scores table (fixed array type casting)
CREATE TABLE public.scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  strokes INTEGER[],
  out_score INTEGER DEFAULT 0,
  in_score INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  net_score INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(game_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for courses (public read access)
CREATE POLICY "Anyone can view courses" ON public.courses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anyone can create courses" ON public.courses
  FOR INSERT TO authenticated WITH CHECK (true);

-- RLS Policies for games
CREATE POLICY "Users can view games they're part of" ON public.games
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.players 
      WHERE game_id = games.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create games" ON public.games
  FOR INSERT TO authenticated WITH CHECK (host_id = auth.uid());

CREATE POLICY "Host can update their games" ON public.games
  FOR UPDATE TO authenticated USING (host_id = auth.uid());

-- RLS Policies for players
CREATE POLICY "Users can view players in their games" ON public.players
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.players p2 
      WHERE p2.game_id = players.game_id AND p2.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join games" ON public.players
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- RLS Policies for scores
CREATE POLICY "Users can view scores in their games" ON public.scores
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.players 
      WHERE game_id = scores.game_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own scores" ON public.scores
  FOR ALL TO authenticated USING (user_id = auth.uid());

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, handicap)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New Player'),
    COALESCE((NEW.raw_user_meta_data->>'handicap')::INTEGER, 20)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to calculate scores
CREATE OR REPLACE FUNCTION public.calculate_scores(game_id_param UUID, user_id_param UUID)
RETURNS VOID AS $$
DECLARE
  stroke_array INTEGER[];
  out_total INTEGER := 0;
  in_total INTEGER := 0;
  total INTEGER := 0;
  net INTEGER := 0;
  user_handicap INTEGER;
BEGIN
  -- Get current strokes
  SELECT strokes INTO stroke_array
  FROM public.scores
  WHERE game_id = game_id_param AND user_id = user_id_param;
  
  -- Get user handicap
  SELECT handicap_at_start INTO user_handicap
  FROM public.players
  WHERE game_id = game_id_param AND user_id = user_id_param;
  
  -- Calculate OUT (holes 1-9)
  FOR i IN 1..9 LOOP
    IF stroke_array[i] IS NOT NULL THEN
      out_total := out_total + stroke_array[i];
    END IF;
  END LOOP;
  
  -- Calculate IN (holes 10-18)
  FOR i IN 10..18 LOOP
    IF stroke_array[i] IS NOT NULL THEN
      in_total := in_total + stroke_array[i];
    END IF;
  END LOOP;
  
  total := out_total + in_total;
  net := total - user_handicap;
  
  -- Update scores
  UPDATE public.scores
  SET 
    out_score = out_total,
    in_score = in_total,
    total_score = total,
    net_score = net,
    updated_at = NOW()
  WHERE game_id = game_id_param AND user_id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert a default course
INSERT INTO public.courses (id, name, holes) VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'Default Course', ARRAY[4,4,3,5,4,3,4,5,4,4,3,4,5,4,3,4,5,4]);
