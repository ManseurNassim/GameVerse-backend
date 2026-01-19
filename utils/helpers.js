// Backend utility functions for reducing duplication

/**
 * Async error handler wrapper
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
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

module.exports = {
    asyncHandler,
    buildArrayQuery,
    parsePagination,
    buildTextSearchQuery,
};
