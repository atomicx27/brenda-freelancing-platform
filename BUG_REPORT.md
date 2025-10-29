## Bug Report: `getUserPublicPortfolio` Controller

**File:** `brenda-backend/src/controllers/portfolioController.ts`
**Line Number:** 344

**Description:** The `getUserPublicPortfolio` function in the portfolio controller is intended to fetch a user's public portfolio items. However, the database query includes an `isActive: true` filter, which is not a valid field in the `PortfolioItem` model. This causes the query to fail and prevents any public portfolios from being retrieved.

**Proposed Fix:** I will remove the `isActive: true` filter from the `where` clause in the `getUserPublicPortfolio` function. This will allow the query to execute successfully and return the user's public portfolio items.
