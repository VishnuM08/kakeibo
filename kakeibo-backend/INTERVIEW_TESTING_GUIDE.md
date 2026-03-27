# API Testing - Simple Interview Guide

## What is API Testing? (Elevator Pitch)

**"API testing is checking if our backend endpoints work correctly - like testing if a user can register, login, create expenses, and get proper error messages when something goes wrong."**

---

## Why Do We Test APIs?

1. **Catch bugs early** - Before users find them
2. **Ensure reliability** - API works under different conditions
3. **Prevent breaking changes** - New code doesn't break old features
4. **Build confidence** - Safe to deploy to production

---

## 3 Main Types of API Tests (Simple)

### 1. **Unit Tests** (Test One Small Part)
- Test individual methods/functions in isolation
- Fast and focused
- Mock external dependencies

**Example:** Testing if password encryption works
```java
@Test
void shouldHashPassword() {
    String hashed = passwordEncoder.encode("myPassword");
    assertTrue(passwordEncoder.matches("myPassword", hashed));
}
```

---

### 2. **Integration Tests** (Test Complete Flow)
- Test entire API endpoints from request to response
- Uses real database (test database)
- Most important for API testing

**Example:** Testing user registration end-to-end
```java
@Test
void shouldRegisterNewUser() {
    // Send POST request to /api/auth/register
    ResponseEntity<User> response = restTemplate.postForEntity(
        "/api/auth/register",
        new RegisterRequest("john@email.com", "pass123"),
        User.class
    );
    
    // Check response is successful
    assertEquals(HttpStatus.CREATED, response.getStatusCode());
    assertEquals("john@email.com", response.getBody().getEmail());
}
```

---

### 3. **Controller Tests** (Test API Layer Only)
- Test controller logic without starting full server
- Mock the service layer
- Faster than integration tests

**Example:** Testing expense API with mocked service
```java
@Test
void shouldGetExpenseById() throws Exception {
    when(expenseService.getById(1L)).thenReturn(mockExpense);
    
    mockMvc.perform(get("/api/expenses/1"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(1));
}
```

---

## Testing Flow (What to Tell Interviewer)

### **Step-by-Step Process:**

```
1. WRITE TEST FIRST (Optional - TDD approach)
   ↓
2. ARRANGE (Setup test data)
   - Create request object
   - Prepare expected response
   ↓
3. ACT (Make API call)
   - Send HTTP request (GET, POST, PUT, DELETE)
   ↓
4. ASSERT (Verify results)
   - Check status code (200, 400, 404, etc.)
   - Verify response body
   - Check database if needed
   ↓
5. RUN TESTS (Maven/Gradle)
   - Run: ./mvnw test
   ↓
6. FIX IF FAILS
   ↓
7. COMMIT CODE
```

---

## Real Example - User Registration Flow

### **Scenario:** Test user registration API

```java
@SpringBootTest
class UserRegistrationTest {
    
    @Test
    void testUserRegistration() {
        // ARRANGE - Prepare test data
        RegisterRequest request = new RegisterRequest();
        request.setEmail("test@example.com");
        request.setPassword("SecurePass123");
        request.setUsername("testuser");
        
        // ACT - Call the API
        ResponseEntity<UserResponse> response = restTemplate.postForEntity(
            "/api/auth/register", 
            request, 
            UserResponse.class
        );
        
        // ASSERT - Check results
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("test@example.com", response.getBody().getEmail());
        
        // VERIFY - Check database
        User savedUser = userRepository.findByEmail("test@example.com").get();
        assertEquals("testuser", savedUser.getUsername());
    }
}
```

### **What This Test Does:**
1. ✅ Sends registration request with email & password
2. ✅ Checks response status is 201 (CREATED)
3. ✅ Verifies email in response matches
4. ✅ Confirms user is saved in database

---

## Testing Different Scenarios (Important!)

### **Always Test Both:**

#### ✅ **Happy Path** (Success Cases)
- Valid data → Should work
- User registers → Returns 201 Created
- User logs in → Returns JWT token

#### ❌ **Negative Cases** (Error Cases)
- Invalid data → Should fail with proper error
- Duplicate email → Returns 400 Bad Request
- Wrong password → Returns 401 Unauthorized
- Missing fields → Returns 400 with error message

