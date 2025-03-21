const bcrypt = require('bcrypt');

const MODULES = [
  'dashboard',
  'main-inventory',
  'dept-inventory',
  'procurement',
  'departments',
  'user-management',
];

// 🔧 Construct permissions object
const generateFullPermissions = () => {
  const permissions = {};
  MODULES.forEach((module) => {
    permissions[module] = { read: true, write: true };
  });
  return permissions;
};

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
        permissions: JSON.stringify(generateFullPermissions()), // ✅ New field
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ], { ignoreDuplicates: true });
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('Users', { username: 'rootadmin' }, {});
  },
};