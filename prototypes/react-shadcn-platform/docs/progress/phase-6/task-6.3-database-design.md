# Task 6.3: Database Design & Implementation

> **Status:** 🟡 Pending  
> **Priority:** Critical - Core Data Foundation  
> **Estimated Duration:** 1-1.5 weeks  
> **Dependencies:** Task 6.1 (Architecture), Task 6.2 (Backend setup)

## 🎯 Overview

Design and implement the complete PostgreSQL database schema for the Alumni platform, including all tables, relationships, indexes, and migration system. Transform mock data structures into production-ready database design.

## 📋 Sub-Tasks Breakdown

### **Sub-task 6.3.1: Schema Design**
**Duration:** 3-4 days  
**Priority:** Critical

#### **Objectives:**
- Design comprehensive database schema for all Alumni features
- Define entity relationships and constraints
- Plan for scalability and performance
- Align with Mock UI data requirements

#### **Core Entity Groups:**

##### **1. User Management & Authentication**
```sql
-- Users and Authentication
users: id, email, phone, password_hash, created_at, updated_at, status
user_profiles: user_id, first_name, last_name, profile_picture, bio, graduation_year, degree, company, position, location, privacy_settings
user_sessions: id, user_id, token_hash, expires_at, created_at, device_info
user_roles: user_id, role (member, moderator, admin), assigned_at, assigned_by

-- Multi-Profile Support (Netflix-style)
user_profiles_selection: user_id, profile_type, profile_data, is_active, created_at
```

##### **2. Alumni Directory & Social Features**  
```sql
-- Alumni Directory
alumni_directory: user_id, visibility, searchable, featured, updated_at
alumni_connections: requester_id, requested_id, status, connected_at, connection_type
alumni_endorsements: endorser_id, endorsed_id, skill_category, endorsement_text, created_at

-- Professional Information
professional_info: user_id, current_company, current_position, industry, experience_years, skills, achievements, linkedin_url
education_info: user_id, institution, degree, field_of_study, graduation_year, gpa, honors
```

##### **3. Content Management & Postings**
```sql
-- Postings and Content
postings: id, author_id, title, content, posting_type, category, tags, status, created_at, updated_at, expires_at
posting_attachments: posting_id, file_url, file_type, file_size, file_name
posting_interactions: user_id, posting_id, interaction_type (like, bookmark, share), created_at
posting_comments: id, posting_id, user_id, comment_text, parent_comment_id, created_at, updated_at

-- Content Categories
categories: id, name, description, parent_category_id, icon, color
posting_categories: posting_id, category_id
```

##### **4. Chat & Messaging System**
```sql
-- Messaging and Chat
conversations: id, conversation_type (direct, group), name, description, created_by, created_at, updated_at
conversation_participants: conversation_id, user_id, role (member, admin), joined_at, left_at, notification_settings
messages: id, conversation_id, sender_id, message_text, message_type (text, file, system), reply_to_id, created_at, edited_at
message_attachments: message_id, file_url, file_type, file_size, file_name
message_reactions: message_id, user_id, reaction_type, created_at
```

##### **5. Analytics & Reporting**
```sql
-- Analytics and Tracking
user_activity_logs: id, user_id, activity_type, activity_details, ip_address, user_agent, created_at
posting_analytics: posting_id, view_count, interaction_count, comment_count, share_count, updated_at
system_metrics: metric_name, metric_value, metric_type, recorded_at
engagement_metrics: user_id, date, page_views, time_spent, actions_taken, calculated_at
```

#### **Deliverables:**
- 🗄️ **Complete ERD (Entity Relationship Diagram)**
- 📋 **Table Schema Definitions** with columns, types, constraints
- 🔗 **Relationship Mapping** with foreign keys and indexes
- 📊 **Data Dictionary** with field descriptions and business rules

### **Sub-task 6.3.2: PostgreSQL Setup**
**Duration:** 2 days  
**Priority:** Critical

