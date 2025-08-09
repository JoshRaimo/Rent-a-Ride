# Rent-a-Ride

## Backend setup

1) Create `backend/.env`:

```
MONGO_URI=your_mongo_uri
JWT_SECRET=your_jwt_secret

# CarAPI server-side auth (token caching and auto-refresh)
CAR_API_TOKEN=your_carapi_token
CAR_API_SECRET=your_carapi_secret
```

2) Install and run:

```
cd backend
npm install
npm start
```

## Frontend setup

```
cd frontend
npm install
npm start
```

## Tests

- Backend: `cd backend && npm test`
- Frontend: `cd frontend && npm test`

CI runs both suites on push via GitHub Actions.