const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface) => {
    const hashedRootPassword = await bcrypt.hash('root123', 10);
    const hashedAdminPassword = await bcrypt.hash('yz123', 10);

    await queryInterface.bulkInsert('Users', [
      {
        username: 'rootadmin',
        password_hash: hashedRootPassword,
        role: 'RootAdmin',
        departmentId: null,
        isglobalrole: true,
        wecom_userid: null,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        username: '院长',
        password_hash: hashedAdminPassword,
        role: 'Admin',
        departmentId: null,
        isglobalrole: true,
        wecom_userid: null,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ],{ignoreDuplicates: true});
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('Users', null, {});
  },
};