#### **Objectives:**
- Set up PostgreSQL database infrastructure
- Configure migration system
- Prepare seed data from Mock UI
- Establish database development workflow

#### **Database Infrastructure:**
```yaml
Development Environment:
  - Local PostgreSQL installation
  - Database creation and user setup
  - Development data and test fixtures
  - Backup and restore procedures

Staging Environment:
  - AWS RDS PostgreSQL instance
  - Parameter groups and configuration
  - Security groups and access control
  - Monitoring and performance insights

Production Environment:
  - Multi-AZ RDS deployment
  - Read replicas for scaling
  - Automated backups and point-in-time recovery
  - Performance monitoring and alerting
```

#### **Migration System Setup:**
```javascript
// Migration Framework (Prisma/TypeORM/Knex)
migrations/
├── 001_initial_schema.sql          // Core tables
├── 002_user_authentication.sql     // Auth system
├── 003_alumni_directory.sql        // Directory features
├── 004_content_management.sql      // Posts and content
├── 005_messaging_system.sql        // Chat and messaging
├── 006_analytics_tables.sql        // Analytics and reporting
├── 007_indexes_optimization.sql    // Performance indexes
└── 008_seed_data.sql              // Initial data
```

#### **Deliverables:**
- 🗄️ **PostgreSQL Database Setup** (Dev/Staging/Prod)
- 🔄 **Migration System** with version control
- 🌱 **Seed Data Scripts** based on Mock UI data
- 📋 **Database Setup Documentation**

### **Sub-task 6.3.3: ORM/Query Builder Setup**
**Duration:** 2-3 days  
**Priority:** High

#### **Objectives:**
- Configure ORM/Query builder (based on Task 6.1 decision)
- Define models and relationships
- Set up connection pooling and optimization
- Create repository patterns

#### **ORM Options (Based on Task 6.1):**

##### **Option A: Prisma**
```typescript
// Prisma Schema Example
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  phone       String?
  passwordHash String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  status      UserStatus @default(ACTIVE)
  
  profile     UserProfile?
  postings    Posting[]
  messages    Message[]
  
  @@map("users")
}

model UserProfile {
  userId        String @id
  firstName     String
  lastName      String
  profilePicture String?
  bio           String?
  graduationYear Int?
  
  user          User @relation(fields: [userId], references: [id])
  
  @@map("user_profiles")
}
```

##### **Option B: TypeORM**
```typescript
// TypeORM Entity Example
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column('varchar', { name: 'password_hash' })
  passwordHash: string;

  @OneToOne(() => UserProfile, profile => profile.user)
  profile: UserProfile;

  @OneToMany(() => Posting, posting => posting.author)
  postings: Posting[];
}
```

#### **Repository Patterns:**
```typescript
// Repository Pattern Implementation
interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(userData: CreateUserInput): Promise<User>;
  update(id: string, userData: UpdateUserInput): Promise<User>;
  delete(id: string): Promise<void>;
}

// Alumni-specific repository methods
interface AlumniRepository extends UserRepository {
  findByGraduationYear(year: number): Promise<User[]>;
  findByCompany(company: string): Promise<User[]>;
  searchAlumni(filters: AlumniSearchFilters): Promise<User[]>;
  getAlumniStats(): Promise<AlumniStatistics>;
}
```

#### **Deliverables:**
- 🏗️ **ORM Configuration** and setup
- 📋 **Model Definitions** for all entities
- 🔗 **Repository Patterns** and interfaces
- ⚡ **Connection Pool Configuration**

### **Sub-task 6.3.4: Database Optimization**
**Duration:** 1-2 days  
**Priority:** Medium

#### **Objectives:**
- Plan and implement database indexes
- Optimize query performance
- Configure connection pooling
- Set up monitoring and alerting

