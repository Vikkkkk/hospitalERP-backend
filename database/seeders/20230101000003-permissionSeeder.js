module.exports = {
    up: async (queryInterface) => {
      await queryInterface.bulkInsert('Permissions', [
        { role: 'RootAdmin', module: 'Inventory', departmentId: null, canaccess: true, createdAt: new Date(), updatedAt: new Date() },
        { role: '院长', module: 'Inventory', departmentId: null, canaccess: true, createdAt: new Date(), updatedAt: new Date() }
      ]);
    },
  
    down: async (queryInterface) => {
      await queryInterface.bulkDelete('Permissions', null, {});
    }
  };
  