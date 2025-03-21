-- -- Drop existing tables if they exist
-- DROP TABLE IF EXISTS "InventoryTransaction" CASCADE;
-- DROP TABLE IF EXISTS "ProcurementRequests" CASCADE;
-- DROP TABLE IF EXISTS "Inventory" CASCADE;
-- DROP TABLE IF EXISTS "Permissions" CASCADE;
-- DROP TABLE IF EXISTS "Users" CASCADE;
-- DROP TABLE IF EXISTS "Departments" CASCADE;

-- -- Create Departments Table
-- CREATE TABLE "Departments" (
--   id SERIAL PRIMARY KEY,
--   name VARCHAR(255) NOT NULL
-- );

-- -- Create Users Table
-- CREATE TABLE "Users" (
--   id SERIAL PRIMARY KEY,
--   username VARCHAR(255) NOT NULL,
--   role VARCHAR(50) NOT NULL,
--   departmentId INTEGER REFERENCES "Departments"(id),
--   password VARCHAR(255) NOT NULL,
--   isGlobalRole BOOLEAN DEFAULT FALSE
-- );

-- -- Create Permissions Table
-- CREATE TABLE "Permissions" (
--   id SERIAL PRIMARY KEY,
--   role VARCHAR(50) NOT NULL,
--   module VARCHAR(100) NOT NULL,
--   canAccess BOOLEAN DEFAULT TRUE,
--   departmentId INTEGER REFERENCES "Departments"(id) ON DELETE CASCADE
-- );

-- -- Create Inventory Table
-- CREATE TABLE "Inventory" (
--   id SERIAL PRIMARY KEY,
--   itemName VARCHAR(255) NOT NULL,
--   quantity INTEGER NOT NULL,
--   minimumStockLevel INTEGER NOT NULL,
--   departmentId INTEGER REFERENCES "Departments"(id),
--   lastRestocked TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
--   createdAt TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
--   updatedAt TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
-- );

-- -- Create Trigger for Auto-Update Timestamp
-- CREATE OR REPLACE FUNCTION update_inventory_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--    NEW."updatedAt" = NOW();
--    RETURN NEW;
-- END;
-- $$ language 'plpgsql';

-- CREATE TRIGGER update_inventory_timestamp
-- BEFORE UPDATE ON "Inventory"
-- FOR EACH ROW
-- EXECUTE PROCEDURE update_inventory_updated_at_column();

-- -- Create Inventory Transactions Table
-- CREATE TABLE "InventoryTransaction" (
--   id SERIAL PRIMARY KEY,
--   inventoryId INTEGER NOT NULL REFERENCES "Inventory"(id) ON DELETE CASCADE,
--   departmentId INTEGER REFERENCES "Departments"(id) ON DELETE SET NULL,
--   transactionType VARCHAR(50) NOT NULL,  -- 'Transfer', 'Usage', 'Restocking'
--   quantity INTEGER NOT NULL,
--   performedBy INTEGER REFERENCES "Users"(id) ON DELETE SET NULL,
--   createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
--   updatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );

-- -- Trigger for InventoryTransaction Timestamp Updates
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--    NEW."updatedAt" = NOW();
--    RETURN NEW;
-- END;
-- $$ language 'plpgsql';

-- CREATE TRIGGER update_inventory_transaction_timestamp
-- BEFORE UPDATE ON "InventoryTransaction"
-- FOR EACH ROW
-- EXECUTE PROCEDURE update_updated_at_column();

-- -- Create Procurement Requests Table
-- CREATE TABLE "ProcurementRequests" (
--   id SERIAL PRIMARY KEY,
--   title VARCHAR(255) NOT NULL,
--   description TEXT,
--   departmentId INTEGER REFERENCES "Departments"(id),
--   requestedBy INTEGER REFERENCES "Users"(id),
--   priorityLevel VARCHAR(50) NOT NULL,
--   deadlineDate DATE NOT NULL,
--   quantity INTEGER NOT NULL,
--   status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Completed')),
--   approvalId VARCHAR(255)
-- );
