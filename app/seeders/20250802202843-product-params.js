'use strict';

const { v4: uuidv4 } = require('uuid');

// Список возможных характеристик для обуви с примерами значений
const parametersOptions = [
  {
    title: "Материал верха",
    values: ["натуральная кожа", "замша", "текстиль", "искусственная кожа", "комбинированный"]
  },
  {
    title: "Материал подкладки",
    values: ["натуральная кожа", "текстиль", "искусственный мех", "синтетика"]
  },
  {
    title: "Материал подошвы",
    values: ["резина", "полиуретан", "термополиуретан", "ЭВА", "комбинированная"]
  },
  {
    title: "Высота каблука",
    values: ["2 см", "3 см", "4 см", "5 см", "6 см", "7 см", "8 см", "плоская подошва"]
  },
  {
    title: "Сезон",
    values: ["лето", "зима", "демисезон", "всесезон"]
  },
  {
    title: "Тип застежки",
    values: ["шнуровка", "молния", "липучки", "без застежки", "резинка", "пуговицы"]
  },
  {
    title: "Страна производства",
    values: ["Китай", "Вьетнам", "Италия", "Турция", "Португалия", "Россия"]
  },
  {
    title: "Особенности",
    values: ["водоотталкивающая пропитка", "ортопедическая стелька", "память формы", "утепленные"]
  }
];

// Генерация параметров для всех продуктов
const generateProductParams = (products) => {
  const productParams = [];

  products.forEach(product => {
    // Случайное количество параметров (от 3 до 7)
    const paramsCount = Math.floor(Math.random() * 5) + 3;

    // Перемешиваем массив характеристик
    const shuffledParams = [...parametersOptions]
      .sort(() => 0.5 - Math.random())
      .slice(0, paramsCount);

    // Добавляем параметры для текущего продукта
    shuffledParams.forEach(param => {
      const randomValue = param.values[
        Math.floor(Math.random() * param.values.length)
        ];

      productParams.push({
        product_id: product.id,
        title: param.title,
        value: randomValue,
        created_at: new Date(),
        updated_at: new Date()
      });
    });
  });

  return productParams;
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const products = await queryInterface.sequelize.query(
      'SELECT id FROM "products";',
      { type: Sequelize.QueryTypes.SELECT }
    );

    const params = generateProductParams(products);
    return queryInterface.bulkInsert('params', params, {});
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('params', null, {});
  }
};
