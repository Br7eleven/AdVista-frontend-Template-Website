/*
  # Initial Schema Setup for AdVista Rewards

  1. New Tables
    - users
      - id (uuid, primary key)
      - email (text, unique)
      - name (text)
      - balance (decimal)
      - total_earned (decimal)
      - referral_code (text, unique)
      - referral_count (integer)
      - referral_earnings (decimal)
      - tasks_completed (integer)
      - created_at (timestamp)
      - last_login (timestamp)

    - tasks
      - id (uuid, primary key)
      - user_id (uuid, foreign key)
      - type (text)
      - status (text)
      - reward (decimal)
      - completed_at (timestamp)
      - created_at (timestamp)

    - withdrawals
      - id (uuid, primary key)
      - user_id (uuid, foreign key)
      - amount (decimal)
      - status (text)
      - payment_method (text)
      - created_at (timestamp)
      - processed_at (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  email text UNIQUE NOT NULL,
  name text,
  balance decimal DEFAULT 0,
  total_earned decimal DEFAULT 0,
  referral_code text UNIQUE,
  referral_count integer DEFAULT 0,
  referral_earnings decimal DEFAULT 0,
  tasks_completed integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  last_login timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Tasks table
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  type text NOT NULL,
  status text NOT NULL,
  reward decimal NOT NULL,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Withdrawals table
CREATE TABLE withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  amount decimal NOT NULL,
  status text NOT NULL,
  payment_method text NOT NULL,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own withdrawals"
  ON withdrawals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own withdrawals"
  ON withdrawals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);