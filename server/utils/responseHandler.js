/*
=========================================================
SUCCESS RESPONSE
=========================================================
*/

const successResponse = (
    res,
    statusCode = 200,
    message = 'Success',
    data = null
) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};

/*
=========================================================
ERROR RESPONSE
=========================================================
*/

const errorResponse = (
    res,
    error,
    statusCode = 500
) => {

    if (typeof error === 'string') {
        return res.status(statusCode).json({
            success: false,
            message: error,
        });
    }

    return res.status(statusCode).json({
        success: false,
        message:
            error.message ||
            'Something went wrong.',
        errors:
            error.errors || null,
    });

};

/*
=========================================================
SHORT-HAND HELPERS (data-first, used by payrollController)
=========================================================
*/

const success = (
    res,
    data = null,
    message = 'Success',
    statusCode = 200
) => successResponse(
    res,
    statusCode,
    message,
    data
);

const created = (
    res,
    data = null,
    message = 'Created successfully.'
) => success(res, data, message, 201);

const notFound = (
    res,
    message = 'Resource not found.'
) => errorResponse(res, message, 404);

const badRequest = (
    res,
    message = 'Bad request.'
) => errorResponse(res, message, 400);

const unauthorized = (
    res,
    message = 'Unauthorized.'
) => errorResponse(res, message, 401);

const forbidden = (
    res,
    message = 'Access denied.'
) => errorResponse(res, message, 403);

const error = (
    res,
    message = 'Something went wrong',
    statusCode = 500,
    errors = null
) =>
    res.status(statusCode).json({
        success: false,
        message,
        errors,
    });

module.exports = {
    successResponse,
    errorResponse,
    success,
    created,
    notFound,
    badRequest,
    unauthorized,
    forbidden,
    error,
};