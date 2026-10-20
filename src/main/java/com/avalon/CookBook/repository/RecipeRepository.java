package com.avalon.CookBook.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.avalon.CookBook.domain.Recipe;

public interface RecipeRepository extends JpaRepository<Recipe, Long> {

    boolean existsByTitleIgnoreCase(String title);

    @EntityGraph(attributePaths = { "ingredients", "ingredients.ingredient" })
    Optional<Recipe> findWithIngredientsById(Long id);

    @Override
    @EntityGraph(attributePaths = { "ingredients", "ingredients.ingredient" })
    List<Recipe> findAll();

    /**
     * Ids of the recipes whose title or any of their tags contains the fragment
     * (case-insensitive).
     *
     * <p>Native because {@code tags} is a PostgreSQL {@code text[]} column
     * mapped as a basic attribute, so it cannot be traversed from JPQL. Only ids
     * are selected; the rows are then re-read with the ingredient entity graph,
     * which a native query cannot apply.</p>
     */
    @Query(value = """
            SELECT r.id FROM recipes r
            WHERE lower(r.title) LIKE lower('%' || :fragment || '%')
               OR EXISTS (
                    SELECT 1 FROM unnest(r.tags) AS tag
                    WHERE lower(tag) LIKE lower('%' || :fragment || '%')
               )
            """, nativeQuery = true)
    List<Long> findIdsMatchingTitleOrTag(@Param("fragment") String fragment);

    @EntityGraph(attributePaths = { "ingredients", "ingredients.ingredient" })
    List<Recipe> findByIdInOrderByTitleAsc(Collection<Long> ids);
}

