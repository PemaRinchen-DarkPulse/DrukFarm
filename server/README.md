DrukFarm API
============

Quick start

1. Copy .env.example to .env and adjust values (MongoDB URI, PORT).
2. Install deps: npm install
3. Start server: npm start (or npm run server for auto-reload)

Endpoints

- POST /api/users/register
	Body: { cid, name, password, role, location, phoneNumber }
- POST /api/users/login
	Body: { cid, password }

Categories

- GET /api/categories
- POST /api/categories { categoryName }

Products

- GET /api/products
- GET /api/products/:id
- POST /api/products
- PUT /api/products/:id
- DELETE /api/products/:id

All endpoints return JSON. On error, responses include { success: false, error }.

Example cURL

Create category

curl -s -X POST http://localhost:5000/api/categories \
	-H "Content-Type: application/json" \
	-d '{"categoryName":"Vegetables"}'

List categories

curl -s http://localhost:5000/api/categories

Create product

curl -s -X POST http://localhost:5000/api/products \
	-H "Content-Type: application/json" \
	-d '{
		"productName":"Fresh Tomatoes",
		"categoryId":"<CATEGORY_ID>",
		"description":"A long description with at least seventy characters to satisfy validation rules.",
		"price":120.5,
		"unit":"kg",
		"stockQuantity":10,
		"productImageBase64":"<BASE64>",
		"createdBy":"12345678901"
	}'

Update product

curl -s -X PUT http://localhost:5000/api/products/<PRODUCT_ID> \
	-H "Content-Type: application/json" \
	-d '{"price": 99.99}'

Delete product

curl -s -X DELETE http://localhost:5000/api/products/<PRODUCT_ID> -i


