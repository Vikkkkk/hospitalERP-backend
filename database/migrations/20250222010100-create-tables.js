module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 🏢 Departments Table
    await queryInterface.createTable('Departments', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      name: { type: Sequelize.STRING, allowNull: false },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });

    // 👤 Users Table
    await queryInterface.createTable('Users', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      username: { type: Sequelize.STRING, allowNull: false, unique: true },
      role: { type: Sequelize.STRING, allowNull: false },
      departmentId: { type: Sequelize.INTEGER, references: { model: 'Departments', key: 'id' }, onDelete: 'SET NULL' },
      password_hash: { type: Sequelize.STRING, allowNull: false },
      isglobalrole: { type: Sequelize.BOOLEAN, defaultValue: false },
      wecom_userid: { type: Sequelize.STRING, allowNull: true, unique: true },
      deletedAt: { type: Sequelize.DATE, allowNull: true },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });

    // 📦 Inventory Table
    await queryInterface.createTable('Inventory', {
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
      departmentId: { type: Sequelize.INTEGER, references: { model: 'Departments', key: 'id' }, onDelete: 'SET NULL' },
      lastRestocked: Sequelize.DATE,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });

    // 📑 Procurement Requests Table
    await queryInterface.createTable('ProcurementRequests', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      title: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT },
      departmentId: { type: Sequelize.INTEGER, references: { model: 'Departments', key: 'id' }, onDelete: 'SET NULL' },
      requestedBy: { type: Sequelize.INTEGER, references: { model: 'Users', key: 'id' }, onDelete: 'SET NULL' },
      priorityLevel: { type: Sequelize.STRING, allowNull: false },
      deadlineDate: { type: Sequelize.DATE, allowNull: false },
      quantity: { type: Sequelize.INTEGER, allowNull: false },
      status: { type: Sequelize.STRING, defaultValue: 'Pending' },
      approvalId: { type: Sequelize.STRING, allowNull: true },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });

    // 🔄 Inventory Transactions Table
    await queryInterface.createTable('InventoryTransaction', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      itemname:{ type: Sequelize.STRING, allowNull: false,},
      inventoryid: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Inventory', key: 'id' }, onDelete: 'CASCADE' },
      departmentId: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'Departments', key: 'id' }, onDelete: 'SET NULL' },
      transactiontype: { type: Sequelize.STRING, allowNull: false }, // Changed from ENUM
      quantity: { type: Sequelize.INTEGER, allowNull: false },
      performedby: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'Users', key: 'id' }, onDelete: 'SET NULL' },
      category:{ type: Sequelize.STRING, allowNull: false,},
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
      deletedAt: { type: Sequelize.DATE, allowNull: true },
    });

    // 🔐 Permissions Table
    await queryInterface.createTable('Permissions', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      role: { type: Sequelize.STRING, allowNull: false },
      module: { type: Sequelize.STRING, allowNull: false },
      canaccess: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      departmentId: { type: Sequelize.INTEGER, references: { model: 'Departments', key: 'id' }, onDelete: 'SET NULL' },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Permissions');
    await queryInterface.dropTable('InventoryTransaction');
    await queryInterface.dropTable('ProcurementRequests');
    await queryInterface.dropTable('Inventory');
    await queryInterface.dropTable('Users');
    await queryInterface.dropTable('Departments');

    // ✅ If ENUM was used earlier, remove it
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS enum_InventoryTransaction_transactiontype;");
  },
};
