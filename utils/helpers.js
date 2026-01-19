// Backend utility functions for reducing duplication

/**
 * Async error handler wrapper
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Standard API response format
 */
const sendSuccess = (res, data, statusCode = 200, message = null) => {
    const response = { success: true };
    if (message) response.message = message;
    if (data !== undefined) response.data = data;
    return res.status(statusCode).json(response);
};

/**
 * Standard error response format
 */
const sendError = (res, message, statusCode = 400, errors = null) => {
    const response = { success: false, message };
    if (errors) response.errors = errors;
    return res.status(statusCode).json(response);
};

/**
 * Build MongoDB query with AND/OR logic for array fields
 * Important: Some values (like themes) contain commas internally, so we should NOT split
 * unless we have multiple comma-separated values
 */
const buildArrayQuery = (field, values, mode = 'OR') => {
    if (!values) return {};
    // If already an array, use it; otherwise treat as single value (don't split)
    const valueList = Array.isArray(values) ? values : [values];
    return mode === 'AND' ? { $all: valueList } : { $in: valueList };
};

/**
 * Parse pagination parameters
 */
const parsePagination = (query) => {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 50;
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};

/**
 * Build text search query
 */
const buildTextSearchQuery = (searchTerm, fields) => {
    if (!searchTerm) return {};
    return {
        $or: fields.map(field => ({
            [field]: { $regex: searchTerm, $options: 'i' }
        }))
    };
};

/**
 * Validate required fields in request body
 */
const validateRequiredFields = (body, requiredFields) => {
    const missing = requiredFields.filter(field => !body[field]);
    if (missing.length > 0) {
        throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
    return true;
};

/**
 * Common password validation
 */
const validatePassword = (password) => {
    if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
    }
    return true;
};

/**
 * Email validation
 */
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
    }
    return true;
};

module.exports = {
    asyncHandler,
    sendSuccess,
    sendError,
    buildArrayQuery,
    parsePagination,
    buildTextSearchQuery,
    validateRequiredFields,
    validatePassword,
    validateEmail,
};