**Example:**
```java
@Test
void shouldRejectDuplicateEmail() {
    // Register first user
    registerUser("test@example.com", "pass123");
    
    // Try to register again with same email
    ResponseEntity<ErrorResponse> response = registerUser("test@example.com", "pass123");
    
    assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    assertTrue(response.getBody().getMessage().contains("already exists"));
}
```

---

## Key Testing Concepts (Interview Points)

### 1. **Test Isolation**
- Each test runs independently
- Clean database before/after tests
- Tests don't depend on each other

### 2. **Mock vs Real**
- **Mock:** Fake objects (faster, unit tests)
- **Real:** Actual database/services (integration tests)

### 3. **Test Coverage**
- Aim for 70-80% code coverage
- Focus on critical business logic
- Don't just chase 100% blindly

### 4. **AAA Pattern**
- **Arrange:** Setup test data
- **Act:** Execute the code
- **Assert:** Verify results

---

## Testing Secured APIs (With JWT)

### **Scenario:** Test protected endpoint

```java
@Test
void shouldAccessProtectedEndpointWithToken() {
    // 1. Login and get JWT token
    String token = loginAndGetToken("user@example.com", "password");
    
    // 2. Add token to request header
    HttpHeaders headers = new HttpHeaders();
    headers.setBearerAuth(token);
    HttpEntity<Void> entity = new HttpEntity<>(headers);
    
    // 3. Call protected API
    ResponseEntity<List> response = restTemplate.exchange(
        "/api/expenses",
        HttpMethod.GET,
        entity,
        List.class
    );
    
    // 4. Should succeed
    assertEquals(HttpStatus.OK, response.getStatusCode());
}
```

**What to Say:**
*"For secured endpoints, we first authenticate to get a JWT token, then include that token in the Authorization header for subsequent requests. We test both authorized and unauthorized access scenarios."*

---

## Common Interview Questions & Answers

### Q1: **"How do you test APIs in your project?"**
**A:** "I write integration tests using Spring Boot Test framework with TestRestTemplate. I test both success and failure scenarios - like testing user registration works with valid data, and returns proper error messages with invalid data. I also write controller tests using MockMvc to test the API layer in isolation."

---

### Q2: **"What's the difference between unit and integration tests?"**
**A:** "Unit tests check individual methods in isolation with mocked dependencies - they're fast but limited. Integration tests check the complete flow from API endpoint to database - they're slower but give more confidence. For APIs, integration tests are more valuable because they verify the entire request-response cycle."

---

### Q3: **"How do you handle test data?"**
**A:** "I use an H2 in-memory database for tests with a test profile. Each test creates its own data in the setup phase and cleans up afterwards. This keeps tests isolated and fast. For example, before testing user login, I first create a test user, then verify login works with those credentials."

---

### Q4: **"What do you test in an API?"**
**A:** "I test four main things:
1. **Status codes** - Is it 200, 400, 404?
2. **Response body** - Does it have correct data?
3. **Database changes** - Is data saved correctly?
4. **Error handling** - Do errors return proper messages?"

---

### Q5: **"How do you test authentication?"**
**A:** "I test the complete auth flow:
- Registration creates user and returns success
- Login with valid credentials returns JWT token
- Protected endpoints reject requests without token
- Protected endpoints accept requests with valid token
- Token expiration returns 401 Unauthorized"

---

## Testing Tools in Spring Boot

| Tool | Purpose | When to Use |
|------|---------|-------------|
| **JUnit 5** | Test framework | All tests |
| **MockMvc** | Test controllers | Controller layer tests |
| **TestRestTemplate** | Test full APIs | Integration tests |
| **Mockito** | Mock dependencies | Unit tests |
| **H2 Database** | In-memory DB | Test data |
| **@WebMvcTest** | Test controllers only | Fast controller tests |
| **@SpringBootTest** | Test full app | Integration tests |

---

## Quick Commands (Memorize These)

```bash
# Run all tests
./mvnw test

# Run specific test
./mvnw test -Dtest=UserApiTest

# Run with coverage report
./mvnw test jacoco:report

# Skip tests (during build)
./mvnw clean install -DskipTests
```

---

## Sample Test Structure (Show in Interview)

