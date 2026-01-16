# Alpha Release TODO

## Priority: High (Must Have)

- [x] Re-enable Proof-of-Work with reasonable difficulty ✅ (PRs #75-79: difficulty=10, enabled, documented)
  - See: `docs/architecture/PROOF_OF_WORK.md` for details
  - See: `docs/development/POW_VERIFICATION.md` for testing/monitoring
- [x] Add security headers back to nginx (CSP, etc.) ✅ (PR #72: security headers tightened)
- [x] Test delete page functionality thoroughly ✅ (Password-based deletion implemented)
- [ ] Add error handling for edge cases (expired pastes, invalid IDs)
- [x] Single-view paste functionality removed (simplified model)
- [ ] Verify expiration times work correctly
- [ ] Add rate limiting verification
- [ ] Security audit of CORS configuration

## Priority: Medium (Should Have)

- [ ] Add "Copy to Clipboard" buttons for URLs
- [ ] Improve mobile responsiveness
- [x] Add loading states/spinners during operations ✅ (PR #71: comprehensive loading states)
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

- [x] Document PoW system comprehensively ✅ (PRs #77-78)
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
- [x] Add health check endpoint
- [ ] Set up monitoring/logging
- [ ] Configure firewall rules

## Testing

- [ ] Write unit tests for server-side code
- [ ] Add integration tests
- [ ] Test with large pastes (near 1MB limit)
- [ ] Test concurrent paste creation
- [ ] Test rate limiting behavior
- [x] Test PoW under load ✅ (covered by unit tests + verification guide in PR #78)
- [ ] Security penetration testing
- [ ] Browser compatibility testing
