# Issues & Improvements Tracker

**Project:** Spiritual AI Guide Chatbot  
**Date Started:** November 21, 2024  
**Status:** Testing Phase

---

## 🔴 Critical Bugs (P0) - Must Fix Before Deployment

*Critical bugs that break core functionality or prevent users from using the app*

### Open
- None currently

### Fixed
- [x] **[BUG-001]** - Backend not loading .env file (OpenAI API key missing)
  - **Priority:** P0 (Critical)
  - **Component:** Backend
  - **Discovered:** Nov 21, 2024 (during testing)
  - **Issue:** Backend wasn't loading environment variables from .env, causing chat to fail with "Connection refused" when calling OpenAI API
  - **Fix:** Added `load_dotenv()` to backend/app/main.py
  - **Fixed By:** Commit f37c15c
  - **Verified:** ✅ Chat now works correctly

---

## 🟡 High Priority (P1) - Should Fix Before Deployment

*Important issues that significantly impact UX or functionality*

### Open
- [ ] **[ISSUE-001]** - *Add first high priority issue here*

### Fixed
- None yet

---

## 🟢 Medium Priority (P2) - Nice to Fix

*Minor issues or enhancements that improve UX*

### Open
- [ ] **[ENHANCE-001]** - *Add first medium priority item here*

### Fixed
- None yet

---

## 🔵 Low Priority (P3) - Future Enhancements

*Nice-to-have features or minor polish*

### Open
- [ ] **[FEATURE-001]** - *Add first low priority item here*

### Parked (For Later)
- None yet

---

## 📋 Testing Notes

### Session 1 - [Date]
*Testing notes go here*

---

## Template for New Issues

```markdown
### [CATEGORY-###] - Short Title

**Priority:** P0/P1/P2/P3  
**Component:** Frontend/Backend/Both  
**Page/Feature:** Specific page or feature  
**Discovered:** Date  
**Status:** Open/In Progress/Fixed  

**Description:**
Clear description of the issue

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. ...

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Screenshots/Logs:**
[If applicable]

**Proposed Fix:**
How to fix it

**Fixed By:** [Commit hash or PR number]  
**Verified:** [Date verified]
```

