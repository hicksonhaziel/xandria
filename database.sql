-- Node Metrics Table (Devnet)
CREATE TABLE devnet_node_metrics (
  id BIGSERIAL PRIMARY KEY,
  pubkey TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  uptime NUMERIC,
  score NUMERIC,
  xan_score NUMERIC,
  storage_committed BIGINT,
  storage_used BIGINT,
  storage_usage_percent NUMERIC,
  ram_total BIGINT,
  ram_used BIGINT,
  ram_percent NUMERIC,
  cpu_percent NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Node Metrics Table (Mainnet)
CREATE TABLE mainnet_node_metrics (
  id BIGSERIAL PRIMARY KEY,
  pubkey TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  uptime NUMERIC,
  score NUMERIC,
  xan_score NUMERIC,
  storage_committed BIGINT,
  storage_used BIGINT,
  storage_usage_percent NUMERIC,
  ram_total BIGINT,
  ram_used BIGINT,
  ram_percent NUMERIC,
  cpu_percent NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pod Credits Table (Devnet)
CREATE TABLE devnet_pod_credits (
  id BIGSERIAL PRIMARY KEY,
  pod_id TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  credits NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pod Credits Table (Mainnet)
CREATE TABLE mainnet_pod_credits (
  id BIGSERIAL PRIMARY KEY,
  pod_id TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  credits NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX idx_devnet_node_metrics_pubkey_timestamp ON devnet_node_metrics(pubkey, timestamp DESC);
CREATE INDEX idx_devnet_node_metrics_timestamp ON devnet_node_metrics(timestamp DESC);
CREATE INDEX idx_mainnet_node_metrics_pubkey_timestamp ON mainnet_node_metrics(pubkey, timestamp DESC);
CREATE INDEX idx_mainnet_node_metrics_timestamp ON mainnet_node_metrics(timestamp DESC);

CREATE INDEX idx_devnet_pod_credits_pod_id_timestamp ON devnet_pod_credits(pod_id, timestamp DESC);
CREATE INDEX idx_devnet_pod_credits_timestamp ON devnet_pod_credits(timestamp DESC);
CREATE INDEX idx_mainnet_pod_credits_pod_id_timestamp ON mainnet_pod_credits(pod_id, timestamp DESC);
CREATE INDEX idx_mainnet_pod_credits_timestamp ON mainnet_pod_credits(timestamp DESC);