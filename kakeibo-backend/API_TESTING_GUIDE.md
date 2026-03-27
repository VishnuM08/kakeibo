# API Testing Guide for Kakeibo Backend

## Overview
This guide covers API testing strategies for the Kakeibo expense tracker backend built with Spring Boot.

## Testing Dependencies

The project includes:
- **spring-boot-starter-test**: JUnit 5, Mockito, AssertJ, Hamcrest
- **spring-security-test**: Testing utilities for secured endpoints
- **H2 Database**: In-memory database for testing
- **TestRestTemplate & MockMvc**: API testing frameworks

---

## 1. Integration Tests with @SpringBootTest

Full end-to-end testing with real application context.

### Example: User Registration API Test

```java
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class UserApiIntegrationTest {
    
    @Autowired
    private TestRestTemplate restTemplate;
    
    @Autowired
    private UserRepository userRepository;
    
    @BeforeEach
    void setup() {
        userRepository.deleteAll();
    }
    
    @Test
    @DisplayName("Should register a new user successfully")
    void shouldRegisterUser() {
        // Arrange
        RegisterRequest request = RegisterRequest.builder()
            .email("test@example.com")
            .password("SecurePass123")
            .username("testuser")
            .build();
        
        // Act
        ResponseEntity<UserResponse> response = restTemplate.postForEntity(
            "/api/auth/register", 
            request, 
            UserResponse.class
        );
        
        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getEmail()).isEqualTo("test@example.com");
        
        // Verify in database
        User savedUser = userRepository.findByEmail("test@example.com").orElseThrow();
        assertThat(savedUser.getUsername()).isEqualTo("testuser");
    }
    
    @Test
    @DisplayName("Should return 400 when email already exists")
    void shouldRejectDuplicateEmail() {
        // Arrange - create existing user
        RegisterRequest request = new RegisterRequest("test@example.com", "pass123", "user1");
        restTemplate.postForEntity("/api/auth/register", request, UserResponse.class);
        
        // Act - try to register again
        ResponseEntity<ErrorResponse> response = restTemplate.postForEntity(
            "/api/auth/register", 
            request, 
            ErrorResponse.class
        );
        
        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }
}
```

---

## 2. Controller Tests with @WebMvcTest

Test controller layer in isolation with mocked services.

### Example: Expense Controller Test

```java
@WebMvcTest(ExpenseController.class)
@AutoConfigureMockMvc(addFilters = false) // Disable security for unit tests
class ExpenseControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @MockBean
    private ExpenseService expenseService;
    
    @Test
    @DisplayName("Should get expense by ID")
    void shouldGetExpenseById() throws Exception {
        // Arrange
        Expense expense = Expense.builder()
            .id(1L)
            .description("Grocery shopping")
            .amount(new BigDecimal("50.00"))
            .category("Food")
            .build();
        
        when(expenseService.getExpenseById(1L)).thenReturn(expense);
        
        // Act & Assert
        mockMvc.perform(get("/api/expenses/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.description").value("Grocery shopping"))
            .andExpect(jsonPath("$.amount").value(50.00))
            .andExpect(jsonPath("$.category").value("Food"));
        
        verify(expenseService, times(1)).getExpenseById(1L);
    }
    
    @Test
    @DisplayName("Should create new expense")
    void shouldCreateExpense() throws Exception {
        // Arrange
        ExpenseRequest request = new ExpenseRequest("Coffee", new BigDecimal("5.50"), "Food");
        Expense savedExpense = Expense.builder()
            .id(1L)
            .description("Coffee")
            .amount(new BigDecimal("5.50"))
            .category("Food")
            .build();
        
        when(expenseService.createExpense(any(ExpenseRequest.class))).thenReturn(savedExpense);
        
        // Act & Assert
        mockMvc.perform(post("/api/expenses")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "description": "Coffee",
                        "amount": 5.50,
                        "category": "Food"
                    }
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.description").value("Coffee"));
    }
}
```

---

## 3. Testing Secured Endpoints

Testing APIs with Spring Security and JWT authentication.

### Example: Protected Endpoint Test

```java
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class SecuredApiTest {
    
    @Autowired
    private TestRestTemplate restTemplate;
    
    @Autowired
    private JwtTokenProvider jwtTokenProvider;
    
    private String validToken;
    
    @BeforeEach
    void setup() {
        // Generate JWT token for testing
        validToken = jwtTokenProvider.generateToken("test@example.com");
    }
    
    @Test
    @DisplayName("Should access protected endpoint with valid token")
    void shouldAccessWithValidToken() {
        // Arrange
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(validToken);
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        
        // Act
        ResponseEntity<String> response = restTemplate.exchange(
            "/api/expenses",
            HttpMethod.GET,
            entity,
            String.class
        );
        
        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }
    
    @Test
    @DisplayName("Should reject request without token")
    void shouldRejectWithoutToken() {
        // Act
        ResponseEntity<String> response = restTemplate.getForEntity(
            "/api/expenses",
            String.class
        );
        
        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }
}
```

### Using @WithMockUser