#### **Indexing Strategy:**
```sql
-- Performance Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_postings_author_created ON postings(author_id, created_at DESC);
CREATE INDEX idx_postings_category_status ON postings(category, status);
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_user_activity_user_date ON user_activity_logs(user_id, created_at DESC);

-- Search Indexes
CREATE INDEX idx_user_profiles_fulltext ON user_profiles USING gin(to_tsvector('english', first_name || ' ' || last_name || ' ' || bio));
CREATE INDEX idx_postings_fulltext ON postings USING gin(to_tsvector('english', title || ' ' || content));

-- Composite Indexes for Common Queries
CREATE INDEX idx_alumni_search ON user_profiles(graduation_year, company, industry) WHERE visibility = 'public';
```

#### **Query Optimization:**
```sql
-- Optimized Queries for Common Operations
-- Alumni Directory Search with Filters
SELECT u.id, up.first_name, up.last_name, up.company, up.position
FROM users u
JOIN user_profiles up ON u.id = up.user_id
JOIN alumni_directory ad ON u.id = ad.user_id
WHERE ad.searchable = true
  AND up.graduation_year BETWEEN $1 AND $2
  AND (up.company ILIKE $3 OR $3 IS NULL)
ORDER BY up.last_name, up.first_name
LIMIT $4 OFFSET $5;

-- Recent Postings for Feed
SELECT p.*, up.first_name, up.last_name, up.profile_picture
FROM postings p
JOIN users u ON p.author_id = u.id
JOIN user_profiles up ON u.id = up.user_id
WHERE p.status = 'published'
  AND p.created_at >= NOW() - INTERVAL '30 days'
ORDER BY p.created_at DESC
LIMIT $1;
```

#### **Deliverables:**
- 📊 **Database Index Plan** with rationale
- ⚡ **Query Optimization Guide**
- 🔧 **Connection Pool Configuration**
- 📈 **Performance Monitoring Setup**

## 🎯 Task Success Metrics

### **Technical Deliverables**
- [ ] Complete database schema with all tables
- [ ] Migration system functional and tested
- [ ] ORM/Query builder fully configured
- [ ] All indexes created and optimized
- [ ] Seed data loaded successfully

### **Quality Gates**
- [ ] All database migrations run without errors
- [ ] ORM models generate correct SQL
- [ ] Query performance meets targets (<100ms for 95% of queries)
- [ ] Database can handle expected load (concurrent connections)
- [ ] Backup and recovery procedures tested

### **Data Migration**
- [ ] Mock UI data structures mapped to database schema
- [ ] Sample data migrated successfully
- [ ] Data integrity constraints working
- [ ] Foreign key relationships validated

## 🔧 Mock UI Data Mapping

### **Phase 2 Mock Data → Database Schema:**
```javascript
// Mock UI Data Structure → Database Tables
mockUsers[] → users + user_profiles + alumni_directory
mockPostings[] → postings + posting_attachments + posting_interactions
mockChats[] → conversations + conversation_participants + messages
mockAnalytics[] → user_activity_logs + engagement_metrics
mockPreferences[] → user_profiles.privacy_settings + user_roles
```

### **Data Transformation Requirements:**
- Convert mock IDs to UUIDs
- Transform flat structures to normalized tables
- Add missing fields for production (timestamps, status, metadata)
- Implement proper relationship constraints
- Add audit trails and soft delete capabilities

## 📈 Performance Targets

### **Database Performance Goals:**
| Query Type | Target Time | Concurrent Users |
|------------|-------------|------------------|
| User Lookup | < 10ms | 100+ |
| Alumni Search | < 100ms | 50+ |
| Posting Feed | < 200ms | 200+ |
| Chat Messages | < 50ms | 100+ |
| Analytics Queries | < 500ms | 10+ |

### **Scalability Targets:**
- **Users:** Support 10,000+ alumni profiles
- **Content:** Handle 100,000+ postings and comments
- **Messages:** Process 1M+ chat messages
- **Concurrent Connections:** 500+ simultaneous users

---

**Status:** Awaiting Task 6.2 completion  
**Key Stakeholders:** Backend Developers, Database Administrators  
**Risk Level:** Medium (Complex schema design and migration)  
**Critical Path:** Yes (Blocks API development and frontend integration)

*Last updated: August 23, 2025*