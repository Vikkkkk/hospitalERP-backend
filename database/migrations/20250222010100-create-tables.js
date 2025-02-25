

module.exports = {
    up: async (queryInterface, Sequelize) => {
      await queryInterface.createTable('Departments', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE,
      });
  
      await queryInterface.createTable('Users', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        role: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        departmentId: {
          type: Sequelize.INTEGER,
          references: {
            model: 'Departments',
            key: 'id',
          },
        },
        password: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE,
      });
  
      await queryInterface.createTable('Inventory', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        itemName: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        quantity: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        minimumStockLevel: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        departmentId: {
          type: Sequelize.INTEGER,
          references: {
            model: 'Departments',
            key: 'id',
          },
        },
        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE,
      });
  
      await queryInterface.createTable('ProcurementRequests', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        title: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        description: {
          type: Sequelize.TEXT,
        },
        departmentId: {
          type: Sequelize.INTEGER,
          references: {
            model: 'Departments',
            key: 'id',
          },
        },
        requestedBy: {
          type: Sequelize.INTEGER,
          references: {
            model: 'Users',
            key: 'id',
          },
        },
        priorityLevel: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        deadlineDate: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        quantity: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        status: {
          type: Sequelize.STRING,
          defaultValue: 'Pending',
        },
        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE,
      });
    },
  
    down: async (queryInterface) => {
      await queryInterface.dropTable('ProcurementRequests');
      await queryInterface.dropTable('Inventory');
      await queryInterface.dropTable('Users');
      await queryInterface.dropTable('Departments');
    },
  };
  