# Portfolio API Endpoints - Complete Documentation

## 📚 Overview
This document describes all available portfolio endpoints in the Brenda Freelancing Platform.

---

## 🌐 Public Endpoints (No Authentication Required)

### 1. Browse Portfolio Items
**GET** `/api/portfolio/browse`

Browse all public portfolio items with pagination and advanced filtering.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 12) - Items per page
- `category` (string) - Filter by category
- `tags` (string) - Comma-separated tags (e.g., "React,Node.js")
- `technologies` (string) - Comma-separated technologies
- `featured` (boolean) - Filter only featured items
- `search` (string) - Search in title and description
- `sortBy` (string, default: "createdAt") - Sort field
- `sortOrder` (string, default: "desc") - Sort direction (asc/desc)

**Response:**
```json
{
  "success": true,
  "message": "Portfolio items retrieved successfully",
  "data": {
    "items": [...],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 12,
      "totalPages": 5
    }
  }
}
```

---

### 2. Get Featured Portfolio
**GET** `/api/portfolio/featured`

Get featured portfolio items across the platform, sorted by views and likes.

**Query Parameters:**
- `limit` (number, default: 10) - Maximum items to return

**Response:**
```json
{
  "success": true,
  "message": "Featured portfolio items retrieved successfully",
  "data": [...]
}
```

---

### 3. Search Portfolio
**GET** `/api/portfolio/search`

Search portfolio items by keywords across title, description, category, tags, and technologies.

**Query Parameters:**
- `q` (string, **required**) - Search query
- `category` (string) - Filter by category
- `page` (number, default: 1)
- `limit` (number, default: 12)

**Response:**
```json
{
  "success": true,
  "message": "Search results retrieved successfully",
  "data": {
    "items": [...],
    "pagination": {...}
  }
}
```

---

### 4. Get User's Public Portfolio
**GET** `/api/portfolio/public/user/:userId`

View all public portfolio items for a specific user.

**Path Parameters:**
- `userId` (string) - User ID

**Query Parameters:**
- `category` (string) - Filter by category
- `featured` (boolean) - Filter only featured items

**Response:**
```json
{
  "success": true,
  "message": "Public portfolio retrieved successfully",
  "data": [
    {
      "id": "...",
      "title": "...",
      "description": "...",
      "category": "...",
      "viewCount": 120,
      "likeCount": 15,
      "user": {
        "id": "...",
        "firstName": "...",
        "lastName": "...",
        "avatar": "...",
        "bio": "..."
      }
    }
  ]
}
```

---

### 5. Get Single Public Portfolio Item
**GET** `/api/portfolio/public/item/:id`

View a single public portfolio item with full details.

**Path Parameters:**
- `id` (string) - Portfolio item ID

**Response:**
```json
{
  "success": true,
  "message": "Public portfolio item retrieved successfully",
  "data": {...}
}
```

---

### 6. Get Portfolio Categories
**GET** `/api/portfolio/categories`

Get all unique categories from public portfolio items.

**Response:**
```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": ["Web Development", "Mobile App", "UI/UX Design", ...]
}
```

---

### 7. Track Portfolio View
**POST** `/api/portfolio/:id/view`

Track a view on a portfolio item. Authentication is optional - can track anonymous views.

**Path Parameters:**
- `id` (string) - Portfolio item ID

**Response:**
```json
{
  "success": true,
  "message": "View tracked successfully"
}
```

---

## 🔐 Authenticated Endpoints (Require Bearer Token)

### 8. Get Own Portfolio
**GET** `/api/portfolio`

Get all portfolio items for the authenticated user.

**Query Parameters:**
- `category` (string) - Filter by category
- `featured` (boolean) - Filter only featured items
- `isPublic` (boolean) - Filter by public/private

**Response:**
```json
{
  "success": true,
  "message": "Portfolio retrieved successfully",
  "data": [...]
}
```

---

### 9. Get Single Portfolio Item
**GET** `/api/portfolio/:id`

Get a specific portfolio item (must own it).

**Path Parameters:**
- `id` (string) - Portfolio item ID

---

### 10. Create Portfolio Item
**POST** `/api/portfolio`

Create a new portfolio item.

**Request Body:**
```json
{
  "title": "My Awesome Project",
  "description": "A detailed description...",
  "category": "Web Development",
  "tags": ["React", "Node.js", "MongoDB"],
  "images": ["url1", "url2"],
  "liveUrl": "https://example.com",
  "githubUrl": "https://github.com/user/repo",
  "technologies": ["React", "Express", "PostgreSQL"],
  "startDate": "2024-01-01",
  "endDate": "2024-06-01",
  "isPublic": true,
  "featured": false
}
```

**Validation:**
- `title` - Required, 3-100 characters
- `category` - Required, 2-50 characters
- `liveUrl` - Optional, must be valid URL if provided
- `githubUrl` - Optional, must be valid URL if provided

**Response:**
```json
{
  "success": true,
  "message": "Portfolio item created successfully",
  "data": {...}
}
```

---

### 11. Update Portfolio Item
**PUT** `/api/portfolio/:id`

Update an existing portfolio item (must own it).

**Path Parameters:**
- `id` (string) - Portfolio item ID

**Request Body:** (all fields optional)
```json
{
  "title": "Updated Title",
  "featured": true,
  "isPublic": false,
  ...
}
```

---

### 12. Delete Portfolio Item
**DELETE** `/api/portfolio/:id`

Delete a portfolio item (must own it).

**Path Parameters:**
- `id` (string) - Portfolio item ID

