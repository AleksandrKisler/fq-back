const BLOCK_TYPES = ['hero', 'collage', 'gallery', 'number-highlight', 'team', 'statement'];

const isObject = (v) => v && typeof v === 'object' && !Array.isArray(v);
const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;
const isHtmlString = (v) => typeof v === 'string';

const sanitizeString = (v) => (typeof v === 'string' ? v.trim() : v);

const sanitizeImageRef = (value) => {
  if (!value) return null;
  if (typeof value === 'string') {
    const url = value.trim();
    return url ? { url } : null;
  }
  if (isObject(value)) {
    const ref = {};
    if (value.id !== undefined) ref.id = value.id;
    if (isNonEmptyString(value.url)) ref.url = value.url.trim();
    if (isNonEmptyString(value.alt)) ref.alt = value.alt.trim();
    if (Object.keys(ref).length === 0) return null;
    return ref;
  }
  return null;
};

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const validators = {
  hero(block, path, errors) {
    if (!isNonEmptyString(block.title)) {
      errors.push(`${path}.title: требуется непустая строка`);
    }
    if (block.subtitle !== undefined && !isNonEmptyString(block.subtitle)) {
      errors.push(`${path}.subtitle: ожидается строка`);
    }
    if (block.descriptionHtml !== undefined && !isHtmlString(block.descriptionHtml)) {
      errors.push(`${path}.descriptionHtml: ожидается HTML-строка`);
    }
    if (block.backgroundImage !== undefined && !sanitizeImageRef(block.backgroundImage)) {
      errors.push(`${path}.backgroundImage: требуется ссылка на изображение`);
    }
    if (block.buttons !== undefined) {
      if (!Array.isArray(block.buttons)) {
        errors.push(`${path}.buttons: ожидается массив`);
      } else {
        block.buttons.forEach((btn, idx) => {
          const btnPath = `${path}.buttons[${idx}]`;
          if (!isObject(btn)) {
            errors.push(`${btnPath}: ожидается объект`);
            return;
          }
          if (!isNonEmptyString(btn.label)) {
            errors.push(`${btnPath}.label: требуется непустая строка`);
          }
          if (!isNonEmptyString(btn.url)) {
            errors.push(`${btnPath}.url: требуется непустая строка`);
          }
        });
      }
    }
  },
  collage(block, path, errors) {
    const items = ensureArray(block.items);
    if (!items.length) {
      errors.push(`${path}.items: требуется хотя бы один элемент`);
    }
    items.forEach((item, idx) => {
      const itemPath = `${path}.items[${idx}]`;
      if (!isObject(item)) {
        errors.push(`${itemPath}: ожидается объект`);
        return;
      }
      if (!sanitizeImageRef(item.image)) {
        errors.push(`${itemPath}.image: требуется ссылка на изображение`);
      }
      if (item.captionHtml !== undefined && !isHtmlString(item.captionHtml)) {
        errors.push(`${itemPath}.captionHtml: ожидается HTML-строка`);
      }
    });
    if (block.title !== undefined && !isNonEmptyString(block.title)) {
      errors.push(`${path}.title: ожидается строка`);
    }
  },
  gallery(block, path, errors) {
    const images = ensureArray(block.images);
    if (!images.length) {
      errors.push(`${path}.images: требуется хотя бы одно изображение`);
    }
    images.forEach((img, idx) => {
      if (!sanitizeImageRef(img)) {
        errors.push(`${path}.images[${idx}]: требуется ссылка на изображение`);
      }
    });
    if (block.title !== undefined && !isNonEmptyString(block.title)) {
      errors.push(`${path}.title: ожидается строка`);
    }
    if (block.descriptionHtml !== undefined && !isHtmlString(block.descriptionHtml)) {
      errors.push(`${path}.descriptionHtml: ожидается HTML-строка`);
    }
  },
  'number-highlight'(block, path, errors) {
    const items = ensureArray(block.items);
    if (!items.length) {
      errors.push(`${path}.items: требуется хотя бы одно значение`);
    }
    items.forEach((item, idx) => {
      const itemPath = `${path}.items[${idx}]`;
      if (!isObject(item)) {
        errors.push(`${itemPath}: ожидается объект`);
        return;
      }
      if (item.value === undefined || item.value === null || (typeof item.value !== 'number' && !isNonEmptyString(item.value))) {
        errors.push(`${itemPath}.value: требуется число или строка`);
      }
      if (!isNonEmptyString(item.label)) {
        errors.push(`${itemPath}.label: требуется непустая строка`);
      }
      if (item.descriptionHtml !== undefined && !isHtmlString(item.descriptionHtml)) {
        errors.push(`${itemPath}.descriptionHtml: ожидается HTML-строка`);
      }
    });
    if (block.title !== undefined && !isNonEmptyString(block.title)) {
      errors.push(`${path}.title: ожидается строка`);
    }
  },
  team(block, path, errors) {
    const members = ensureArray(block.members);
    if (!members.length) {
      errors.push(`${path}.members: требуется хотя бы один участник`);
    }
    members.forEach((member, idx) => {
      const memberPath = `${path}.members[${idx}]`;
      if (!isObject(member)) {
        errors.push(`${memberPath}: ожидается объект`);
        return;
      }
      if (!isNonEmptyString(member.name)) {
        errors.push(`${memberPath}.name: требуется непустая строка`);
      }
      if (member.role !== undefined && !isNonEmptyString(member.role)) {
        errors.push(`${memberPath}.role: ожидается строка`);
      }
      if (member.bioHtml !== undefined && !isHtmlString(member.bioHtml)) {
        errors.push(`${memberPath}.bioHtml: ожидается HTML-строка`);
      }
      if (member.photo !== undefined && !sanitizeImageRef(member.photo)) {
        errors.push(`${memberPath}.photo: требуется ссылка на изображение`);
      }
    });
    if (block.title !== undefined && !isNonEmptyString(block.title)) {
      errors.push(`${path}.title: ожидается строка`);
    }
  },
  statement(block, path, errors) {
    if (!isHtmlString(block.html) || !block.html.trim()) {
      errors.push(`${path}.html: требуется HTML-строка`);
    }
    if (block.title !== undefined && !isNonEmptyString(block.title)) {
      errors.push(`${path}.title: ожидается строка`);
    }
    if (block.accent !== undefined && !isNonEmptyString(block.accent)) {
      errors.push(`${path}.accent: ожидается строка`);
    }
  },
};