```java
@WebMvcTest(ExpenseController.class)
class ExpenseControllerSecurityTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @MockBean
    private ExpenseService expenseService;
    
    @Test
    @WithMockUser(username = "user@example.com", roles = {"USER"})
    @DisplayName("Should allow authenticated user to access expenses")
    void authenticatedUserCanAccess() throws Exception {
        mockMvc.perform(get("/api/expenses"))
            .andExpect(status().isOk());
    }
    
    @Test
    @DisplayName("Should deny access to unauthenticated users")
    void unauthenticatedUserCannotAccess() throws Exception {
        mockMvc.perform(get("/api/expenses"))
            .andExpect(status().isUnauthorized());
    }
}
```

---

## 4. Test Configuration

### Create `src/test/resources/application-test.properties`

```properties
# Test Profile Configuration

# H2 In-Memory Database
spring.datasource.url=jdbc:h2:mem:testdb
spring.datasource.driver-class-name=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=

# JPA Configuration
spring.jpa.hibernate.ddl-auto=create-drop
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true

# Disable Redis for tests
spring.data.redis.host=localhost
spring.data.redis.port=6379
spring.cache.type=none

# Mail Configuration (Mock)
spring.mail.host=localhost
spring.mail.port=1025

# JWT Configuration
jwt.secret=test-secret-key-for-testing-purposes-only-minimum-256-bits
jwt.expiration=3600000

# Logging
logging.level.org.springframework.web=DEBUG
logging.level.com.kakeibo=DEBUG
```

---

## 5. Testing Validation

### Example: Testing Request Validation

```java
@WebMvcTest(ExpenseController.class)
class ExpenseValidationTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @MockBean
    private ExpenseService expenseService;
    
    @Test
    @DisplayName("Should reject expense with negative amount")
    void shouldRejectNegativeAmount() throws Exception {
        mockMvc.perform(post("/api/expenses")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "description": "Invalid",
                        "amount": -10.00,
                        "category": "Food"
                    }
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors").exists());
    }
    
    @Test
    @DisplayName("Should reject expense without required fields")
    void shouldRejectMissingFields() throws Exception {
        mockMvc.perform(post("/api/expenses")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isBadRequest());
    }
}
```

---

## 6. Running Tests

### Run all tests:
```bash
./mvnw test
```

### Run specific test class:
```bash
./mvnw test -Dtest=UserApiIntegrationTest
```

### Run tests with coverage:
```bash
./mvnw test jacoco:report
```

### Run only integration tests:
```bash
./mvnw verify -P integration-tests
```

---

## 7. Best Practices

### ✅ DO:
- Use `@ActiveProfiles("test")` for test-specific configuration
- Clean database state with `@BeforeEach` or `@Transactional`
- Test both success and failure scenarios
- Use meaningful test names with `@DisplayName`
- Mock external dependencies (email, payment gateways)
- Test validation rules
- Verify HTTP status codes and response bodies
- Test authentication and authorization

### ❌ DON'T:
- Rely on test execution order
- Use production database for tests
- Skip edge cases and error scenarios
- Test Spring framework itself
- Have tests dependent on each other
- Commit sensitive test data

---

## 8. Common Test Scenarios

### Authentication Flow
```java
@Test
void shouldAuthenticateAndReturnToken() {
    LoginRequest request = new LoginRequest("user@example.com", "password");
    
    ResponseEntity<AuthResponse> response = restTemplate.postForEntity(
        "/api/auth/login", request, AuthResponse.class);
    
    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody().getToken()).isNotBlank();
}
```

### CRUD Operations
```java
@Test
void shouldPerformCRUDOperations() {
    // Create
    Expense created = createExpense("Lunch", 15.00);
    
    // Read
    Expense read = getExpense(created.getId());
    assertThat(read).isEqualTo(created);
    
    // Update
    updateExpense(created.getId(), "Dinner", 20.00);
    
    // Delete
    deleteExpense(created.getId());
    assertExpenseNotFound(created.getId());
}
```

### Pagination & Filtering
```java
@Test
void shouldFilterExpensesByCategory() throws Exception {
    mockMvc.perform(get("/api/expenses?category=Food&page=0&size=10"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content").isArray())
        .andExpect(jsonPath("$.totalElements").exists());
}
```

---

## 9. Advanced: REST Assured (Optional)

Add to `pom.xml`:
```xml
<dependency>
    <groupId>io.rest-assured</groupId>
    <artifactId>rest-assured</artifactId>
    <scope>test</scope>
</dependency>
```

Example:
```java
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
class RestAssuredTest {
    
    @LocalServerPort
    private int port;
    
    @BeforeEach
    void setup() {
        RestAssured.port = port;
    }
    
    @Test
    void shouldGetExpenses() {
        given()
            .header("Authorization", "Bearer " + token)
        .when()
            .get("/api/expenses")
        .then()
            .statusCode(200)
            .body("size()", greaterThan(0));
    }
}
```

---

## 10. Continuous Integration

Add to CI/CD pipeline:
```yaml
# GitHub Actions example
- name: Run tests
  run: ./mvnw test
  
- name: Generate coverage report
  run: ./mvnw jacoco:report
```

---

## Resources
- [Spring Boot Testing Documentation](https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.testing)
- [MockMvc Documentation](https://docs.spring.io/spring-framework/docs/current/reference/html/testing.html#spring-mvc-test-framework)
- [JUnit 5 User Guide](https://junit.org/junit5/docs/current/user-guide/)

---

**Happy Testing! 🧪**
