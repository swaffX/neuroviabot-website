# QA Testing Checklist

## Manual Testing

### ✅ Critical Paths

#### Authentication
- [ ] Login with Discord
- [ ] Logout
- [ ] Session persistence
- [ ] Unauthorized access redirects

#### Server Management
- [ ] View server list
- [ ] Filter servers (bot present/not present)
- [ ] Search servers
- [ ] Switch view modes (grid/list)
- [ ] Add bot to server
- [ ] Navigate to manage page

#### Manage Dashboard
- [ ] Load server settings
- [ ] Switch between modules
- [ ] Toggle feature on/off
- [ ] View audit logs
- [ ] Real-time socket updates
- [ ] Server switcher dropdown

#### Commands Page
- [ ] View all command categories
- [ ] Search commands
- [ ] Copy command usage (click)
- [ ] Keyboard navigation (↑↓ Enter)
- [ ] Focus search with `/` key

### ✅ Responsive Design

#### Breakpoints to Test
- [ ] Mobile (< 640px)
- [ ] Tablet (640px - 1024px)
- [ ] Desktop (> 1024px)
- [ ] Ultra-wide (> 1920px)

#### Components
- [ ] Navbar collapses on mobile
- [ ] Sidebar drawer on mobile
- [ ] Grid layouts stack properly
- [ ] Touch interactions work
- [ ] No horizontal scroll

### ✅ Error Handling

#### Network Errors
- [ ] API timeout handling
- [ ] 404 errors show proper message
- [ ] 500 errors show fallback UI
- [ ] Retry logic works
- [ ] Loading states display

#### Edge Cases
- [ ] Empty server list
- [ ] No search results
- [ ] Disconnected socket
- [ ] Invalid guild ID
- [ ] Missing permissions

### ✅ Performance

#### Load Times
- [ ] Initial page load < 3s
- [ ] Route transitions smooth
- [ ] Images load progressively
- [ ] No layout shift (CLS)

#### Interactions
- [ ] Buttons respond instantly
- [ ] Smooth animations (60fps)
- [ ] No janky scrolling
- [ ] Search is debounced

### ✅ Accessibility

#### Keyboard Navigation
- [ ] Tab order logical
- [ ] All interactive elements focusable
- [ ] Focus indicators visible
- [ ] Keyboard shortcuts work
- [ ] Escape closes modals

#### Screen Readers
- [ ] Alt text on images
- [ ] ARIA labels present
- [ ] Semantic HTML used
- [ ] Form labels associated

#### Visual
- [ ] Color contrast sufficient (WCAG AA)
- [ ] Text readable at 200% zoom
- [ ] No content only by color
- [ ] Focus indicators clear

## Automated Testing

### Unit Tests
```bash
npm test
```
- [ ] API utils
- [ ] Helper functions
- [ ] Component logic

### Integration Tests
```bash
npm run test:integration
```
- [ ] API endpoints
- [ ] Database operations
- [ ] Socket.IO events

### E2E Tests
```bash
npm run test:e2e
```
- [ ] Full user flows
- [ ] Multi-step processes
- [ ] Real browser testing

## Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Security

- [ ] No exposed secrets in code
- [ ] API authentication working
- [ ] CORS configured correctly
- [ ] Session secure
- [ ] Input validation
- [ ] XSS prevention

## Deployment Verification

### Pre-Deploy
- [ ] All tests passing
- [ ] Build succeeds
- [ ] No console errors
- [ ] Environment variables set
- [ ] Database migrations run

### Post-Deploy
- [ ] Health check endpoint responds
- [ ] Static assets load
- [ ] API endpoints accessible
- [ ] Socket.IO connects
- [ ] Logs show no errors

### Monitoring (24h after deploy)
- [ ] Error rate normal
- [ ] Response times acceptable
- [ ] No memory leaks
- [ ] Socket connections stable
- [ ] User reports reviewed

## Performance Benchmarks

### Lighthouse Scores (Target)
- Performance: ≥ 90
- Accessibility: ≥ 95
- Best Practices: ≥ 90
- SEO: ≥ 90

### Core Web Vitals
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

## Notes

- All checkboxes should be completed before production deployment
- Any failures should be documented and fixed
- Optional items can be deferred to future releases
- Performance metrics should be monitored continuously
