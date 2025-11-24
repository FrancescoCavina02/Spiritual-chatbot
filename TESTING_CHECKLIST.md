# Testing Checklist - Spiritual AI Guide Chatbot

**Date:** November 21, 2024  
**Tester:** Francesco Cavina  
**Version:** Pre-deployment testing

---

## Testing Legend

- ✅ **PASS** - Feature works as expected
- ❌ **FAIL** - Critical bug, must fix
- ⚠️ **WARN** - Minor issue, should fix
- 📝 **NOTE** - Improvement suggestion
- ⏭️ **SKIP** - Not tested yet

---

## 1. Home Page (`/`)

### Layout & Design
- [ ] Page loads correctly
- [ ] Navigation bar displays properly
- [ ] Hero section is visible and centered
- [ ] Search bar is present and styled
- [ ] CTA buttons are visible
- [ ] Feature cards display correctly
- [ ] Category grid displays
- [ ] Tech stack badges display
- [ ] Footer is present (if applicable)

### Functionality
- [ ] Search bar accepts input
- [ ] Search button is clickable
- [ ] Search button disabled when empty
- [ ] Clicking "Start Chatting" goes to /chat
- [ ] Clicking "Browse Notes" goes to /notes
- [ ] Search with query shows dropdown results
- [ ] Clicking search result navigates to note
- [ ] Search dropdown closes on ESC
- [ ] Search dropdown closes on outside click

### Responsive Design
- [ ] Mobile view (< 768px)
- [ ] Tablet view (768px - 1024px)
- [ ] Desktop view (> 1024px)
- [ ] Search bar stacks properly on mobile
- [ ] Navigation collapses on mobile
- [ ] Feature cards stack on mobile

### Issues Found
```
[Add issues here as we test]
```

---

## 2. Chat Page (`/chat`)

### Layout & Design
- [ ] Conversation sidebar displays (desktop)
- [ ] Conversation sidebar can collapse/expand
- [ ] Chat header is fixed at top
- [ ] Message area is scrollable
- [ ] Input area is fixed at bottom
- [ ] Citations panel displays (desktop, when available)
- [ ] Mobile drawer works for sidebar

### Conversation Management
- [ ] New conversation button creates new chat
- [ ] Conversation list displays all saved chats
- [ ] Active conversation is highlighted
- [ ] Clicking conversation loads it
- [ ] Delete button appears on hover
- [ ] First click on delete shows confirm
- [ ] Second click deletes conversation
- [ ] Timestamps display correctly ("2h ago")
- [ ] Sidebar state persists (localStorage)

### Chat Functionality
- [ ] Can type in message input
- [ ] Send button enabled when text present
- [ ] Send button disabled when empty
- [ ] Pressing Enter sends message
- [ ] Message appears in chat
- [ ] AI starts responding (loading state)
- [ ] Streaming text appears word by word
- [ ] Citations appear during response
- [ ] Citations are clickable
- [ ] Clicking citation opens note
- [ ] Conversation auto-saves
- [ ] Conversation auto-titles after first message
- [ ] Can send multiple messages
- [ ] Conversation history maintained
- [ ] Scroll to bottom on new message

### Error Handling
- [ ] Error message if backend is down
- [ ] Error message if message fails to send
- [ ] Can retry after error
- [ ] Network timeout handled gracefully

### Performance
- [ ] Streaming response is smooth
- [ ] No lag when typing
- [ ] Large conversations scroll smoothly
- [ ] Citations load quickly

### Issues Found
```
[Add issues here as we test]
```

---

## 3. Search Page (`/search`)

### Layout & Design
- [ ] Search header displays
- [ ] Search input is prominent
- [ ] Category dropdown displays
- [ ] Search button is styled
- [ ] Initial state shows examples
- [ ] Example searches are clickable
- [ ] Loading state shows spinner
- [ ] Results display in cards
- [ ] Result count shows
- [ ] Active filter displays

### Search Functionality
- [ ] Can type query
- [ ] Search button disabled when empty
- [ ] Clicking search executes search
- [ ] Pressing Enter executes search
- [ ] Loading spinner appears during search
- [ ] Results appear after search
- [ ] Relevance scores display (%)
- [ ] Score colors are correct (green/blue/yellow/gray)
- [ ] Category badges show
- [ ] Book badges show (when applicable)
- [ ] Snippets display (3 lines max)
- [ ] Clicking result opens note
- [ ] Search query in URL
- [ ] Category filter in URL

### Category Filtering
- [ ] Dropdown shows all categories
- [ ] Can select category
- [ ] "All Categories" option works
- [ ] Filtered results are accurate
- [ ] Filter indicator shows selected category

### State Persistence
- [ ] Search query persists in URL
- [ ] Can bookmark search URL
- [ ] Navigating away and back preserves search
- [ ] Results load from cache instantly
- [ ] Cache invalidates on query change

### Empty & Error States
- [ ] No results shows helpful message
- [ ] Search tips display when no results
- [ ] API error shows user-friendly message
- [ ] Can recover from error

### Issues Found
```
[Add issues here as we test]
```

---

## 4. Notes Page (`/notes`)

### Category Grid
- [ ] All categories display
- [ ] Category cards are clickable
- [ ] Note counts are accurate
- [ ] Categories are styled consistently
- [ ] Grid is responsive

