// database/seeders/20230101000001-default-data.js

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('Departments', [
      { name: '后勤部', createdAt: new Date(), updatedAt: new Date() },
      { name: '财务部', createdAt: new Date(), updatedAt: new Date() },
      { name: '采购部', createdAt: new Date(), updatedAt: new Date() },
    ]);

    await queryInterface.bulkInsert('Users', [
      {
        username: 'rootadmin',
        role: 'RootAdmin',
        departmentid: null,
        password: '$2b$10$encryptedRootAdminPassword', // Hashed password
        isglobalrole: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        username: '院长',
        role: 'Admin',
        departmentid: null,
        password: '$2b$10$encryptedAdminPassword',
        isglobalrole: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        username: 'logistics_head',
        role: '部长',
        departmentid: 1, // 后勤部
        password: '$2b$10$encryptedLogisticsHeadPassword',
        isglobalrole: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        username: 'finance_head',
        role: '部长',
        departmentid: 2, // 财务部
        password: '$2b$10$encryptedFinanceHeadPassword',
        isglobalrole: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('Departments', null, {});
    await queryInterface.bulkDelete('Users', null, {});
  },
};
