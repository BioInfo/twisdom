# Active Issues

This document tracks current issues, bugs, and improvement opportunities for the Twisdom project. It serves as a lightweight issue tracking system that can be maintained directly in the codebase.

## Issue Status Definitions

- **Open**: Issue identified but not yet addressed
- **In Progress**: Currently being worked on
- **Blocked**: Cannot proceed due to dependencies or other issues
- **Resolved**: Issue has been fixed but not verified
- **Closed**: Issue has been fixed and verified
- **Deferred**: Issue acknowledged but postponed to a future phase

## Security Issues

### SEC-001: OpenAI API Key Exposure

**Status**: In Progress  
**Priority**: High  
**Created**: 2025-03-04  
**Description**: The OpenAI API key is stored in client-side environment variables and exposed in the browser.

**Impact**: Potential unauthorized access to the OpenAI API, leading to unexpected costs and misuse.

**Proposed Solution**: Move API calls to a backend service to protect API keys.

**Progress**: Supabase integration has been set up, which provides a backend service that can be used to protect API keys. The next step is to move the OpenAI API calls to Supabase Edge Functions.

**Related Files**:
- `src/services/aiService.ts`
- `.env`
- `supabase/config.toml`

## Performance Issues

### PERF-001: Large Dataset Performance

**Status**: In Progress  
**Priority**: Medium  
**Created**: 2025-03-04  
**Description**: All data processing occurs in the browser, which may cause performance issues with large bookmark collections.

**Impact**: Poor user experience with large datasets, potential browser crashes.

**Proposed Solution**: 
1. Implement virtualization for bookmark lists
2. Add pagination or infinite scrolling
3. Optimize state updates to reduce unnecessary re-renders

**Progress**: Supabase integration provides a PostgreSQL database that can handle large datasets with server-side filtering, sorting, and pagination. The next step is to update the UI components to use these features.

**Related Files**:
- `src/App.tsx`
- `src/pages/BookmarksPage.tsx`
- `src/utils/supabaseClient.ts`

### PERF-002: Inefficient State Management

**Status**: Open  
**Priority**: Medium  
**Created**: 2025-03-04  
**Description**: The current state management approach uses prop drilling and may cause unnecessary re-renders.

**Impact**: Reduced performance, especially with larger datasets.

**Proposed Solution**: Refactor to use React Context API or a state management library like Redux.

**Related Files**:
- `src/App.tsx`
- All page components

## Storage Issues

### STOR-001: LocalStorage Limitations

**Status**: Resolved  
**Priority**: Medium  
**Created**: 2025-03-04  
**Description**: The application relies on localStorage which has a ~5MB limit per domain.

**Impact**: Limited number of bookmarks that can be stored, potential data loss.

**Solution Implemented**: 
Integrated Supabase as a backend service with PostgreSQL database for persistent storage. Created a migration utility to move data from localStorage to Supabase.

**Related Files**:
- `src/utils/storage.ts`
- `src/utils/supabaseClient.ts`
- `src/utils/migrateToSupabase.ts`
- `supabase/migrations/20250304_initial_schema.sql`

## Feature Improvements

### FEAT-001: Multi-Device Synchronization

**Status**: In Progress  
**Priority**: Medium  
**Created**: 2025-03-04  
**Description**: No mechanism for syncing data across multiple devices.

**Impact**: Users cannot access their bookmarks across different devices.

**Proposed Solution**: Implement a backend service with user authentication and data synchronization.

**Progress**: Supabase integration provides user authentication and a PostgreSQL database that enables multi-device synchronization. The authentication component has been implemented, and the database schema has been designed to support user-specific data.

**Related Files**:
- `src/components/SupabaseAuth.tsx`
- `src/utils/supabaseClient.ts`
- `supabase/migrations/20250304_initial_schema.sql`

### FEAT-002: Offline Support

**Status**: Deferred  
**Priority**: Low  
**Created**: 2025-03-04  
**Description**: No explicit offline support or service worker implementation.

**Impact**: Application requires internet connection to function properly.

**Proposed Solution**: Implement service workers for offline functionality.

## Accessibility Issues

### A11Y-001: Missing ARIA Attributes

**Status**: Open  
**Priority**: Medium  
**Created**: 2025-03-04  
**Description**: Many UI components lack proper ARIA attributes for accessibility.

**Impact**: Reduced usability for users with disabilities, particularly screen reader users.

**Proposed Solution**: Add appropriate ARIA attributes to all interactive components.

**Related Files**:
- All component files

### A11Y-002: Keyboard Navigation

**Status**: Open  
**Priority**: Medium  
**Created**: 2025-03-04  
**Description**: Limited keyboard navigation support throughout the application.

**Impact**: Difficult to use for keyboard-only users.

**Proposed Solution**: Implement comprehensive keyboard navigation support.

**Related Files**:
- All interactive component files

## Code Quality Issues

### CODE-001: Limited Error Handling

**Status**: Open  
**Priority**: Medium  
**Created**: 2025-03-04  
**Description**: Basic error handling for API calls and data parsing, but lacks comprehensive recovery mechanisms.

**Impact**: Poor user experience when errors occur, potential data loss.

**Proposed Solution**: Implement comprehensive error handling with user feedback and recovery options.

**Related Files**:
- `src/services/aiService.ts`
- `src/utils/bookmarkParser.ts`
- `src/utils/aiAnalyzer.ts`
- `src/utils/supabaseClient.ts`

### CODE-002: Missing Tests

**Status**: Open  
**Priority**: Medium  
**Created**: 2025-03-04  
**Description**: No unit or integration tests for the application.

**Impact**: Difficult to ensure code quality and prevent regressions.

**Proposed Solution**: Add comprehensive test suite with Jest and React Testing Library.

**Related Files**:
- All source files