### Category Detail Page (`/notes/category/{category}`)
- [ ] Breadcrumb navigation displays
- [ ] Category title shows
- [ ] Note/book count shows
- [ ] Search bar works
- [ ] Sort dropdown works
- [ ] Result count updates
- [ ] Clear filters button appears when active
- [ ] Clear filters resets everything

#### Hierarchical Categories (Books)
- [ ] Books display in grid
- [ ] Book cards show title
- [ ] Book cards show chapter count
- [ ] Clicking book opens book view
- [ ] Search filters books
- [ ] Sort by title A-Z works
- [ ] Sort by title Z-A works
- [ ] Sort by chapters works

#### Flat Categories (Notes)
- [ ] Notes display in list
- [ ] Note titles show
- [ ] Clicking note opens note
- [ ] Search filters notes
- [ ] Sort by title works

### Note Viewer (`/notes/{file_path}`)
- [ ] Note content displays
- [ ] Markdown renders correctly
- [ ] Code blocks render
- [ ] Lists render
- [ ] Headers render with hierarchy
- [ ] [[Wiki links]] are converted to clickable links
- [ ] Clicking wiki link navigates correctly
- [ ] Breadcrumbs display
- [ ] "Back to parent" button works (if applicable)
- [ ] Parent navigation works
- [ ] Sibling navigation displays
- [ ] Child notes display as cards
- [ ] Clicking child navigates correctly
- [ ] Metadata displays (depth, leaf status)
- [ ] Long notes are scrollable
- [ ] Images display (if any)

### Tree Navigation
- [ ] Can navigate through book hierarchy
- [ ] Chapter → Section → Subsection navigation works
- [ ] Breadcrumbs update correctly
- [ ] Back button works
- [ ] Browser back/forward work
- [ ] Deep links work (direct URL to note)

### Issues Found
```
[Add issues here as we test]
```

---

## 5. About Page (`/about`)

### Content
- [ ] Page exists
- [ ] Project description present
- [ ] Tech stack explained
- [ ] Your story/motivation included
- [ ] Contact information available
- [ ] GitHub link works
- [ ] LinkedIn link works (if applicable)

### Issues Found
```
[Add issues here as we test]
```

---

## 6. Cross-Feature Testing

### Navigation
- [ ] Can navigate between all pages
- [ ] Active page is highlighted in nav
- [ ] Logo click returns to home
- [ ] Browser back button works everywhere
- [ ] Deep links work for all pages

### Performance
- [ ] Initial page load < 3 seconds
- [ ] Navigation is instant (no full reload)
- [ ] Search results < 2 seconds
- [ ] Chat responses stream smoothly
- [ ] No memory leaks (test long sessions)

### Accessibility
- [ ] Can tab through interactive elements
- [ ] Focus indicators visible
- [ ] Screen reader compatible (basic test)
- [ ] Color contrast is sufficient
- [ ] Text is readable at all sizes

### Mobile Experience
- [ ] All features work on mobile
- [ ] Touch targets are large enough
- [ ] No horizontal scrolling
- [ ] Mobile navigation works
- [ ] Virtual keyboard doesn't break layout
- [ ] Can zoom in/out

### Edge Cases
- [ ] Very long message in chat
- [ ] Very long note title
- [ ] Special characters in search
- [ ] Empty conversations
- [ ] Empty categories
- [ ] Slow network simulation
- [ ] Offline behavior

### Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari
- [ ] Mobile Chrome

### Issues Found
```
[Add issues here as we test]
```

---

## 7. Backend API Testing

### Endpoints
- [ ] GET /health returns 200
- [ ] POST /api/chat/stream streams correctly
- [ ] POST /api/search returns results
- [ ] GET /api/notes lists notes
- [ ] GET /api/notes/{file_path} returns note
- [ ] GET /api/tree/books returns books
- [ ] GET /api/tree/{category}/{book} returns tree
- [ ] GET /api/tree/navigation/{file_path} returns context
- [ ] GET /stats returns accurate counts

### Error Handling
- [ ] Invalid endpoints return 404
- [ ] Malformed requests return 422
- [ ] Missing parameters return helpful errors
- [ ] Server errors return 500 with details

### Issues Found
```
[Add issues here as we test]
```

---

## 8. Data Integrity

### ChromaDB
- [ ] Total chunks: 1,772
- [ ] All categories represented
- [ ] All books indexed
- [ ] Search returns relevant results
- [ ] Metadata is accurate

### Tree Structure
- [ ] 69 books detected
- [ ] Hierarchical categories parsed correctly
- [ ] Flat categories parsed correctly
- [ ] Wiki links resolved correctly
- [ ] Parent-child relationships accurate

### Issues Found
```
[Add issues here as we test]
```

---

## Summary

### Critical Bugs (Must Fix)
```
[List P0 bugs here]
```

### High Priority Issues (Should Fix)
```
[List P1 issues here]
```

### Medium Priority Issues (Nice to Fix)
```
[List P2 issues here]
```

### Low Priority / Enhancements
```
[List P3 issues/ideas here]
```

---

## Next Steps

1. Fix all critical bugs
2. Fix high priority issues
3. Retest affected areas
4. Consider medium priority fixes
5. Document known low priority issues
6. Proceed to deployment


