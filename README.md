# all-in-one

This npm package provides utility modules for logging, handling response wrapping, and error response wrapping.

## Installation

Install the package using npm:

```bash
npm install all-in-one
```

## Usage

### Logging Module - `log`

The `log` module provides functions for logging messages to the console.

```javascript
const commonHelper = require('all-in-one');

// Log an info message
commonHelper.log('This is an informational message.');

// Log with a tags and data
commonHelper.log('ERROR',data);

```

### Response Wrapper Module - `wrapper.response`

The `wrapper.response` module provides a function to wrap successful responses with a standardized format.

```javascript
const wrapper = require('all-in-one');

// Wrap data success
return wrapper.data()

// Wrap errror data
return wrapper.error()

// return response http
wrapper.response(res, 'success', result, 'meesage data')

// Output: { success: true, data: {}, message: 'Data retrieved successfully.', code:200 }
```

---
