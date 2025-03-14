"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 🏢 Departments Table
    await queryInterface.createTable("Departments", {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      name: { type: Sequelize.STRING, allowNull: false },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
      deletedAt: { allowNull: true, type: Sequelize.DATE },
    });

    // 👤 Users Table
    await queryInterface.createTable("Users", {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      username: { type: Sequelize.STRING, allowNull: false, unique: true },
      role: { type: Sequelize.STRING, allowNull: false },
      departmentId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "Departments", key: "id" },
        onDelete: "SET NULL",
      },
      password_hash: { type: Sequelize.STRING, allowNull: false },
      isglobalrole: { type: Sequelize.BOOLEAN, defaultValue: false },
      wecom_userid: { type: Sequelize.STRING, allowNull: true, unique: true },
      canAccess: { type: Sequelize.JSON, allowNull: false, defaultValue: [] }, // ✅ FIXED DEFAULT VALUE
      deletedAt: { type: Sequelize.DATE, allowNull: true },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
    });

    // 🔄 Add `headId` to `Departments` after `Users` table exists
    await queryInterface.addColumn("Departments", "headId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: "Users", key: "id" },
      onDelete: "SET NULL",
    });

    // 📦 Inventory Table
    await queryInterface.createTable("Inventory", {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      itemname: { type: Sequelize.STRING, allowNull: false },
      category: { type: Sequelize.STRING, allowNull: false },
      unit: { type: Sequelize.STRING, allowNull: false },
      quantity: { type: Sequelize.INTEGER, allowNull: false },
      minimumStockLevel: { type: Sequelize.INTEGER, allowNull: false },
      restockThreshold: { type: Sequelize.INTEGER, allowNull: false },
      supplier: { type: Sequelize.STRING, allowNull: true },
      expiryDate: { type: Sequelize.DATE, allowNull: true },
      purchaseDate: { type: Sequelize.DATE, allowNull: true },
      departmentId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "Departments", key: "id" },
        onDelete: "SET NULL",
      },
      lastRestocked: { type: Sequelize.DATE, allowNull: true },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
    });

    // 📑 Procurement Requests Table
    await queryInterface.createTable("ProcurementRequests", {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      title: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      departmentId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "Departments", key: "id" },
        onDelete: "SET NULL",
      },
      requestedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "Users", key: "id" },
        onDelete: "SET NULL",
      },
      deadlineDate:{type: Sequelize.DATE,allowNull:true},
      priorityLevel: { type: Sequelize.STRING, allowNull: false },
      quantity: { type: Sequelize.INTEGER, allowNull: false },
      status: { type: Sequelize.STRING, defaultValue: "Pending" },
      approvalId: { type: Sequelize.STRING, allowNull: true },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
      deletedAt: { type: Sequelize.DATE, allowNull: true },
    });

    // 🔄 Inventory Transactions Table
    await queryInterface.createTable("InventoryTransaction", {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      itemname: { type: Sequelize.STRING, allowNull: false },
      inventoryid: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Inventory", key: "id" },
        onDelete: "CASCADE",
      },
      departmentId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "Departments", key: "id" },
        onDelete: "SET NULL",
      },
      transactiontype: { type: Sequelize.STRING, allowNull: false },
      quantity: { type: Sequelize.INTEGER, allowNull: false },
      performedby: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "Users", key: "id" },
        onDelete: "SET NULL",
      },
      category: { type: Sequelize.STRING, allowNull: false },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
      deletedAt: { type: Sequelize.DATE, allowNull: true },
    });

    // ❌ Remove `Permissions` Table if Not Needed
    await queryInterface.dropTable("Permissions");
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("InventoryTransaction");
    await queryInterface.dropTable("ProcurementRequests");
    await queryInterface.dropTable("Inventory");
    await queryInterface.dropTable("Users");
    await queryInterface.dropTable("Departments");

    // ✅ Drop ENUM if exists
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS enum_InventoryTransaction_transactiontype;");
  },
};