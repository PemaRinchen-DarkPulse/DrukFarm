package com.server.server.service;

import com.server.server.dto.ProductRequestDto;
import com.server.server.dto.ProductResponseDto;
import java.util.List;

public interface ProductService {
    ProductResponseDto createProduct(ProductRequestDto dto);
    List<ProductResponseDto> getAllProducts();
    ProductResponseDto getProductById(Long id);
    List<ProductResponseDto> getProductsByCategory(Long categoryId);
    ProductResponseDto updateProduct(Long id, ProductRequestDto dto);
    void deleteProduct(Long id);
    ProductResponseDto adjustStock(Long id, Integer delta);
}
