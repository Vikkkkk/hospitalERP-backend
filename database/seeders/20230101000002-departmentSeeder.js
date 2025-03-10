module.exports = {
    up: async (queryInterface) => {
      await queryInterface.bulkInsert('Departments', [
        { name: '后勤部', createdAt: new Date(), updatedAt: new Date() },
        { name: '财务部', createdAt: new Date(), updatedAt: new Date() },
        { name: '采购部', createdAt: new Date(), updatedAt: new Date() }
      ]);
    },
  
    down: async (queryInterface) => {
      await queryInterface.bulkDelete('Departments', null, {});
    }
  };
  