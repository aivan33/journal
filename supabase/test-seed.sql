-- Test seed data for integration tests
-- This script populates the test database with known data

-- Clean existing data
TRUNCATE TABLE tasks CASCADE;
TRUNCATE TABLE entries CASCADE;

-- Insert test entries
INSERT INTO entries (id, title, content, embedding, created_at) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Test Entry 1',
    'This is the first test entry content',
    NULL,
    '2025-12-01T10:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Test Entry 2',
    'This is the second test entry content with some [task] markers',
    NULL,
    '2025-12-02T11:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'Test Entry 3',
    'Third entry for testing vector similarity',
    NULL,
    '2025-12-03T12:00:00Z'
  );

-- Insert test tasks
INSERT INTO tasks (id, content, entry_id, completed, archived, due_date, created_at) VALUES
  (
    '00000000-0000-0000-0000-000000000101',
    'Test todo 1',
    '00000000-0000-0000-0000-000000000001',
    false,
    false,
    NULL,
    '2025-12-01T10:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    'Test todo 2',
    '00000000-0000-0000-0000-000000000001',
    true,
    false,
    NULL,
    '2025-12-01T10:01:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000103',
    'Test todo 3 - overdue',
    '00000000-0000-0000-0000-000000000002',
    false,
    false,
    '2025-12-01T00:00:00Z',
    '2025-12-02T11:00:00Z'
  ),
  (
    '00000000-0000-0000-0000-000000000104',
    'Test todo 4 - archived',
    '00000000-0000-0000-0000-000000000002',
    true,
    true,
    NULL,
    '2025-12-02T11:01:00Z'
  );

-- Grant permissions (if needed for test user)
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO journal_test;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO journal_test;