const validateBlocks = (blocks) => {
  const errors = [];
  if (!Array.isArray(blocks)) {
    return ['Поле blocks должно быть массивом'];
  }
  blocks.forEach((block, index) => {
    const path = `blocks[${index}]`;
    if (!isObject(block)) {
      errors.push(`${path}: ожидается объект блока`);
      return;
    }
    if (!isNonEmptyString(block.type)) {
      errors.push(`${path}.type: требуется тип блока`);
      return;
    }
    if (!BLOCK_TYPES.includes(block.type)) {
      errors.push(`${path}.type: недопустимый тип "${block.type}"`);
      return;
    }
    validators[block.type](block, path, errors);
  });
  return errors;
};

const sanitizeButtons = (buttons) => {
  if (!Array.isArray(buttons)) return undefined;
  const sanitized = buttons
    .map((btn) => {
      if (!isObject(btn)) return null;
      const label = sanitizeString(btn.label);
      const url = sanitizeString(btn.url);
      if (!label || !url) return null;
      const result = { label, url };
      if (btn.style && isNonEmptyString(btn.style)) {
        result.style = btn.style.trim();
      }
      return result;
    })
    .filter(Boolean);
  return sanitized.length ? sanitized : undefined;
};

const sanitizeBlocks = (blocks, sanitizeHtml, sanitizeOptions) => {
  if (!Array.isArray(blocks)) return [];
  return blocks.map((block) => {
    if (!isObject(block)) return null;
    const base = { type: block.type };
    switch (block.type) {
      case 'hero': {
        if (isNonEmptyString(block.title)) base.title = block.title.trim();
        if (isNonEmptyString(block.subtitle)) base.subtitle = block.subtitle.trim();
        if (isHtmlString(block.descriptionHtml)) {
          base.descriptionHtml = sanitizeHtml(block.descriptionHtml, sanitizeOptions);
        }
        const image = sanitizeImageRef(block.backgroundImage);
        if (image) base.backgroundImage = image;
        const buttons = sanitizeButtons(block.buttons);
        if (buttons) base.buttons = buttons;
        break;
      }
      case 'collage': {
        if (isNonEmptyString(block.title)) base.title = block.title.trim();
        base.items = ensureArray(block.items)
          .map((item) => {
            if (!isObject(item)) return null;
            const image = sanitizeImageRef(item.image);
            if (!image) return null;
            const next = { image };
            if (isHtmlString(item.captionHtml)) {
              next.captionHtml = sanitizeHtml(item.captionHtml, sanitizeOptions);
            }
            return next;
          })
          .filter(Boolean);
        break;
      }
      case 'gallery': {
        if (isNonEmptyString(block.title)) base.title = block.title.trim();
        if (isHtmlString(block.descriptionHtml)) {
          base.descriptionHtml = sanitizeHtml(block.descriptionHtml, sanitizeOptions);
        }
        base.images = ensureArray(block.images)
          .map((img) => sanitizeImageRef(img))
          .filter(Boolean);
        break;
      }
      case 'number-highlight': {
        if (isNonEmptyString(block.title)) base.title = block.title.trim();
        base.items = ensureArray(block.items)
          .map((item) => {
            if (!isObject(item)) return null;
            if (item.value === undefined || item.value === null) return null;
            if (!isNonEmptyString(item.label) && typeof item.label !== 'number') return null;
            const next = {
              value: typeof item.value === 'number' ? item.value : String(item.value).trim(),
              label: typeof item.label === 'number' ? String(item.label) : item.label.trim(),
            };
            if (isHtmlString(item.descriptionHtml)) {
              next.descriptionHtml = sanitizeHtml(item.descriptionHtml, sanitizeOptions);
            }
            return next;
          })
          .filter(Boolean);
        break;
      }
      case 'team': {
        if (isNonEmptyString(block.title)) base.title = block.title.trim();
        base.members = ensureArray(block.members)
          .map((member) => {
            if (!isObject(member)) return null;
            if (!isNonEmptyString(member.name)) return null;
            const next = { name: member.name.trim() };
            if (isNonEmptyString(member.role)) next.role = member.role.trim();
            if (isHtmlString(member.bioHtml)) {
              next.bioHtml = sanitizeHtml(member.bioHtml, sanitizeOptions);
            }
            const photo = sanitizeImageRef(member.photo);
            if (photo) next.photo = photo;
            return next;
          })
          .filter(Boolean);
        break;
      }
      case 'statement': {
        if (isNonEmptyString(block.title)) base.title = block.title.trim();
        if (isNonEmptyString(block.accent)) base.accent = block.accent.trim();
        base.html = sanitizeHtml(block.html ?? '', sanitizeOptions);
        break;
      }
      default:
        return null;
    }
    return base;
  }).filter(Boolean);
};

module.exports = {
  BLOCK_TYPES,
  validateBlocks,
  sanitizeBlocks,
  sanitizeImageRef,
};