```java
@SpringBootTest(webEnvironment = RANDOM_PORT)
@ActiveProfiles("test")
class ExpenseApiTest {
    
    @Autowired
    private TestRestTemplate restTemplate;
    
    @Autowired
    private ExpenseRepository expenseRepository;
    
    @BeforeEach
    void setup() {
        expenseRepository.deleteAll(); // Clean database
    }
    
    @Test
    @DisplayName("Should create expense and return 201")
    void testCreateExpense() {
        // ARRANGE
        ExpenseRequest request = new ExpenseRequest("Coffee", 5.50, "Food");
        
        // ACT
        ResponseEntity<Expense> response = restTemplate.postForEntity(
            "/api/expenses", request, Expense.class);
        
        // ASSERT
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody().getId());
        assertEquals("Coffee", response.getBody().getDescription());
        assertEquals(5.50, response.getBody().getAmount());
    }
}
```

---

## Pro Tips for Interview

### ✅ **DO SAY:**
- "I follow the AAA pattern - Arrange, Act, Assert"
- "I test both success and failure scenarios"
- "I use H2 in-memory database for test isolation"
- "I check status codes, response body, and database state"
- "I aim for meaningful tests over 100% coverage"
- "I run tests before every commit"

### ❌ **DON'T SAY:**
- "I only test happy paths"
- "I skip writing tests to save time"
- "I test on production database"
- "I don't know how to test secured endpoints"
- "Tests are not important"

---

## Final Interview Script (Practice This)

**Interviewer:** "How do you test your REST APIs?"

**You:** 
> "I write integration tests using Spring Boot Test framework. For example, to test user registration, I use TestRestTemplate to send a POST request to /api/auth/register with test data. Then I verify three things: first, the HTTP status is 201 Created; second, the response contains the correct user data; and third, I check the database to confirm the user was actually saved.
>
> I also test negative scenarios - like what happens if someone tries to register with a duplicate email or invalid password. The test should verify it returns a 400 Bad Request with a proper error message.
>
> For secured endpoints, I first authenticate to get a JWT token, then include it in the Authorization header. I test that valid tokens work and invalid/missing tokens are rejected.
>
> I use H2 in-memory database for tests so they're fast and isolated. Each test cleans up after itself. I follow the AAA pattern - Arrange the test data, Act by calling the API, and Assert the results."

---

## One More Complete Example (Login Flow)

```java
@Test
void testCompleteLoginFlow() {
    // STEP 1: Register a user first
    RegisterRequest registerReq = new RegisterRequest(
        "test@example.com", 
        "password123", 
        "testuser"
    );
    restTemplate.postForEntity("/api/auth/register", registerReq, UserResponse.class);
    
    // STEP 2: Try to login
    LoginRequest loginReq = new LoginRequest("test@example.com", "password123");
    ResponseEntity<AuthResponse> response = restTemplate.postForEntity(
        "/api/auth/login", 
        loginReq, 
        AuthResponse.class
    );
    
    // STEP 3: Verify login successful and token received
    assertEquals(HttpStatus.OK, response.getStatusCode());
    assertNotNull(response.getBody().getToken());
    assertTrue(response.getBody().getToken().length() > 50); // JWT tokens are long
    
    // STEP 4: Use token to access protected endpoint
    String token = response.getBody().getToken();
    HttpHeaders headers = new HttpHeaders();
    headers.setBearerAuth(token);
    
    ResponseEntity<UserProfile> profileResponse = restTemplate.exchange(
        "/api/users/profile",
        HttpMethod.GET,
        new HttpEntity<>(headers),
        UserProfile.class
    );
    
    // STEP 5: Verify protected endpoint works
    assertEquals(HttpStatus.OK, profileResponse.getStatusCode());
    assertEquals("test@example.com", profileResponse.getBody().getEmail());
}
```

**What to Explain:**
*"This test verifies the complete authentication flow - from registration, to login, to accessing protected resources. It ensures the JWT token works end-to-end."*

---

## Summary Checklist

When explaining API testing in interview, cover:

- ✅ What: Testing backend endpoints work correctly
- ✅ Why: Catch bugs, ensure reliability, prevent breaking changes
- ✅ How: Integration tests with TestRestTemplate, Controller tests with MockMvc
- ✅ What to test: Status codes, response body, database state, errors
- ✅ Tools: JUnit 5, Spring Boot Test, H2, Mockito
- ✅ Process: Arrange → Act → Assert
- ✅ Scenarios: Both success and failure cases
- ✅ Security: Test with/without JWT tokens

---

**Good luck with your interview! 🚀**

Remember: Keep it simple, give concrete examples, and show you understand WHY testing matters, not just HOW to write tests.
