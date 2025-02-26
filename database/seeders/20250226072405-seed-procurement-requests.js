module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('ProcurementRequests', [
      {
        title: '采购医用口罩',
        description: '用于医院工作人员的日常防护',
        departmentid: 1, // 假设 1 代表后勤部
        requestedby: 3, // 例如，logistics_head 提交的申请
        prioritylevel: 'High',
        deadlinedate: new Date('2025-03-01'),
        quantity: 5000,
        status: 'Pending',
        approvalId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: '购置消毒液',
        description: '每日清洁消毒必需品',
        departmentid: 2, // 假设 2 代表财务部
        requestedby: 4, // finance_head 提交
        prioritylevel: 'Medium',
        deadlinedate: new Date('2025-03-05'),
        quantity: 200,
        status: 'Pending',
        approvalId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('ProcurementRequests', null, {});
  }
};
