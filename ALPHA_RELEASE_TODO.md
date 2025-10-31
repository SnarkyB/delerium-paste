# Alpha Release TODO

## Priority: High (Must Have)

- [ ] Re-enable Proof-of-Work with reasonable difficulty (currently disabled)
- [ ] Add security headers back to nginx (CSP, etc.)
- [ ] Test delete page functionality thoroughly
- [ ] Add error handling for edge cases (expired pastes, invalid IDs)
- [ ] Test single-view paste functionality
- [ ] Verify expiration times work correctly
- [ ] Add rate limiting verification
- [ ] Security audit of CORS configuration

## Priority: Medium (Should Have)

- [ ] Add "Copy to Clipboard" buttons for URLs
- [ ] Improve mobile responsiveness
- [ ] Add loading states/spinners during operations
- [ ] Better error messages for users
- [ ] Add favicon
- [ ] Improve styling/branding
- [ ] Add paste size limits UI feedback
- [ ] Test in multiple browsers (Chrome, Firefox, Safari, Edge)

## Priority: Low (Nice to Have)

- [ ] Add syntax highlighting option
- [ ] Add paste expiry countdown on view page
- [ ] Add "Create Another Paste" link on success
- [ ] Add analytics (privacy-respecting)
- [ ] Add API documentation
- [ ] Add keyboard shortcuts
- [ ] Dark mode toggle

## Documentation

- [ ] Update README with production deployment guide
- [ ] Add CHANGELOG
- [ ] Add CONTRIBUTING guidelines
- [ ] Add security best practices
- [ ] Document API endpoints properly
- [ ] Add screenshots/demo

## DevOps

- [ ] Set up production environment variables
- [ ] Configure proper DELETION_TOKEN_PEPPER
- [ ] Set up SSL/TLS certificates
- [ ] Configure domain name
- [ ] Set up backup strategy for database
- [ ] Add health check endpoint
- [ ] Set up monitoring/logging
- [ ] Configure firewall rules

## Testing

- [ ] Write unit tests for server-side code
- [ ] Add integration tests
- [ ] Test with large pastes (near 1MB limit)
- [ ] Test concurrent paste creation
- [ ] Test rate limiting behavior
- [ ] Test PoW under load
- [ ] Security penetration testing
- [ ] Browser compatibility testing
