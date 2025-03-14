const bcrypt = require('bcrypt');

const MODULES = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'procurement', label: 'Procurement' },
  { key: 'departments', label: 'Department Management' },
  { key: 'user-management', label: 'User Management' },
];

module.exports = {
  up: async (queryInterface) => {
    const hashedRootPassword = await bcrypt.hash('root123', 10);

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
        canAccess: JSON.stringify(MODULES.map(module => module.key)), // ✅ Convert array to JSON
      }
    ], { ignoreDuplicates: true });
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('Users', { username: 'rootadmin' }, {});
  },
};