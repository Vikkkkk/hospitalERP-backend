module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ProcurementRequests', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      departmentid: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      requestedby: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      prioritylevel: {
        type: Sequelize.ENUM('Low', 'Medium', 'High'),
        allowNull: false
      },
      deadlinedate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('Pending', 'Approved', 'Rejected', 'Completed'),
        allowNull: false,
        defaultValue: 'Pending'
      },
      approvalId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ProcurementRequests');
  }
};
