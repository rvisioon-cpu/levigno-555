-- Insert default production users

-- 1. Super Admin
INSERT INTO users (id, name, email, password, role, admin_limit, created_by, created_at, updated_at)
VALUES (
  'df1e78a6-56a7-47b2-bdcf-88aefcd19a6b',
  'Super Admin',
  'super_admin@showroom-template.com',
  '$2b$10$YAEfssQUWB.9lwRdLv8da.96X0aYT1v/zpnpE2P58waYELBBKT0cu',
  'SUPER_ADMIN',
  0,
  NULL,
  strftime('%s', 'now') * 1000,
  strftime('%s', 'now') * 1000
);

-- 2. Seller (Andres Pluska)
INSERT INTO users (id, name, email, password, role, admin_limit, created_by, created_at, updated_at)
VALUES (
  'a64bd2e3-29e7-47b7-bdcf-88aefcd19a6b',
  'Andres Pluska',
  'pluskaandres@gmail.com',
  '$2b$10$YAEfssQUWB.9lwRdLv8da.96X0aYT1v/zpnpE2P58waYELBBKT0cu',
  'SELLER',
  0,
  'df1e78a6-56a7-47b2-bdcf-88aefcd19a6b',
  strftime('%s', 'now') * 1000,
  strftime('%s', 'now') * 1000
);

-- 2.5 Admin (Rvisioon)
INSERT INTO users (id, name, email, password, role, admin_limit, created_by, created_at, updated_at)
VALUES (
  'e64bd2e3-29e7-47b7-bdcf-88aefcd19a6b',
  'Rvisioon',
  'rvisioon@gmail.com',
  '$2b$10$YAEfssQUWB.9lwRdLv8da.96X0aYT1v/zpnpE2P58waYELBBKT0cu',
  'ADMIN',
  5,
  'df1e78a6-56a7-47b2-bdcf-88aefcd19a6b',
  strftime('%s', 'now') * 1000,
  strftime('%s', 'now') * 1000
);

-- 3. Seller (Default)
INSERT INTO users (id, name, email, password, role, admin_limit, created_by, created_at, updated_at)
VALUES (
  '37a77b61-29e7-47b7-bdcf-88aefcd19a6b',
  'Seller',
  'seller@showroom-template.com',
  '$2b$10$YAEfssQUWB.9lwRdLv8da.96X0aYT1v/zpnpE2P58waYELBBKT0cu',
  'SELLER',
  0,
  'a64bd2e3-29e7-47b7-bdcf-88aefcd19a6b',
  strftime('%s', 'now') * 1000,
  strftime('%s', 'now') * 1000
);
