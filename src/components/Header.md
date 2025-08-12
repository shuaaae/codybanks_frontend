# Header Component Documentation

## Overview
The `Header` component is a reusable navigation header that includes:
- Logo/Branding
- Navigation links
- User dropdown menu with profile, home, and logout options

## Usage

### Basic Usage
```jsx
import Header from '../components/Header';

function MyPage() {
  const [currentUser, setCurrentUser] = useState(null);
  
  const handleLogout = () => {
    // Your logout logic
  };
  
  const handleShowProfile = () => {
    // Your profile modal logic
  };

  return (
    <div>
      <Header 
        currentUser={currentUser}
        onLogout={handleLogout}
        onShowProfile={handleShowProfile}
      />
      {/* Your page content */}
    </div>
  );
}
```

### Custom Navigation Links
```jsx
const customNavLinks = [
  { label: 'HOME', path: '/home' },
  { label: 'ABOUT', path: '/about' },
  { label: 'CONTACT', path: '/contact' },
];

<Header 
  currentUser={currentUser}
  onLogout={handleLogout}
  onShowProfile={handleShowProfile}
  navLinks={customNavLinks}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `currentUser` | Object | null | User object with name and email properties |
| `onLogout` | Function | - | Callback function for logout action |
| `onShowProfile` | Function | - | Callback function for showing profile modal |
| `navLinks` | Array | Default nav links | Array of navigation link objects with `label` and `path` properties |

## Default Navigation Links
```jsx
const defaultNavLinks = [
  { label: 'DATA DRAFT', path: '/home' },
  { label: 'MOCK DRAFT', path: '/mock-draft' },
  { label: 'PLAYERS STATISTIC', path: '/players-statistic' },
  { label: 'WEEKLY REPORT', path: '/weekly-report' },
];
```

## Features
- ✅ Responsive design
- ✅ Active page highlighting
- ✅ User dropdown menu
- ✅ Click outside to close dropdown
- ✅ Tailwind CSS styling
- ✅ Customizable navigation links
- ✅ Callback functions for user actions

## Migration Guide

### Before (Old Header Code)
```jsx
// Remove this from your page
<header className="w-full fixed top-0 left-0 z-50 flex items-center justify-between px-12">
  {/* Logo */}
  <div className="flex items-center gap-4 select-none cursor-pointer">
    <img src={mobaImg} alt="Logo" className="h-32 w-32 object-contain" />
  </div>
  
  {/* Nav Links */}
  <nav className="flex justify-end w-full">
    {/* ... navigation code ... */}
  </nav>
  
  {/* User Dropdown */}
  <div className="relative user-dropdown">
    {/* ... dropdown code ... */}
  </div>
</header>
```

### After (New Header Component)
```jsx
// Add this import
import Header from '../components/Header';

// Replace the old header with this
<Header 
  currentUser={currentUser}
  onLogout={handleLogout}
  onShowProfile={() => setShowProfileModal(true)}
/>
```

## Notes
- The component automatically handles the dropdown state and click-outside behavior
- Navigation links are customizable via the `navLinks` prop
- The component uses the same styling as the original header
- All Tailwind classes are preserved 