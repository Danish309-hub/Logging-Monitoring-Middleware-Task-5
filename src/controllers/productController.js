const pool = require("../config/db");

// ===============================
// CREATE PRODUCT
// ===============================
const createProduct = async (req, res, next) => {
    try {
        const {
            name,
            sku,
            quantity,
            price,
            category
        } = req.body;

        const missingField = [
            { name: "Name", value: name },
            { name: "SKU", value: sku },
            { name: "Quantity", value: quantity },
            { name: "Price", value: price },
            { name: "Category", value: category }
        ].find(({ value }) =>
            value === undefined ||
            value === null ||
            (typeof value === "string" && value.trim() === "")
        );

        if (missingField) {
            const error = new Error(`${missingField.name} is required`);
            error.statusCode = 400;
            return next(error);
        }

        // Name validation: must start with a letter
        if (!/^[A-Za-z]/.test(name)) {
            const error = new Error("Name must start with a letter");
            error.statusCode = 400;
            return next(error);
        }

        // SKU validation: must start with a letter
        if (!/^[A-Za-z]/.test(sku)) {
            const error = new Error("SKU must start with a letter");
            error.statusCode = 400;
            return next(error);
        }

        // Category validation: must start with a letter
        if (!/^[A-Za-z]/.test(category)) {
            const error = new Error("Category must start with a letter");
            error.statusCode = 400;
            return next(error);
        }

        // Quantity validation
        if (!Number.isInteger(quantity) || quantity < 0) {
            const error = new Error(
                "Quantity must be a non-negative integer"
            );
            error.statusCode = 400;
            return next(error);
        }

        // Price validation
        if (typeof price !== "number" || price <= 0) {
            const error = new Error("Price must be greater than 0");
            error.statusCode = 400;
            return next(error);
        }

        // Insert product
        const result = await pool.query(
            `INSERT INTO products
            (name, sku, quantity, price, category)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, name, sku, quantity, price, category, created_at, updated_at`,
            [name, sku, quantity, price, category]
        );

        // Low stock warning
        if (quantity < 5) {
            console.warn(
                `LOW STOCK WARNING: ${name} has only ${quantity} items`
            );
        }

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            product: result.rows[0]
        });

    } catch (error) {
        next(error);
    }
};


// ===============================
// GET ALL PRODUCTS
// ===============================
const getAllProducts = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT
                id,
                name,
                sku,
                quantity,
                price,
                category,
                created_at,
                updated_at
             FROM products
             ORDER BY id ASC`
        );

        // Low stock warnings
        result.rows.forEach((product) => {
            if (product.quantity < 5) {
                console.warn(
                    `LOW STOCK WARNING: ${product.name} has only ${product.quantity} items`
                );
            }
        });

        res.status(200).json({
            success: true,
            count: result.rows.length,
            products: result.rows
        });

    } catch (error) {
        next(error);
    }
};


// ===============================
// GET PRODUCT BY ID
// ===============================
const getProductById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!/^\d+$/.test(id)) {
            const error = new Error("Product ID must be a number");
            error.statusCode = 400;
            return next(error);
        }

        const result = await pool.query(
            `SELECT
                id,
                name,
                sku,
                quantity,
                price,
                category,
                created_at,
                updated_at
             FROM products
             WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            const error = new Error("Product not found");
            error.statusCode = 404;
            return next(error);
        }

        const product = result.rows[0];

        if (product.quantity < 5) {
            console.warn(
                `LOW STOCK WARNING: ${product.name} has only ${product.quantity} items`
            );
        }

        res.status(200).json({
            success: true,
            product
        });

    } catch (error) {
        next(error);
    }
};


// ===============================
// UPDATE PRODUCT
// ===============================
const updateProduct = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!/^\d+$/.test(id)) {
            const error = new Error("Product ID must be a number");
            error.statusCode = 400;
            return next(error);
        }

        const {
            name,
            sku,
            quantity,
            price,
            category
        } = req.body;

        // Check whether product exists
        const existingProduct = await pool.query(
            `SELECT id, name, sku, quantity, price, category
             FROM products
             WHERE id = $1`,
            [id]
        );

        if (existingProduct.rows.length === 0) {
            const error = new Error("Product not found");
            error.statusCode = 404;
            return next(error);
        }

        const current = existingProduct.rows[0];

        const updatedName = name !== undefined ? name : current.name;
        const updatedSku = sku !== undefined ? sku : current.sku;
        const updatedQuantity =
            quantity !== undefined ? quantity : current.quantity;
        const updatedPrice =
            price !== undefined ? price : Number(current.price);
        const updatedCategory =
            category !== undefined ? category : current.category;

        // Name validation
        if (!/^[A-Za-z]/.test(updatedName)) {
            const error = new Error("Name must start with a letter");
            error.statusCode = 400;
            return next(error);
        }

        // SKU validation
        if (!/^[A-Za-z]/.test(updatedSku)) {
            const error = new Error("SKU must start with a letter");
            error.statusCode = 400;
            return next(error);
        }

        // Category validation
        if (!/^[A-Za-z]/.test(updatedCategory)) {
            const error = new Error("Category must start with a letter");
            error.statusCode = 400;
            return next(error);
        }

        // Quantity validation
        if (
            !Number.isInteger(updatedQuantity) ||
            updatedQuantity < 0
        ) {
            const error = new Error(
                "Quantity must be a non-negative integer"
            );
            error.statusCode = 400;
            return next(error);
        }

        // Price validation
        if (
            typeof updatedPrice !== "number" ||
            updatedPrice <= 0
        ) {
            const error = new Error("Price must be greater than 0");
            error.statusCode = 400;
            return next(error);
        }

        const result = await pool.query(
            `UPDATE products
             SET
                name = $1,
                sku = $2,
                quantity = $3,
                price = $4,
                category = $5,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $6
             RETURNING id, name, sku, quantity, price, category, created_at, updated_at`,
            [
                updatedName,
                updatedSku,
                updatedQuantity,
                updatedPrice,
                updatedCategory,
                id
            ]
        );

        console.log(`Inventory updated: Product ID ${id}`);

        if (updatedQuantity < 5) {
            console.warn(
                `LOW STOCK WARNING: ${updatedName} has only ${updatedQuantity} items`
            );
        }

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            product: result.rows[0]
        });

    } catch (error) {
        next(error);
    }
};


// ===============================
// DELETE PRODUCT
// ===============================
const deleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!/^\d+$/.test(id)) {
            const error = new Error("Product ID must be a number");
            error.statusCode = 400;
            return next(error);
        }

        const result = await pool.query(
            `DELETE FROM products
             WHERE id = $1
             RETURNING id, name, sku`,
            [id]
        );

        if (result.rows.length === 0) {
            const error = new Error("Product not found");
            error.statusCode = 404;
            return next(error);
        }

        res.status(200).json({
            success: true,
            message: "Product deleted successfully",
            product: result.rows[0]
        });

    } catch (error) {
        next(error);
    }
};


module.exports = {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct
};