'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addColumn('orders', 'subtotal_amount', {
        type: Sequelize.DECIMAL(10,2),
        allowNull: false,
        defaultValue: 0
      }, {transaction});

      await queryInterface.addColumn('orders', 'total_discount', {
        type: Sequelize.DECIMAL(10,2),
        allowNull: false,
        defaultValue: 0
      }, {transaction});

      await queryInterface.addColumn('orders', 'customer_email', {
        type: Sequelize.STRING,
        allowNull: true
      }, {transaction});

      await queryInterface.addColumn('orders', 'customer_phone', {
        type: Sequelize.STRING,
        allowNull: true
      }, {transaction});

      await queryInterface.addColumn('orders', 'customer_name', {
        type: Sequelize.STRING,
        allowNull: true
      }, {transaction});

      await queryInterface.addColumn('orders', 'comment', {
        type: Sequelize.TEXT,
        allowNull: true
      }, {transaction});

      await queryInterface.addColumn('orders', 'payment_id', {
        type: Sequelize.STRING,
        allowNull: true
      }, {transaction});

      await queryInterface.addColumn('orders', 'payment_status', {
        type: Sequelize.STRING,
        allowNull: true
      }, {transaction});

      await queryInterface.addColumn('orders', 'payment_method', {
        type: Sequelize.STRING,
        allowNull: true
      }, {transaction});

      await queryInterface.addColumn('orders', 'payment_confirmation_url', {
        type: Sequelize.STRING,
        allowNull: true
      }, {transaction});

      await queryInterface.addColumn('orders', 'payment_data', {
        type: Sequelize.JSONB,
        allowNull: true
      }, {transaction});

      await queryInterface.addColumn('orders', 'currency', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'RUB'
      }, {transaction});

      await queryInterface.addColumn('orders', 'metadata', {
        type: Sequelize.JSONB,
        allowNull: true
      }, {transaction});

      await queryInterface.addColumn('orders', 'paid_at', {
        type: Sequelize.DATE,
        allowNull: true
      }, {transaction});

      await queryInterface.addColumn('orders', 'cancellation_reason', {
        type: Sequelize.STRING,
        allowNull: true
      }, {transaction});

      await queryInterface.changeColumn('orders', 'tracking_number', {
        type: Sequelize.STRING(255),
        allowNull: true
      }, {transaction});

      await queryInterface.addColumn('orders', 'created_at', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now')
      }, {transaction});

      await queryInterface.addColumn('orders', 'updated_at', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now')
      }, {transaction});
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.removeColumn('orders', 'subtotal_amount', {transaction});
      await queryInterface.removeColumn('orders', 'total_discount', {transaction});
      await queryInterface.removeColumn('orders', 'customer_email', {transaction});
      await queryInterface.removeColumn('orders', 'customer_phone', {transaction});
      await queryInterface.removeColumn('orders', 'customer_name', {transaction});
      await queryInterface.removeColumn('orders', 'comment', {transaction});
      await queryInterface.removeColumn('orders', 'payment_id', {transaction});
      await queryInterface.removeColumn('orders', 'payment_status', {transaction});
      await queryInterface.removeColumn('orders', 'payment_method', {transaction});
      await queryInterface.removeColumn('orders', 'payment_confirmation_url', {transaction});
      await queryInterface.removeColumn('orders', 'payment_data', {transaction});
      await queryInterface.removeColumn('orders', 'currency', {transaction});
      await queryInterface.removeColumn('orders', 'metadata', {transaction});
      await queryInterface.removeColumn('orders', 'paid_at', {transaction});
      await queryInterface.removeColumn('orders', 'cancellation_reason', {transaction});
      await queryInterface.removeColumn('orders', 'created_at', {transaction});
      await queryInterface.removeColumn('orders', 'updated_at', {transaction});

      await queryInterface.changeColumn('orders', 'tracking_number', {
        type: Sequelize.STRING(255),
        allowNull: false
      }, {transaction});
    });
  }
};
