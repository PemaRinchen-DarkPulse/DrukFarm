package com.server.server.service.impl;

import com.server.server.dto.CategoryDto;
import com.server.server.entity.Category;
import com.server.server.exception.ResourceNotFoundException;
import com.server.server.repository.CategoryRepository;
import com.server.server.service.CategoryService;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryServiceImpl(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Override
    public CategoryDto createCategory(CategoryDto dto) {
        Category c = new Category();
        c.setCategoryName(dto.getCategoryName());
        Category saved = categoryRepository.save(c);
        dto.setCategoryId(saved.getCategoryId());
        return dto;
    }

    @Override
    public List<CategoryDto> getAllCategories() {
        return categoryRepository.findAll().stream().map(c -> {
            CategoryDto d = new CategoryDto();
            d.setCategoryId(c.getCategoryId());
            d.setCategoryName(c.getCategoryName());
            return d;
        }).collect(Collectors.toList());
    }

    @Override
    public CategoryDto getCategoryById(Long id) {
        Category c = categoryRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        CategoryDto d = new CategoryDto();
        d.setCategoryId(c.getCategoryId());
        d.setCategoryName(c.getCategoryName());
        return d;
    }

    @Override
    public void deleteCategory(Long id) {
        Category c = categoryRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        categoryRepository.delete(c);
    }
}
