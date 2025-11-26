# Error Handling Guide for Mobile App

This guide shows you how to properly handle errors in the mobile app using the comprehensive error handling utilities.

## Overview

The mobile app includes several utilities for consistent error handling:

1. **errorHandler.js** - Error message extraction and formatting
2. **ErrorAlert.js** - Visual error alert component
3. **Toast.js** - Toast notifications for errors
4. **useErrorHandler.js** - React hook for error handling

## Basic Usage

### 1. Using ErrorAlert Component

```javascript
import { ErrorAlert } from '../components/ErrorAlert';
import { useState } from 'react';

function MyScreen() {
  const [error, setError] = useState(null);

  const handleAction = async () => {
    try {
      await someApiCall();
    } catch (err) {
      setError(err);
    }
  };

  return (
    <View>
      {error && (
        <ErrorAlert
          error={error}
          onDismiss={() => setError(null)}
          onAction={(action) => {
            if (action === 'retry') {
              handleAction();
            }
          }}
        />
      )}
    </View>
  );
}
```

### 2. Using Toast Notifications

```javascript
import { useToast } from '../components/Toast';

function MyScreen() {
  const toast = useToast();

  const handleAction = async () => {
    try {
      await someApiCall();
      toast.showSuccess('Operation completed successfully!');
    } catch (err) {
      toast.showError(getErrorMessage(err));
    }
  };

  return (
    <View>
      {/* Your content */}
      <toast.ToastContainer position="top" />
    </View>
  );
}
```

### 3. Using useErrorHandler Hook

```javascript
import { useErrorHandler } from '../hooks/useErrorHandler';

function MyScreen() {
  const { handleError, error, clearError } = useErrorHandler({
    showAlert: true,
    onError: (err, message) => {
      console.log('Error occurred:', message);
    }
  });

  const handleAction = async () => {
    try {
      await someApiCall();
    } catch (err) {
      handleError(err);
    }
  };

  return (
    <View>
      {error && (
        <ErrorAlert
          error={error}
          onDismiss={clearError}
        />
      )}
    </View>
  );
}
```

### 4. Using React Query with Error Handling

```javascript
import { useMutation } from '@tanstack/react-query';
import { ErrorAlert } from '../components/ErrorAlert';
import { useState } from 'react';

function MyScreen() {
  const [error, setError] = useState(null);

  const mutation = useMutation({
    mutationFn: (data) => apiFetch('/endpoint', { 
      method: 'POST', 
      token, 
      body: data 
    }),
    onSuccess: () => {
      // Handle success
    },
    onError: (error) => {
      setError(error);
    },
  });

  return (
    <View>
      {error && (
        <ErrorAlert
          error={error}
          onDismiss={() => setError(null)}
        />
      )}
      {/* Your form */}
    </View>
  );
}
```

## Error Message Extraction

The `getErrorMessage` function automatically extracts user-friendly messages:

```javascript
import { getErrorMessage } from '../utils/errorHandler';

try {
  await apiCall();
} catch (error) {
  const message = getErrorMessage(error);
  // Returns user-friendly message based on error type
  console.log(message);
}
```

## Error Types Handled

### Network Errors
- Connection failures
- Timeout errors
- Network unavailable

### HTTP Status Codes
- **400**: Bad Request - Invalid input
- **401**: Unauthorized - Authentication failed
- **403**: Forbidden - Permission denied
- **404**: Not Found - Resource doesn't exist
- **409**: Conflict - Resource conflict
- **422**: Validation Error - Invalid data
- **429**: Too Many Requests - Rate limited
- **500+**: Server Errors

### Backend-Specific Errors
- Venue booking conflicts
- Email already exists
- Invalid credentials
- Session expired

## Error Severity Levels

Errors are automatically categorized by severity:

- **info**: Informational (404 errors)
- **warning**: Warning (401, 403, 429)
- **error**: Standard errors (400, 422)
- **critical**: Critical errors (500+)

## Action Buttons

Error alerts can include action buttons:

- **Retry**: For network/timeout errors
- **Login**: For authentication errors
- **Go Back**: For 404 errors

## Best Practices

1. **Always use getErrorMessage** to show user-friendly messages
2. **Show ErrorAlert** for important errors that need user attention
3. **Use Toast** for non-critical notifications
4. **Clear errors** when user dismisses or retries
5. **Handle errors at the right level** - component level for UI errors, hook level for API errors

## Examples

### Example 1: Form Submission with Error Handling

```javascript
import { ErrorAlert } from '../components/ErrorAlert';
import { useErrorHandler } from '../hooks/useErrorHandler';

function CreateScheduleScreen() {
  const { handleError, error, clearError } = useErrorHandler();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      await apiFetch('/schedules', {
        method: 'POST',
        body: formData
      });
      // Success handling
    } catch (err) {
      handleError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View>
      {error && (
        <ErrorAlert
          error={error}
          onDismiss={clearError}
          onAction={(action) => {
            if (action === 'retry') {
              handleSubmit(formData);
            }
          }}
        />
      )}
      {/* Form content */}
    </View>
  );
}
```

### Example 2: Using Toast for Success/Error

```javascript
import { useToast } from '../components/Toast';
import { getErrorMessage } from '../utils/errorHandler';

function MyScreen() {
  const toast = useToast();

  const handleAction = async () => {
    try {
      await apiCall();
      toast.showSuccess('Saved successfully!');
    } catch (error) {
      toast.showError(getErrorMessage(error));
    }
  };

  return (
    <View>
      {/* Content */}
      <toast.ToastContainer />
    </View>
  );
}
```

### Example 3: React Query with Error Alert

```javascript
import { useQuery } from '@tanstack/react-query';
import { ErrorAlert } from '../components/ErrorAlert';

function MyScreen() {
  const { data, error, isLoading } = useQuery({
    queryKey: ['my-data'],
    queryFn: () => apiFetch('/data'),
  });

  if (isLoading) return <Loading />;

  return (
    <View>
      {error && (
        <ErrorAlert
          error={error}
          onAction={(action) => {
            if (action === 'retry') {
              refetch();
            }
          }}
        />
      )}
      {/* Content */}
    </View>
  );
}
```

## Migration Guide

If you have existing error handling, here's how to migrate:

### Before:
```javascript
catch (error) {
  Alert.alert("Error", error.message || "Something went wrong");
}
```

### After:
```javascript
import { ErrorAlert } from '../components/ErrorAlert';
import { useState } from 'react';

const [error, setError] = useState(null);

catch (error) {
  setError(error);
}

// In render:
{error && <ErrorAlert error={error} onDismiss={() => setError(null)} />}
```

This provides:
- ✅ Better error messages
- ✅ Consistent UI
- ✅ Action buttons
- ✅ Better UX
