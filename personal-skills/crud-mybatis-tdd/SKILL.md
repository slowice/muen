---
name: crud-mybatis-tdd
description: Use when implementing or modifying CRUD features in Java/MyBatis projects, especially from Postman examples or API requests, when responses must be stored in a CRUD table, or when Mapper Java/XML SQL may change.
---

# CRUD MyBatis TDD

Use this skill for CRUD work involving Postman examples, Controller/Service/ServiceImpl/DAO generation, MyBatis Mapper Java interfaces, Mapper XML, or SQL generated from API requirements.

Default Postman persistence target: use the Postman request as the upstream API contract, call that upstream API at runtime, and store the upstream request URL plus the actual runtime upstream response body into the existing `CRUD` table with these fields:

- `time`: write the current persistence time unless the project has a clear existing response-time convention. If the existing table uses `created_at`, treat it as the time field.
- `url`: write the Postman request URL, or the configured runtime URL derived from that Postman request.
- `response`: write the raw response body returned by the runtime upstream API call as a string or JSON text according to the column type.

Do not infer or create additional tables for Postman response persistence unless the user explicitly changes this requirement.

## Core Rule

Do not change Mapper SQL first.

When Mapper behavior may change, write or update a focused Mapper test before editing the Mapper implementation. The test must fail or be expected to fail against the current behavior, then pass after the Mapper change.

For Postman-driven CRUD generation, implement an interface integration through the project's normal layers and keep the fixed `CRUD(time, url, response)` persistence contract intact. Do not treat the Postman response example as static business data to save without making the upstream API call.

## Postman-Driven API Integration Workflow

Use this workflow when the user provides a Postman collection, request, response example, or asks to generate CRUD code from Postman.

1. Parse the Postman input.
   - Extract HTTP method, URL/path, query parameters, request body, headers needed by code, and example response body.
   - Treat the request method, URL, headers, and body shape as the upstream API contract the generated code must call.
   - Treat the runtime upstream response body as the value to persist into `CRUD.response`.
   - Treat the Postman request URL, or configured runtime URL derived from it, as the value to persist into `CRUD.url`.
   - Use the Postman example response body as the expected mock upstream response in tests.
   - Do not derive a new table schema from the response JSON.
   - Do not implement the feature by reading the Postman response example as local text and saving it directly.

2. Inspect existing project style.
   - Find nearby Controller, Service interface, ServiceImpl, DAO/repository, Mapper Java/XML, DTO/entity, and tests.
   - Reuse existing package layout, naming, annotations, response wrappers, exception handling, validation, and transaction conventions.
   - Name generated classes after the business capability or upstream API domain, not after the source artifact or workflow tool. For example, prefer `GlmChatCompletionsController` or `WeatherSyncService` over `PostmanCrudController` or `PostmanCrudService`.
   - Treat Postman as the request contract and test fixture source only. Do not let `Postman`, `Collection`, or generic workflow words leak into package, class, method, or bean names unless they are actual product terms.
   - Do not introduce a new architecture if the project already has one.

3. Verify the `CRUD` table contract before code generation.
   - If database MCP is available, call `describe_table` or `show_create_table` for `CRUD`.
   - Confirm that `time` or `created_at`, `url`, and `response` exist and have usable types.
   - If the table or fields are missing, stop and report the mismatch instead of silently creating DDL.

4. Write tests before implementation.
   - Add or update Mapper tests for inserting into and querying from `CRUD`.
   - Add Service/ServiceImpl tests if local patterns exist.
   - Add Controller/API tests if the project has existing web-layer test style.
   - Run new tests before implementation and record the expected failure when feasible. If a test cannot fail first because it covers already-existing behavior, state that explicitly.
   - Tests for Postman-driven integrations must send the Postman headers and body into the local Controller/API request, then verify required headers are forwarded to the mocked upstream request.
   - Tests for Postman-driven integrations must verify transport/client headers such as `Accept-Encoding` are not forwarded to the mocked upstream request.
   - Tests for Postman-driven integrations must use the Postman request URL, method, headers, and body as the outbound request expectation where possible.
   - Tests must use the Postman example response body as the mocked upstream response and assert that exact body is returned by the local endpoint and persisted into `CRUD.response`.
   - Tests must create their own database test data, assert persistence, and roll back or clean up.
   - Do not write real Authorization tokens or secrets from Postman into source files; use environment/config placeholders in production code and load test fixtures only in tests when needed.

