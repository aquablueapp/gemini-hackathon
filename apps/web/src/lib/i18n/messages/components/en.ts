/**
 * Component-related English translation messages
 */
const ERROR_CODES = {
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  AUTH_FORBIDDEN: 'AUTH_FORBIDDEN',
  AUTH_INVALID_TOKEN: 'AUTH_INVALID_TOKEN',
  AUTH_SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
  AUTH_MISSING_SESSION_ID: 'AUTH_MISSING_SESSION_ID',
  AUTH_SESSION_NOT_FOUND: 'AUTH_SESSION_NOT_FOUND',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  VALIDATION_INVALID_UPDATES: 'VALIDATION_INVALID_UPDATES',
  VALIDATION_REQUIRED: 'VALIDATION_REQUIRED',
  VALIDATION_INVALID_FORMAT: 'VALIDATION_INVALID_FORMAT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

const componentsEn = {
  layout: {
    header: {
      features: 'Features',
      useCases: 'Use Cases',
      pricing: 'Pricing',
      about: 'About',
      signIn: 'Sign In',
      getStarted: 'Get Started',
    },
    footer: {
      // Future footer translations can be added here
    },
  },
  errors: {
    notFound: {
      title: '404',
      description: 'The page you\'re looking for might have been moved or doesn\'t exist.',
      goHome: 'Go Home',
      explore: 'Explore',
    },
    unauthorized: {
      title: '401',
      description: 'You need to sign in to access this resource.',
      goHome: 'Go Home',
      goBack: 'Go Back',
      signIn: 'Sign In',
    },
    forbidden: {
      title: '403',
      description: 'You don\'t have permission to access this resource.',
      adminOnly: 'This page is only accessible to admins.',
      goHome: 'Go Home',
      goBack: 'Go Back',
    },
    serverError: {
      title: '500',
      description: 'The server encountered an error. We are working to fix it.',
      goHome: 'Go Home',
      goBack: 'Go Back',
      tryAgain: 'Try Again',
    },
    maintenance: {
      title: '503',
      description: 'The website is under maintenance. We will be back online shortly.',
      goHome: 'Go Home',
      learnMore: 'Learn More',
    },
    default: {
      title: 'Error',
      defaultDescription: 'An unexpected error occurred.',
      tryAgain: 'Try Again',
      goHome: 'Home',
      goBack: 'Go Back',
    },
    server: {
      // Error code-based translation mapping
      [ERROR_CODES.AUTH_UNAUTHORIZED]: 'Unauthorized. Please sign in again.',
      [ERROR_CODES.AUTH_FORBIDDEN]: 'Forbidden. You do not have permission to perform this action.',
      [ERROR_CODES.AUTH_INVALID_TOKEN]: 'Invalid authentication token. Please sign in again.',
      [ERROR_CODES.AUTH_SESSION_EXPIRED]: 'Session expired. Please sign in again.',
      [ERROR_CODES.AUTH_MISSING_SESSION_ID]: 'Missing session ID.',
      [ERROR_CODES.AUTH_SESSION_NOT_FOUND]: 'Session not found. Please sign in again.',

      [ERROR_CODES.RESOURCE_NOT_FOUND]: 'Resource not found.',
      [ERROR_CODES.RESOURCE_ALREADY_EXISTS]: 'Resource already exists.',

      [ERROR_CODES.VALIDATION_ERROR]: 'Validation error. Please check your input.',
      [ERROR_CODES.VALIDATION_INVALID_UPDATES]: 'Invalid update data.',
      [ERROR_CODES.VALIDATION_REQUIRED]: 'Required field is missing.',
      [ERROR_CODES.VALIDATION_INVALID_FORMAT]: 'Invalid format. Please check the input format.',

      [ERROR_CODES.INTERNAL_ERROR]: 'Internal server error. Please try again later.',

      // Backward compatibility with HTTP status code keys
      unauthorized: 'Unauthorized. Please sign in again.',
      forbidden: 'Forbidden. You do not have permission to perform this action.',
      notFound: 'Resource not found.',
      serverError: 'Internal server error. Please try again later.',
      maintenance: 'Service temporarily unavailable.',
      contentNotFound: 'Content not found.',

      // Default message
      default: 'Something went wrong!',
    },
  },
  pending: {
    title: 'Processing your request',
    description: 'Please wait while we process your request. Do not refresh the page.',
    cancel: 'Cancel',
  },
  buttons: {
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    close: 'Close',
  },
  table: {
    searchPlaceholder: 'Search...',
    pagination: {
      page: '{current}/{total}',
      pageFull: 'Page {current} of {total}',
      rowsPerPage: 'Per page',
      rowsPerPageFull: 'Rows per page',
      goToFirstPage: 'Go to first page',
      goToPreviousPage: 'Go to previous page',
      goToNextPage: 'Go to next page',
      goToLastPage: 'Go to last page',
      goToPage: 'Go to page {page}',
    },
    buttons: {
      import: 'Import',
      create: 'Create',
      search: 'Search',
      reset: 'Reset',
      view: 'View',
    },
  },
  forms: {
    validation: {
      required: 'This field is required',
      email: 'Please enter a valid email address',
      minLength: 'Minimum {min} characters required',
      maxLength: 'Maximum {max} characters allowed',
      min: 'Minimum value cannot be less than {min}',
      max: 'Maximum value cannot be greater than {max}',
      pattern: 'Invalid format',
      url: 'Please enter a valid URL',
      number: 'Please enter a valid number',
      integer: 'Please enter an integer',
      positive: 'Please enter a positive number',
      negative: 'Please enter a negative number',
      date: 'Please enter a valid date',
      time: 'Please enter a valid time',
      match: 'The two inputs do not match',
      unique: 'This value already exists',
    },
  },
  auth: {
    signIn: {
      title: 'Sign In',
      description: 'Welcome back',
    },
  },
  api: {
    errors: {
      [ERROR_CODES.VALIDATION_REQUIRED]: 'This field is required.',
      [ERROR_CODES.VALIDATION_INVALID_UPDATES]: 'No fields to update.',
      [ERROR_CODES.VALIDATION_ERROR]: 'Form validation failed.',
      [ERROR_CODES.AUTH_UNAUTHORIZED]: 'Please sign in first.',
      [ERROR_CODES.AUTH_FORBIDDEN]: 'Permission denied.',
      [ERROR_CODES.RESOURCE_NOT_FOUND]: 'Resource not found.',
      [ERROR_CODES.INTERNAL_ERROR]: 'Internal server error.',
    },
  },
} as const

export default componentsEn