---

### 13. Toggle Like
**POST** `/api/portfolio/:id/like`

Like or unlike a portfolio item.

**Path Parameters:**
- `id` (string) - Portfolio item ID

**Response:**
```json
{
  "success": true,
  "message": "Portfolio item liked",
  "data": { "liked": true }
}
```

---

### 14. Get Portfolio Statistics
**GET** `/api/portfolio/stats/overview`

Get overall portfolio statistics for the authenticated user.

**Response:**
```json
{
  "success": true,
  "message": "Portfolio statistics retrieved successfully",
  "data": {
    "totalItems": 15,
    "totalViews": 1250,
    "totalLikes": 87,
    "featuredItems": 3
  }
}
```

---

### 15. Get Portfolio Item Statistics
**GET** `/api/portfolio/:id/stats`

Get detailed statistics for a specific portfolio item.

**Path Parameters:**
- `id` (string) - Portfolio item ID

**Response:**
```json
{
  "success": true,
  "message": "Portfolio item statistics retrieved successfully",
  "data": {
    "viewCount": 120,
    "likeCount": 15,
    "viewsByDate": {
      "2024-10-26": 12,
      "2024-10-27": 8,
      "2024-10-28": 5
    }
  }
}
```

---

### 16. Bulk Update Portfolio Items
**POST** `/api/portfolio/bulk/update`

Update multiple portfolio items at once.

**Request Body:**
```json
{
  "itemIds": ["id1", "id2", "id3"],
  "updates": {
    "isPublic": true,
    "featured": false,
    "category": "Web Development"
  }
}
```

**Allowed Update Fields:**
- `isPublic` (boolean)
- `featured` (boolean)
- `isActive` (boolean)
- `category` (string)

**Response:**
```json
{
  "success": true,
  "message": "3 portfolio items updated successfully",
  "data": { "updatedCount": 3 }
}
```

---

### 17. Reorder Portfolio Items
**POST** `/api/portfolio/bulk/reorder`

Change the display order of portfolio items.

**Request Body:**
```json
{
  "itemOrders": [
    { "id": "item1", "order": 1 },
    { "id": "item2", "order": 2 },
    { "id": "item3", "order": 3 }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Portfolio items reordered successfully"
}
```

---

## 📊 Database Schema

### PortfolioItem
```prisma
model PortfolioItem {
  id           String             @id @default(cuid())
  userId       String
  title        String
  description  String?
  category     String
  tags         String[]           @default([])
  images       String[]           @default([])
  liveUrl      String?
  githubUrl    String?
  technologies String[]           @default([])
  startDate    DateTime?
  endDate      DateTime?
  isActive     Boolean            @default(true)
  isPublic     Boolean            @default(true)
  featured     Boolean            @default(false)
  viewCount    Int                @default(0)
  likeCount    Int                @default(0)
  displayOrder Int                @default(0)
  createdAt    DateTime           @default(now())
  updatedAt    DateTime           @updatedAt
  user         User               @relation(...)
  views        PortfolioView[]
  likes        PortfolioLike[]
}
```

### PortfolioView
```prisma
model PortfolioView {
  id              String        @id @default(cuid())
  portfolioItemId String
  userId          String?
  ipAddress       String?
  userAgent       String?
  viewedAt        DateTime      @default(now())
  portfolioItem   PortfolioItem @relation(...)
}
```

### PortfolioLike
```prisma
model PortfolioLike {
  id              String        @id @default(cuid())
  portfolioItemId String
  userId          String
  createdAt       DateTime      @default(now())
  portfolioItem   PortfolioItem @relation(...)
  
  @@unique([portfolioItemId, userId])
}
```

---

## 🚀 Frontend Usage Examples

```javascript
// Browse portfolio
const result = await apiService.browsePortfolio({
  page: 1,
  limit: 12,
  category: 'Web Development',
  tags: 'React,Node.js',
  sortBy: 'viewCount',
  sortOrder: 'desc'
});

// Search
const searchResults = await apiService.searchPortfolio('e-commerce', {
  category: 'Web Development',
  page: 1
});

// Get featured items
const featured = await apiService.getFeaturedPortfolio(10);

// View user's public portfolio
const userPortfolio = await apiService.getUserPublicPortfolio('user-id');

// Track view (anonymous or authenticated)
await apiService.trackPortfolioView('item-id');

// Like item (requires auth)
await apiService.togglePortfolioLike('item-id');

// Get stats (requires auth)
const stats = await apiService.getPortfolioStats();
const itemStats = await apiService.getPortfolioItemStats('item-id');

// Bulk operations (requires auth)
await apiService.bulkUpdatePortfolio(['id1', 'id2'], { 
  featured: true 
});

await apiService.reorderPortfolio([
  { id: 'id1', order: 1 },
  { id: 'id2', order: 2 }
]);
```

---

## ✅ Testing

Run the test script:
```bash
node test-all-portfolio-endpoints.js
```

For authenticated endpoints, update the `TEST_AUTH_TOKEN` variable in the test script with a valid JWT token.

---

## 📝 Notes

1. **URL Validation**: The `liveUrl` and `githubUrl` fields accept empty strings or valid URLs
2. **View Tracking**: Views can be tracked anonymously (without authentication)
3. **Like System**: Requires authentication and prevents duplicate likes per user
4. **Public/Private**: Only `isPublic: true` items appear in public endpoints
5. **Pagination**: Default page size is 12 items
6. **Search**: Searches across title, description, category, tags, and technologies

---

**Last Updated:** October 28, 2025