5. Generate code by layer.
   - Controller: expose or adapt the endpoint matching the Postman request, including required request headers. Name it by endpoint/domain semantics, not by `Postman` or generic `Crud` wording unless those are actual product terms.
   - Service interface: define the business method using project naming conventions, passing required request headers when they must be forwarded. Name it by the upstream capability or local use case.
   - ServiceImpl: call the upstream API described by Postman with required forwarded headers, then call DAO/Mapper to persist the upstream response into the `CRUD` table. Keep persistence helpers generic only at the persistence boundary.
   - For upstream responses stored as text or returned by the Controller, explicitly use UTF-8 for HTTP response decoding and local Controller output. Do not rely on framework default string encodings.
   - Do not blindly forward transport/client headers such as `Accept-Encoding`, `Content-Length`, `Host`, `Connection`, or `Transfer-Encoding` to the upstream API. Forwarding `Accept-Encoding: gzip` can cause compressed bytes to be saved into `CRUD.response` instead of decoded JSON text.
   - DAO/repository: follow the local persistence boundary if the project has one.
   - Use `Crud` in persistence naming only when the table or local persistence concept is actually named `CRUD`. Do not use `Crud` as a generic name for upstream API integration classes.
   - Mapper Java/XML: persist exactly the table's time field (`time` or `created_at`), `url`, and `response` into `CRUD`.
   - DTO/entity/DO: add only what the local code style requires.

6. Verify after implementation.
   - Run focused Mapper tests first.
   - Then run Service/Controller tests added or touched by the change.
   - If Spring beans, Controllers, Mapper classes, or test classes were deleted or renamed, run a clean build/test command such as `mvn clean test` or `mvn -pl <module> clean test` to remove stale compiled classes.
   - Use MCP `run_test_transaction` only as an additional SQL check, not as a replacement for project tests.
   - For Postman-driven CRUD integrations, unit tests alone are not sufficient for completion.
   - Start the application or target module service locally.
   - Call the generated Controller/API endpoint through HTTP using the Postman request method, headers, and body. Include a unique test marker in the request body, query value, or controlled upstream/mock response when the API shape permits it.
   - Query the real configured development/test database after the HTTP call and verify `CRUD.url` and `CRUD.response` contain the expected values. Locate the row using the unique test marker when possible; otherwise use the expected URL plus deterministic ordering such as newest timestamp.
   - If the expected response contains non-ASCII text such as Chinese, verify both the HTTP response body and persisted `CRUD.response` render correctly without mojibake.
   - If the persisted response looks like `�` or its hex value begins with `1F8B08`, treat it as compressed gzip bytes saved as text. Investigate `Accept-Encoding` forwarding or response decompression before treating it as a charset problem.
   - If the HTTP verification writes to a shared development database, report whether the test row was intentionally retained for audit or cleaned up after verification.
   - Treat the work as incomplete if the service cannot be started, the Controller cannot be called, or the database row cannot be verified. Report the blocker instead of claiming success.

## Mapper TDD Workflow

1. Identify the target Mapper surface.
   - Search for related `*Mapper.java`, `*Mapper.xml`, DAO/repository classes, service callers, and existing tests.
   - Prefer `rg` queries over broad file browsing.
   - List the exact Mapper methods that will change.

2. Learn the local testing style.
   - Find nearby Mapper tests before adding new patterns.
   - Prefer the project's existing style: `@MybatisTest`, `@SpringBootTest`, transactional rollback tests, test fixtures, SQL seed scripts, or containerized DB setup.
   - Reuse existing test helpers, base classes, naming, assertions, and data cleanup conventions.

3. Check schema before writing SQL.
   - If a database MCP is available, inspect table definitions before changing SQL.
   - Prefer read-only schema checks such as `SHOW CREATE TABLE`, `DESCRIBE`, `INFORMATION_SCHEMA`, or `EXPLAIN`.
   - Do not rely on guessed table or column names when schema access is available.
   - Do not use privileged production credentials for automated checks. If only privileged credentials exist, ask before running write operations.

4. Write the Mapper test first.
   - Cover every new or changed Mapper method.
   - Include realistic parameters and edge cases for dynamic SQL branches.
   - Verify result mapping, parameter binding, sorting, pagination, null handling, and write effects as applicable.
   - For insert/update/delete tests, use transaction rollback or explicit cleanup.
   - Keep test data minimal and local to the test.

5. Run the focused test before editing Mapper SQL.
   - Run the smallest command that exercises the new test, such as:
     ```bash
     mvn test -Dtest=TargetMapperTest
     ```
   - If the project uses Gradle, use the nearest equivalent:
     ```bash
     ./gradlew test --tests TargetMapperTest
     ```
   - Record whether the test fails for the expected reason.
   - If the test cannot run because the project lacks required DB/test infrastructure, state the blocker and use schema inspection plus the closest existing test command.

