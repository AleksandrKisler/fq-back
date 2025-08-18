'use strict';

const { v4: uuid } = require('uuid');

function slugify(title) {
  return title.toLowerCase()
    .replace(/[ё]/g,'е')
    .replace(/[^a-z0-9а-я\s-]/g,'')
    .replace(/\s+/g,'-')
    .replace(/-+/g,'-')
    .slice(0,80);
}
function html(p) { return `<p>${p}</p>`; }

module.exports = {
  async up (queryInterface) {
    const base = [
      {
        title: 'Как выбрать туфли под платье: 7 советов стилиста',
        excerpt: 'Практические рекомендации по сочетанию цветов, фактур и высоты каблука.',
        content: html('Подбирая туфли под платье, обращайте внимание на оттенок ткани, фактуру и силуэт.') +
          html('Не бойтесь контрастов, но следуйте правилу: один акцент — одноцелостный образ.'),
        main_image: '/images/articles/how-to-choose-heels.jpg',
        is_active: true
      },
      {
        title: 'Уход за лакированной кожей: что важно знать',
        excerpt: 'Пять простых шагов, чтобы пара служила дольше.',
        content: html('Лакированная кожа любит мягкие средства без спирта.') +
          html('Используйте салфетки из микрофибры и храните обувь в чехлах.'),
        main_image: '/images/articles/patent-care.jpg',
        is_active: true
      },
      {
        title: 'Гид по размерам: как точно подобрать кроссовки',
        excerpt: 'Рассказываем, как измерить стопу и избежать ошибок.',
        content: html('Измеряйте стопу вечером и добавляйте 5–7 мм к длине стельки.') +
          html('Помните, что колодки брендов отличаются.'),
        main_image: '/images/articles/sneaker-sizing.jpg',
        is_active: true
      },
      {
        title: 'Тренды сезона: платформа и устойчивый каблук',
        excerpt: 'Комфорт и высота — без компромиссов.',
        content: html('Платформа возвращается: визуально вытягивает силуэт и разгружает стопу.') +
          html('Устойчивый каблук уместен и в офисе, и на вечерних выходах.'),
        main_image: '/images/articles/trends-platform.jpg',
        is_active: true
      }
    ];

    const today = new Date().toISOString().slice(0,10);
    const items = base.map((a, i) => ({
      title: a.title,
      slug: `${slugify(a.title)}-${uuid().slice(0,6)}`,
      excerpt: a.excerpt,
      content: a.content,
      main_image: a.main_image,
      is_active: a.is_active,
      publish_date: today,
      meta_title: a.title,
      meta_description: a.excerpt,
      created_at: new Date(),
      updated_at: new Date()
    }));

    await queryInterface.bulkInsert('articles', items);
  },

  async down (queryInterface) {
    await queryInterface.bulkDelete('articles', null, {});
  }
};
