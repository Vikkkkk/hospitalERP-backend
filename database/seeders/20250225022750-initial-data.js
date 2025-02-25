'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Insert Departments
    await queryInterface.bulkInsert('Departments', [
      { name: '办公室', createdAt: new Date(), updatedAt: new Date() },
      { name: '人力资源部', createdAt: new Date(), updatedAt: new Date() },
      { name: '财务部', createdAt: new Date(), updatedAt: new Date() },
      { name: '医务医保科', createdAt: new Date(), updatedAt: new Date() },
      { name: '护理部', createdAt: new Date(), updatedAt: new Date() },
      { name: '科教科', createdAt: new Date(), updatedAt: new Date() },
      { name: '信息科', createdAt: new Date(), updatedAt: new Date() },
      { name: '后勤部', createdAt: new Date(), updatedAt: new Date() },
      { name: '运营管理部', createdAt: new Date(), updatedAt: new Date() },
      { name: '采购部', createdAt: new Date(), updatedAt: new Date() },
    ]);

    // Insert Users (including RootAdmin)
    await queryInterface.bulkInsert('Users', [
      { username: 'rootadmin', password: 'root123', role: 'RootAdmin', departmentid: null, isglobalrole: true, createdAt: new Date(), updatedAt: new Date() },
      { username: 'yuanzhang', password: 'yz123', role: '院长', departmentid: null, isglobalrole: true, createdAt: new Date(), updatedAt: new Date() },
      { username: 'vice1', password: 'vice123', role: '副院长', departmentid: null, isglobalrole: true, createdAt: new Date(), updatedAt: new Date() },
      { username: 'logisticshead', password: 'logi123', role: '部长', departmentid: 8, isglobalrole: false, createdAt: new Date(), updatedAt: new Date() },
      { username: 'procurementhead', password: 'proc123', role: '部长', departmentid: 10, isglobalrole: false, createdAt: new Date(), updatedAt: new Date() },
    ]);

    // Insert Permissions
    await queryInterface.bulkInsert('Permissions', [
      { role: 'RootAdmin', module: 'Inventory', departmentid: null, canaccess: true, createdAt: new Date(), updatedAt: new Date() },
      { role: '院长', module: 'Inventory', departmentid: null, canaccess: true, createdAt: new Date(), updatedAt: new Date() },
      { role: '部长', module: 'Inventory', departmentid: 10, canaccess: true, createdAt: new Date(), updatedAt: new Date() },
      { role: '职员', module: 'Inventory', departmentid: 8, canaccess: true, createdAt: new Date(), updatedAt: new Date() },
    ]);

    // Insert Inventory
    await queryInterface.bulkInsert('Inventory', [
      { itemname: '医用手套', quantity: 500, minimumstocklevel: 50, departmentid: 8, lastRestocked: new Date(), createdAt: new Date(), updatedAt: new Date() },
      { itemname: '口罩', quantity: 1000, minimumstocklevel: 200, departmentid: 8, lastRestocked: new Date(), createdAt: new Date(), updatedAt: new Date() },
      { itemname: '注射器', quantity: 800, minimumstocklevel: 100, departmentid: 8, lastRestocked: new Date(), createdAt: new Date(), updatedAt: new Date() },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Departments', null, {});
    await queryInterface.bulkDelete('Users', null, {});
    await queryInterface.bulkDelete('Permissions', null, {});
    await queryInterface.bulkDelete('Inventory', null, {});
  },
};
