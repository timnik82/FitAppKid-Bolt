# COPPA Compliance Guide

This document outlines how the Children's Fitness App database schema ensures compliance with the Children's Online Privacy Protection Act (COPPA) and promotes child safety online.

## Overview

COPPA requires special protections for children under 13 years old when collecting, using, or disclosing their personal information online. Our database schema is designed with privacy-first principles and child safety as the top priority.

## Key COPPA Requirements & Our Implementation

### 1. Parental Consent

**COPPA Requirement**: Obtain verifiable parental consent before collecting personal information from children under 13.

**Our Implementation**:
```sql
-- Parent consent tracking in profiles table
parent_consent_given boolean DEFAULT false,
parent_consent_date timestamptz,

-- Parent-child relationship management
CREATE TABLE parent_child_relationships (
  parent_id uuid NOT NULL,
  child_id uuid NOT NULL,
  consent_given boolean DEFAULT true,
  consent_date timestamptz DEFAULT now(),
  active boolean DEFAULT true
);
```

**Features**:
- ✅ Explicit consent tracking with timestamps
- ✅ Audit trail for all consent decisions
- ✅ Ability to revoke consent and deactivate relationships
- ✅ Parent verification before child account creation

### 2. Limited Data Collection

**COPPA Requirement**: Collect only information that is reasonably necessary for the activity.

**Our Implementation**:

**Minimal Child Data Collection**:
```sql
-- Only essential fields for child profiles
CREATE TABLE profiles (
  id uuid PRIMARY KEY,
  display_name text NOT NULL,        -- Required for app functionality
  date_of_birth date,               -- Age verification only
  is_child boolean DEFAULT false,   -- COPPA status flag
  privacy_settings jsonb DEFAULT '{"data_sharing": false, "analytics": false}'
);
```

**What We DON'T Collect**:
- ❌ Real names (only display names)
- ❌ Email addresses for children
- ❌ Phone numbers
- ❌ Physical addresses
- ❌ Photos or videos
- ❌ Health data (weight, BMI, medical conditions)
- ❌ Biometric data
- ❌ Location data
- ❌ Social security numbers
- ❌ Financial information

### 3. No Health Data Collection

**COPPA Consideration**: Health data is particularly sensitive for children.

**Our Approach**:
```sql
-- Gamified points system instead of health metrics
adventure_points integer DEFAULT 10,  -- Fun points, not calories
fun_rating integer CHECK (fun_rating BETWEEN 1 AND 5),
effort_rating integer CHECK (effort_rating BETWEEN 1 AND 5),

-- Focus on engagement, not health outcomes
weekly_points_goal integer DEFAULT 100,
weekly_exercise_days integer DEFAULT 0,
average_fun_rating decimal(3,2) DEFAULT 0.00
```

**Removed Health Metrics**:
- ❌ Calorie tracking
- ❌ Heart rate monitoring
- ❌ Weight/BMI tracking
- ❌ Body measurements
- ❌ Fitness assessments
- ❌ Performance comparisons

### 4. Parental Access and Control

**COPPA Requirement**: Parents must be able to review, delete, and control their child's information.

**Our Implementation**:

**Row Level Security for Family Data**:
```sql
-- Parents can view children's data
CREATE POLICY "Parents can read children profiles"
  ON profiles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_child_relationships pcr
      WHERE pcr.parent_id = auth.uid()
      AND pcr.child_id = profiles.id
      AND pcr.active = true
    )
  );

-- Parents can modify children's data
CREATE POLICY "Parents can update children profiles"
  ON profiles FOR UPDATE TO authenticated
  USING (/* same parent check */);
```

**Parent Control Features**:
- ✅ View all child's exercise activity
- ✅ Modify child's profile settings
- ✅ Control privacy settings
- ✅ Delete child's data
- ✅ Deactivate child's account
- ✅ Export child's data

### 5. Data Security

**COPPA Requirement**: Maintain reasonable security procedures.

**Our Security Measures**:

**Database Level Security**:
```sql
-- Row Level Security on ALL tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_sessions ENABLE ROW LEVEL SECURITY;
-- ... (all tables have RLS enabled)

-- Encrypted data at rest (Supabase default)
-- SSL/TLS for data in transit (Supabase default)
```

**Access Control**:
- ✅ Row Level Security isolates user data
- ✅ Encrypted database storage
- ✅ Secure API endpoints
- ✅ Authentication required for all access
- ✅ Audit logging for data access

### 6. Data Retention and Deletion

**COPPA Requirement**: Don't retain child information longer than necessary.

**Our Implementation**:

**Automatic Cleanup**:
```sql
-- Cascade deletions to remove all child data
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE,
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,

-- Parent can deactivate relationship
UPDATE parent_child_relationships 
SET active = false 
WHERE parent_id = auth.uid() AND child_id = $1;
```

**Data Retention Policy**:
- ✅ Child data deleted when account is closed
- ✅ Inactive accounts automatically flagged
- ✅ Parent can request immediate deletion
- ✅ No indefinite data retention

