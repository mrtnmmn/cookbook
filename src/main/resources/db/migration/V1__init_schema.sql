-- CookBook initial schema
-- Flyway applies this automatically on application startup.

CREATE TABLE recipes
(
    id            BIGSERIAL PRIMARY KEY,
    title         VARCHAR(200) NOT NULL,
    description   TEXT,
    instructions  TEXT,
    servings      INTEGER,
    prep_minutes  INTEGER,
    cook_minutes  INTEGER,
    -- Postgres-specific perks: free-form tags and flexible nutrition data
    tags          TEXT[]       NOT NULL DEFAULT '{}',
    nutrition     JSONB,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE ingredients
(
    id   BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE
);

CREATE TABLE recipe_ingredients
(
    recipe_id     BIGINT       NOT NULL REFERENCES recipes (id) ON DELETE CASCADE,
    ingredient_id BIGINT       NOT NULL REFERENCES ingredients (id) ON DELETE RESTRICT,
    quantity      NUMERIC(10, 2),
    unit          VARCHAR(30),
    position      INTEGER      NOT NULL DEFAULT 0,
    PRIMARY KEY (recipe_id, ingredient_id)
);

-- Full-text search over title + description (no Elasticsearch needed)
CREATE INDEX idx_recipes_search
    ON recipes USING GIN (to_tsvector('english', title || ' ' || coalesce(description, '')));

CREATE INDEX idx_recipes_tags ON recipes USING GIN (tags);
CREATE INDEX idx_recipe_ingredients_ingredient ON recipe_ingredients (ingredient_id);

