package com.server.server.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import jakarta.validation.constraints.Size;

public class ProductRequestDto {
    private Long productId;

    @NotBlank
    private String productName;

    private Long categoryId;

    private String description;

    @Min(0)
    private BigDecimal price;

    private String unit;

    @Min(0)
    private Integer stockQuantity;

    // Base64 encoded image string (optional)
    private String productImageBase64;

    // CID of the user who created/updated this product
    @Size(max = 64)
    private String createdBy;

    public ProductRequestDto() {}

    // getters and setters
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }
    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    public Integer getStockQuantity() { return stockQuantity; }
    public void setStockQuantity(Integer stockQuantity) { this.stockQuantity = stockQuantity; }
    public String getProductImageBase64() { return productImageBase64; }
    public void setProductImageBase64(String productImageBase64) { this.productImageBase64 = productImageBase64; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
}
