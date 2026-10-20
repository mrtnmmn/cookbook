package com.avalon.CookBook.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
     * One page of recipe ids, newest first.
     *
     * <p>Ids are paged instead of entities because combining pagination with a
     * collection fetch join makes Hibernate page in memory; the ids of the page
     * are re-read afterwards with the ingredient entity graph.</p>
     */
    @Query("select r.id from Recipe r order by r.createdAt desc, r.id desc")
    Page<Long> findIdPage(Pageable pageable);

    /**
     * Ids of the recipes whose title or any of their tags contains the fragment
     * (case-insensitive), newest first.
     *
     * <p>Native because {@code tags} is a PostgreSQL {@code text[]} column
     * mapped as a basic attribute, so it cannot be traversed from JPQL.</p>
     */
    @Query(value = """
            SELECT r.id FROM recipes r
            WHERE lower(r.title) LIKE lower('%' || :fragment || '%')
               OR EXISTS (
                    SELECT 1 FROM unnest(r.tags) AS tag
                    WHERE lower(tag) LIKE lower('%' || :fragment || '%')
               )
            ORDER BY r.created_at DESC, r.id DESC
            """, nativeQuery = true)
    List<Long> findIdsMatchingTitleOrTag(@Param("fragment") String fragment);

    @EntityGraph(attributePaths = { "ingredients", "ingredients.ingredient" })
    List<Recipe> findByIdIn(Collection<Long> ids);
}