6. Change the Mapper.
   - Keep Mapper XML/annotations aligned with the Mapper interface.
   - Preserve existing namespace, resultMap, SQL fragment, naming, and dynamic SQL style.
   - Avoid unrelated SQL cleanup or formatting churn.
   - Prefer structured MyBatis XML constructs over string tricks.

7. Verify after the change.
   - Re-run the focused Mapper test.
   - If SQL changed shared behavior, run nearby service/repository tests too.
   - If using MCP, optionally run `EXPLAIN` for complex queries after SQL stabilizes.
   - Do not mark the work complete until the focused Mapper verification passes or the blocker is explicit.

## What A Good Mapper Test Covers

- Mapper XML loads successfully.
- Mapper interface method matches XML statement id.
- Parameter names match Java method parameters or `@Param` names.
- Table and column names exist.
- Dynamic SQL branches work for null, empty, and populated inputs.
- `resultMap` or `resultType` maps returned columns correctly.
- Insert/update/delete methods affect the intended rows.
- Query methods return deterministic rows with stable ordering when order matters.

## MCP Usage Guidance

Use database MCP tools as a schema and SQL validation aid, not as a replacement for tests. If `mysql-crud-test-mcp` is configured, prefer these tools:

- `list_tables` to discover tables in the configured database.
- `describe_table` to inspect columns, types, nullability, keys, defaults, and extra metadata.
- `show_create_table` to inspect the full table DDL.
- `explain_sql` to check query plans for readonly Mapper SQL.
- `run_readonly_query` for safe SELECT/SHOW/DESCRIBE/EXPLAIN checks.
- `run_test_transaction` for seed/action/assert CRUD verification that always rolls back.

Allowed before Mapper edits:
- Inspect tables, columns, indexes, constraints, and existing sample rows.
- Run `EXPLAIN` on candidate read queries.
- Compare Mapper assumptions against real schema.

For insert/update/delete verification:
- Create test data first.
- Execute the target insert/update/delete against only that test data.
- Assert with a query step.
- Roll back or clean up the test data.
- Prefer project Mapper tests with transaction rollback. Use `run_test_transaction` only as an MCP-assisted SQL check.

For Postman response persistence:
- Use `describe_table` or `show_create_table` to verify `CRUD(time|created_at, url, response)`.
- Use `run_test_transaction` to check the final insert SQL when useful:
  - seed only if required by constraints.
  - insert one test row with a synthetic URL and response.
  - select by the synthetic URL or another unique test marker.
  - rely on rollback from `run_test_transaction`.

Use caution:
- Avoid destructive statements unless the user explicitly confirms the target is a safe dev/test database.
- Prefer test transactions with rollback for write-path verification.
- Avoid storing database passwords in Skill files or generated source.

## Reporting Requirements

When finishing Mapper or Postman-driven integration work, report:

- Mapper files changed.
- Controller, Service, ServiceImpl, DAO/repository, DTO/entity files changed when Postman CRUD generation was requested.
- Tests added or updated.
- Verification command run.
- Pass/fail result.
- For Postman-driven CRUD integrations: service start command, HTTP Controller/API call evidence, database query used for verification, and whether the stored `CRUD.url` and `CRUD.response` matched the expected values.
- For responses containing non-ASCII text: whether the HTTP response and persisted database value were checked for correct UTF-8 rendering.
- For responses that could be compressed: whether `Accept-Encoding` forwarding was filtered or response decompression was verified, and whether `CRUD.response` was checked not to start with gzip magic bytes `1F8B08`.
- For real HTTP/database verification: the unique test marker used, or the deterministic query strategy used when a marker was not possible.
- Any schema/MCP checks performed.
- Any remaining risks, especially untested dynamic SQL branches.

## Reserved Future CRUD Flow

These steps are intentionally placeholders for future expansion beyond the fixed `CRUD(time, url, response)` persistence flow:

1. Support user-selected destination tables beyond `CRUD`.
2. Infer normalized table schemas from response JSON.
3. Generate safe migration scripts.
4. Support upsert and deduplication policies.
5. Generate Postman replay tests against a running local service.
6. Add validation, error handling, i18n, and permission checks according to local conventions.

Until this section is expanded, do not infer large CRUD architecture rules from this skill. Use existing project patterns and ask when the target layer is ambiguous.
