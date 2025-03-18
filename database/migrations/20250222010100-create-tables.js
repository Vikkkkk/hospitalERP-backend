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
      canAccess: { type: Sequelize.JSON, allowNull: false, defaultValue: [] },
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
      minimumStockLevel: { type: Sequelize.INTEGER, allowNull: false },
      restockThreshold: { type: Sequelize.INTEGER, allowNull: false },
      supplier: { type: Sequelize.STRING, allowNull: true },
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

    //Inventory Batch Table
    await queryInterface.createTable("InventoryBatches", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      itemId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Inventory", key: "id" },
        onDelete: "CASCADE",
      },
      quantity: { type: Sequelize.INTEGER, allowNull: false },
      expiryDate: { type: Sequelize.DATE, allowNull: true },
      supplier: { type: Sequelize.STRING, allowNull: true },
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
      deadlineDate: { type: Sequelize.DATE, allowNull: true },
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
      transactiontype: { type: Sequelize.ENUM("Transfer", "Usage", "Restocking", "Procurement", "Checkout"), allowNull: false },
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
      checkoutUser:{type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "Users", key: "id" },
        onDelete: "SET NULL",},
        
    });

    // 🛡️ Department Permissions Table
    await queryInterface.createTable("DepartmentPermissions", {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      departmentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Departments", key: "id" },
        onDelete: "CASCADE",
      },
      module: { type: Sequelize.STRING, allowNull: false },
      canAccess: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
      deletedAt: { type: Sequelize.DATE, allowNull: true },
    });

    // 📄 Inventory Requests Table
    await queryInterface.createTable("InventoryRequests", {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      requestedBy: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Users", key: "id" },
        onDelete: "CASCADE",
      },
      departmentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Departments", key: "id" },
        onDelete: "CASCADE",
      },
      itemName: { type: Sequelize.STRING(255), allowNull: false },
      quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      status: {
        type: Sequelize.ENUM("Pending", "Approved", "Rejected", "Restocking", "Procurement","Completed"),
        allowNull: false,
        defaultValue: "Pending",
      },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("InventoryRequests");
    await queryInterface.dropTable("DepartmentPermissions");
    await queryInterface.dropTable("InventoryTransaction");
    await queryInterface.dropTable("InventoryBatches");
    await queryInterface.dropTable("ProcurementRequests");
    await queryInterface.dropTable("Inventory");
    await queryInterface.dropTable("Users");
    await queryInterface.dropTable("Departments");
  },
};