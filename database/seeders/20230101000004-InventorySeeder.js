module.exports = {
    up: async (queryInterface) => {
      await queryInterface.bulkInsert('Inventory', [
        { 
          itemname: '医用手套', 
          category: 'Medical Supply', 
          unit: 'pcs',
          quantity: 500, 
          minimumStockLevel: 50, 
          restockThreshold: 5,
          departmentId: null, 
          createdAt: new Date(), 
          updatedAt: new Date() 
        }
      ]);
    },
  
    down: async (queryInterface) => {
      await queryInterface.bulkDelete('Inventory', null, {});
    }
  };
  