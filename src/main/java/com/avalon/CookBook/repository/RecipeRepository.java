package com.avalon.CookBook.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.avalon.CookBook.domain.Recipe;

public interface RecipeRepository extends JpaRepository<Recipe, Long> {

    boolean existsByTitleIgnoreCase(String title);

    @EntityGraph(attributePaths = { "ingredients", "ingredients.ingredient" })
    Optional<Recipe> findWithIngredientsById(Long id);

    @Override
    @EntityGraph(attributePaths = { "ingredients", "ingredients.ingredient" })
    List<Recipe> findAll();

    /** Case-insensitive "contains" match on the title (LIKE %fragment%). */
    @EntityGraph(attributePaths = { "ingredients", "ingredients.ingredient" })
    List<Recipe> findByTitleContainingIgnoreCaseOrderByTitleAsc(String fragment);
}

