package com.server.server.repository;

import com.server.server.entity.Product;
import com.server.server.entity.Category;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByCategory(Category category);
}
