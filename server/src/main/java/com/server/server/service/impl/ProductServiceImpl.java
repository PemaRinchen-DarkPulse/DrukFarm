package com.server.server.service.impl;

import com.server.server.dto.ProductRequestDto;
import com.server.server.dto.ProductResponseDto;
import com.server.server.entity.Category;
import com.server.server.entity.Product;
import com.server.server.exception.ResourceNotFoundException;
import com.server.server.repository.CategoryRepository;
import com.server.server.repository.ProductRepository;
import com.server.server.service.ProductService;
import java.util.Base64;
import java.util.List;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private static final Logger logger = LoggerFactory.getLogger(ProductServiceImpl.class);

    public ProductServiceImpl(ProductRepository productRepository, CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    @Override
    @Transactional
    public ProductResponseDto createProduct(ProductRequestDto dto) {
        logger.info("Creating product with DTO: {}", dto);
        Product p = new Product();
        mapRequestToEntity(dto, p);
        logger.info("Mapped entity: {}", p);
        Product saved = productRepository.save(p);
        logger.info("Saved product: {}", saved);
        return mapEntityToResponse(saved);
    }

    @Override
    public List<ProductResponseDto> getAllProducts() {
        return productRepository.findAll().stream().map(this::mapEntityToResponse).collect(Collectors.toList());
    }

    @Override
    public ProductResponseDto getProductById(Long id) {
        Product p = productRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        return mapEntityToResponse(p);
    }

    @Override
    public List<ProductResponseDto> getProductsByCategory(Long categoryId) {
        Category c = categoryRepository.findById(categoryId).orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        return productRepository.findByCategory(c).stream().map(this::mapEntityToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ProductResponseDto updateProduct(Long id, ProductRequestDto dto) {
        Product p = productRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        mapRequestToEntity(dto, p);
        Product saved = productRepository.save(p);
        return mapEntityToResponse(saved);
    }

    @Override
    public void deleteProduct(Long id) {
        Product p = productRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        productRepository.delete(p);
    }

    @Override
    @Transactional
    public ProductResponseDto adjustStock(Long id, Integer delta) {
        Product p = productRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        int newQty = (p.getStockQuantity() == null ? 0 : p.getStockQuantity()) + delta;
        if (newQty < 0) throw new IllegalArgumentException("Stock cannot be negative");
        p.setStockQuantity(newQty);
        Product saved = productRepository.save(p);
        return mapEntityToResponse(saved);
    }

    // helpers
    private void mapRequestToEntity(ProductRequestDto dto, Product p) {
        if (dto.getProductName() != null) p.setProductName(dto.getProductName());
        if (dto.getDescription() != null) p.setDescription(dto.getDescription());
        if (dto.getPrice() != null) p.setPrice(dto.getPrice());
        if (dto.getUnit() != null) p.setUnit(dto.getUnit());
        if (dto.getStockQuantity() != null) p.setStockQuantity(dto.getStockQuantity());
        if (dto.getCategoryId() != null) {
            Category c = categoryRepository.findById(dto.getCategoryId()).orElseThrow(() -> new ResourceNotFoundException("Category not found"));
            p.setCategory(c);
        }
        if (dto.getProductImageBase64() != null && dto.getProductImageBase64().trim().length() > 0) {
            try {
                byte[] image = Base64.getDecoder().decode(dto.getProductImageBase64());
                final int MAX_IMG_BYTES = 5 * 1024 * 1024; // 5 MB
                if (image.length > MAX_IMG_BYTES) {
                    logger.warn("Product image size {} bytes exceeds allowed {} bytes", image.length, MAX_IMG_BYTES);
                    throw new IllegalArgumentException("Product image too large (max 5MB)");
                }
                p.setProductImage(image);
            } catch (IllegalArgumentException ex) {
                // If decoding fails or the image is too large, propagate the error for a 400 response
                logger.error("Invalid Base64 string for product image or image too large", ex);
                throw ex;
            }
        }
        if (dto.getCreatedBy() != null) {
            String cb = dto.getCreatedBy();
            if (cb.length() > 64) {
                logger.warn("createdBy length {} exceeds 64, truncating", cb.length());
                cb = cb.substring(0, 64);
            }
            p.setCreatedBy(cb);
        }
    }

    private ProductResponseDto mapEntityToResponse(Product p) {
        ProductResponseDto r = new ProductResponseDto();
        r.setProductId(p.getProductId());
        r.setProductName(p.getProductName());
        if (p.getCategory() != null) {
            r.setCategoryId(p.getCategory().getCategoryId());
            r.setCategoryName(p.getCategory().getCategoryName());
        }
        r.setDescription(p.getDescription());
        r.setPrice(p.getPrice());
        r.setUnit(p.getUnit());
        r.setStockQuantity(p.getStockQuantity());
        if (p.getProductImage() != null) {
            r.setProductImageBase64(Base64.getEncoder().encodeToString(p.getProductImage()));
        }
    r.setCreatedBy(p.getCreatedBy());
        r.setCreatedAt(p.getCreatedAt());
        r.setUpdatedAt(p.getUpdatedAt());
        return r;
    }
}
