'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
     CREATE TABLE "users"(
    "id" BIGSERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "birthday" DATE NOT NULL,
    "email" VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE "statuses"(
    "id" BIGSERIAL PRIMARY KEY,
    "title" VARCHAR(255) NOT NULL
);

CREATE TABLE "orders"(
    "id" BIGSERIAL PRIMARY KEY,
    "slug" VARCHAR(255) NOT NULL UNIQUE,
    "user_id" BIGINT NOT NULL REFERENCES "users"("id"),
    "status_id" BIGINT NOT NULL REFERENCES "statuses"("id"),
    "order_date" TIMESTAMP(0) WITHOUT TIME ZONE,
    "total_amount" DECIMAL(8, 2) NOT NULL,
    "delivery_method" VARCHAR(255) NOT NULL,
    "delivery_address" TEXT NOT NULL,
    "tracking_number" VARCHAR(255) NOT NULL,
    "delivery_cost" DECIMAL(8, 2) NOT NULL
);

CREATE TABLE "categories"(
    "id" BIGSERIAL PRIMARY KEY,
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE "products"(
    "id" BIGSERIAL PRIMARY KEY,
    "sku" VARCHAR(255) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "category_id" BIGINT NOT NULL REFERENCES "categories"("id"),
    "description" TEXT NOT NULL,
    "slug" VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE "discounts"(
    "id" BIGSERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(255) NOT NULL CHECK ("type" IN('percent', 'fixed')),
    "value" DECIMAL(8, 2) NOT NULL,
    "start_date" TIMESTAMP(0) WITH TIME ZONE NOT NULL,
    "end_date" TIMESTAMP(0) WITH TIME ZONE NOT NULL,
    "max_users" BIGINT NOT NULL,
    "min_order_amount" DECIMAL(8, 2) NOT NULL,
    "is_active" BOOLEAN NOT NULL
);

CREATE TABLE "product_discounts"(
    "product_id" BIGINT NOT NULL REFERENCES "products"("id"),
    "discount_id" BIGINT NOT NULL REFERENCES "discounts"("id"),
    PRIMARY KEY ("product_id", "discount_id")
);

CREATE TABLE "attributes"(
    "id" BIGSERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE "attribute_values"(
    "id" BIGSERIAL PRIMARY KEY,
    "attribute_id" BIGINT NOT NULL REFERENCES "attributes"("id"),
    "value" VARCHAR(255) NOT NULL,
    "hex_code" VARCHAR(255)
);

CREATE TABLE "product_variations"(
    "id" BIGSERIAL PRIMARY KEY,
    "product_id" BIGINT NOT NULL REFERENCES "products"("id"),
    "sku" VARCHAR(255) NOT NULL UNIQUE,
    "price" DECIMAL(10, 2) NOT NULL,
    "stock_quantity" BIGINT NOT NULL
);

CREATE TABLE "variation_attributes"(
    "variation_id" BIGINT NOT NULL REFERENCES "product_variations"("id"),
    "value_id" BIGINT NOT NULL REFERENCES "attribute_values"("id"),
    PRIMARY KEY ("variation_id", "value_id")
);

CREATE TABLE "collections"(
    "id" BIGSERIAL PRIMARY KEY,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL
);

CREATE TABLE "collection_products"(
    "collection_id" BIGINT NOT NULL REFERENCES "collections"("id"),
    "product_id" BIGINT NOT NULL REFERENCES "products"("id"),
    PRIMARY KEY ("collection_id", "product_id")
);

CREATE TABLE "cart"(
    "id" BIGSERIAL PRIMARY KEY,
    "user_id" BIGINT NOT NULL REFERENCES "users"("id"),
    "product_id" BIGINT NOT NULL REFERENCES "products"("id"),
    "variation_id" BIGINT NOT NULL REFERENCES "product_variations"("id"),
    "quantity" BIGINT NOT NULL,
    "added_at" TIMESTAMP(0) WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "price_at_add" DECIMAL(8, 2) NOT NULL,
    "discount_at_add" DECIMAL(8, 2) NOT NULL,
    "attribute" JSON NOT NULL
);

CREATE TABLE "wishlist"(
    "id" BIGSERIAL PRIMARY KEY,
    "user_id" BIGINT NOT NULL REFERENCES "users"("id"),
    "product_id" BIGINT NOT NULL REFERENCES "products"("id"),
    "variation_id" BIGINT NOT NULL REFERENCES "product_variations"("id"),
    "added_at" TIMESTAMP(0) WITH TIME ZONE NOT NULL DEFAULT NOW()
);
    `);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropAllTables();
  }
};
