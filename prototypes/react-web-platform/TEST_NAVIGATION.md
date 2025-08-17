# Test Screen Navigation Guide

## Overview
The application now includes dedicated test screens for isolated testing of specific dashboard components. These test screens provide minimal, focused environments for testing individual components without the complexity of the full application.

## Available Test Screens

### 1. 🕉️ Gita Dashboard Test
- **File**: `src/test-gita-dashboard.tsx`
- **Component**: `GitaStudyDashboard`
- **Purpose**: Minimal import test for GitaStudyDashboard component
- **Features**: Isolated testing of Sanskrit study tracking functionality

### 2. 👕 Volunteer Dashboard Test
- **File**: `src/test-volunteer-dashboard.tsx`
- **Component**: `VolunteerDashboard`
- **Purpose**: Minimal import test for VolunteerDashboard component
- **Features**: Isolated testing of volunteer t-shirt management functionality

## How to Navigate

### Method 1: Using Navigation Buttons (Recommended)
1. Start the development server: `npm run dev`
2. Open your browser to the application URL
3. Use the navigation buttons at the top of the page:
   - **🏠 Main App** - Returns to the full application
   - **🕉️ Test Gita Dashboard** - Opens the Gita test screen
   - **👕 Test Volunteer Dashboard** - Opens the Volunteer test screen

### Method 2: Direct URL Access
You can also access the test screens directly via URL parameters:

- **Main App**: `http://localhost:5173/`
- **Gita Test**: `http://localhost:5173/?view=test-gita`
- **Volunteer Test**: `http://localhost:5173/?view=test-volunteer`

### Method 3: Browser Navigation
- Use browser back/forward buttons to navigate between screens
- The URL will update automatically, allowing you to bookmark specific test screens

## Test Screen Features

### Isolated Environment
- Each test screen loads only the necessary components
- Minimal dependencies for faster loading
- Clean, focused testing environment

### Error Boundaries
- Each test screen is wrapped in error boundaries
- Isolated error handling prevents one test from affecting others

### Consistent Styling
- All test screens use the same design system
- Consistent theming and responsive design
- Professional appearance matching the main application

## Development Workflow

1. **Create Test Screen**: Add new test files in the `src/` directory
2. **Import Component**: Import the component you want to test
3. **Add Navigation**: Update the App.tsx routing logic
4. **Test Isolated**: Test the component in isolation
5. **Integrate**: Once tested, integrate back into the main application

## Benefits

- **Faster Development**: Test components in isolation
- **Better Debugging**: Focused environment for troubleshooting
- **Cleaner Testing**: No interference from other components
- **Easier Maintenance**: Isolated test environments
- **Better Performance**: Minimal component loading for faster testing

## File Structure
```
src/
├── test-gita-dashboard.tsx      # Gita dashboard test
├── test-volunteer-dashboard.tsx # Volunteer dashboard test
├── App.tsx                      # Main app with routing
└── main.tsx                     # Application entry point
```

## Next Steps
- Add more test screens for other components as needed
- Consider adding automated testing for these isolated environments
- Document component dependencies for each test screen