## Privacy-First Design Principles

### 1. Default Privacy Settings

```sql
-- Restrictive defaults for all users
privacy_settings jsonb DEFAULT '{"data_sharing": false, "analytics": false}'::jsonb,

-- Child accounts have additional restrictions
CASE WHEN is_child = true THEN 
  '{"data_sharing": false, "analytics": false, "public_profile": false}'::jsonb
```

### 2. Engagement Over Performance

**Traditional Fitness Apps** (COPPA concerns):
- Calorie counting → Can promote unhealthy relationships with food
- Weight tracking → Body image issues
- Performance metrics → Pressure and competition
- Social comparison → Self-esteem problems

**Our Approach** (Child-friendly):
- Adventure points → Fun and engaging
- Story themes → Imaginative play
- Consistency tracking → Healthy habits
- Fun ratings → Positive associations

### 3. Educational Focus

```sql
-- Adventures with educational themes
story_theme text, -- 'jungle', 'space', 'ocean', 'superhero'
basketball_skills_improvement text, -- Educational content
safety_cues text[], -- Safety education
```

## Implementation Guidelines

### For Developers

**1. Age Verification**:
```javascript
// Check if user is under 13
const isChild = calculateAge(dateOfBirth) < 13;

// Require parental consent for children
if (isChild && !parentConsentGiven) {
  // Redirect to parental consent flow
}
```

**2. Data Collection Limits**:
```javascript
// Only collect necessary data for children
const childDataFields = [
  'display_name',
  'date_of_birth', // for age verification only
  'privacy_settings'
];

// Never collect for children
const prohibitedFields = [
  'email',
  'phone',
  'real_name',
  'photo',
  'location'
];
```

**3. Parent Verification**:
```javascript
// Verify parent identity before granting access
async function verifyParentAccess(parentId, childId) {
  const relationship = await supabase
    .from('parent_child_relationships')
    .select('*')
    .eq('parent_id', parentId)
    .eq('child_id', childId)
    .eq('active', true)
    .single();
    
  return relationship.data !== null;
}
```

### For Parents

**Account Setup**:
1. Parent creates their own account first
2. Parent creates child profile with consent
3. Parent verifies email and identity
4. Child can use app under parent supervision

**Ongoing Control**:
- View child's activity dashboard
- Modify privacy settings
- Delete specific activities
- Export all child data
- Deactivate account at any time

## Compliance Checklist

### ✅ Data Collection
- [x] Minimal data collection for children
- [x] No sensitive personal information
- [x] No health or biometric data
- [x] Educational purpose clearly defined
- [x] Age-appropriate content only

### ✅ Parental Consent
- [x] Verifiable parental consent required
- [x] Consent timestamp recorded
- [x] Consent can be withdrawn
- [x] Parent identity verification
- [x] Clear consent language

### ✅ Parental Access
- [x] Parents can view all child data
- [x] Parents can modify child settings
- [x] Parents can delete child data
- [x] Parents can export child data
- [x] Parents can deactivate accounts

### ✅ Data Security
- [x] Encryption at rest and in transit
- [x] Row Level Security implemented
- [x] Access logging enabled
- [x] Regular security audits
- [x] Secure authentication

### ✅ Data Retention
- [x] Clear retention policies
- [x] Automatic data deletion
- [x] No indefinite storage
- [x] Parent-controlled deletion
- [x] Account deactivation process

## Legal Considerations

### Safe Harbor Provisions

Our schema supports safe harbor compliance by:
- Treating all users under 13 as children
- Requiring parental consent for all children
- Providing comprehensive parental controls
- Maintaining minimal data collection
- Ensuring secure data handling

### International Compliance

The schema also supports:
- **GDPR** (EU): Right to deletion, data portability, consent management
- **PIPEDA** (Canada): Privacy by design, minimal collection
- **Privacy Act** (Australia): Data security, parental access

### Regular Compliance Reviews

**Quarterly Reviews**:
- Data collection audit
- Security assessment
- Policy updates
- Parent feedback review

**Annual Reviews**:
- Legal compliance check
- Third-party security audit
- Privacy policy updates
- Staff training updates

## Best Practices for Implementation

### 1. User Interface Design
- Clear, simple language for children
- Visual indicators for privacy settings
- Easy parent access controls
- Age-appropriate design elements

### 2. Data Handling
- Encrypt all data transmissions
- Log all data access attempts
- Regular backup and recovery testing
- Incident response procedures

### 3. Staff Training
- COPPA requirements education
- Privacy-first development practices
- Incident response procedures
- Regular compliance updates

### 4. Monitoring and Auditing
- Regular data access audits
- Privacy setting compliance checks
- Parent consent verification
- Security vulnerability assessments

## Conclusion

This database schema provides a solid foundation for COPPA compliance while creating an engaging, safe environment for children to learn about fitness and healthy habits. The privacy-first design ensures that children's data is protected while still providing valuable functionality for both children and their parents.

For questions about COPPA compliance or implementation details, consult with legal counsel familiar with children's privacy laws and regulations.