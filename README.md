# Children's Fitness App Database Schema

A comprehensive, COPPA-compliant database schema for a children's fitness application with gamified exercise tracking, parent-child account management, and intelligent exercise progression.

## 🌟 Features

- **COPPA Compliant**: Privacy-first design with no health data collection
- **Intelligent Exercise Parsing**: Automatically structures exercise data from text descriptions
- **Progression System**: Skill-based exercise unlocking and adventure paths
- **Family Management**: Secure parent-child account relationships
- **Gamification**: Points, badges, and story-driven exercise adventures
- **Row Level Security**: Complete data isolation between users

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- PostgreSQL database

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/childrens-fitness-db-schema.git
   cd childrens-fitness-db-schema
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Copy your project URL and anon key
   - Create a `.env` file:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run database migrations**
   ```bash
   # Apply all migrations in order
   supabase db push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 📊 Database Overview

### Core Tables

| Category | Tables | Purpose |
|----------|--------|---------|
| **User Management** | `profiles`, `parent_child_relationships` | COPPA-compliant user accounts |
| **Exercise Data** | `exercises`, `exercise_categories`, `muscle_groups`, `equipment_types` | Normalized exercise library |
| **Progression System** | `exercise_prerequisites`, `adventure_paths`, `path_exercises` | Skill-based unlocking |
| **Gamification** | `adventures`, `rewards`, `user_rewards` | Engagement and motivation |
| **Progress Tracking** | `exercise_sessions`, `user_progress`, `user_path_progress` | Activity monitoring |

### Key Features

- **19 tables** with comprehensive relationships
- **Structured exercise data** parsed from text descriptions
- **Adventure-based progression** with themed exercise journeys
- **Parent oversight** with granular privacy controls
- **Points-based system** replacing health metrics for COPPA compliance

## 🔧 Architecture

### Data Processing Pipeline

1. **JSON Import**: Original exercise data from JSON files
2. **Text Parsing**: Intelligent extraction of sets, reps, and duration
3. **Normalization**: Structured storage in relational tables
4. **Gamification**: Points and progression system overlay

### Security Model

- **Row Level Security (RLS)** on all tables
- **Parent-child data access** with proper consent tracking
- **Privacy-first design** with minimal data collection
- **Audit trails** for all data access

## 📖 Documentation

- [Database Schema Overview](docs/database-schema-overview.md) - Complete technical documentation
- [Migration Guide](docs/migrations.md) - Step-by-step database setup
- [API Documentation](docs/api.md) - Query examples and best practices
- [COPPA Compliance](docs/coppa-compliance.md) - Privacy and safety features

## 🎮 Interactive Demo

The project includes an interactive web interface to explore:

- **Exercise Structure Parser** - View parsed exercise data
- **Schema Overview** - Browse all tables and relationships
- **Database Dashboard** - Explore security and gamification features

Access at `http://localhost:5173` after running `npm run dev`

## 🔍 Example Queries

### Find exercises by duration
```sql
SELECT * FROM exercises 
WHERE min_duration_seconds >= 30 AND max_duration_seconds <= 60;
```

### Get user's unlocked exercises
```sql
SELECT e.* FROM exercises e 
WHERE NOT EXISTS (
  SELECT 1 FROM exercise_prerequisites ep 
  WHERE ep.exercise_id = e.id 
  AND ep.prerequisite_exercise_id NOT IN (
    SELECT DISTINCT exercise_id FROM exercise_sessions 
    WHERE user_id = $1 AND completed_at IS NOT NULL
  )
);
```

### Track adventure path progress
```sql
SELECT ap.title, upp.progress_percentage, upp.exercises_completed, upp.status
FROM adventure_paths ap 
JOIN user_path_progress upp ON ap.id = upp.path_id 
WHERE upp.user_id = $1;
```

## 🛠️ Development

### Project Structure

```
├── src/
│   ├── components/          # React components for visualization
│   ├── App.tsx             # Main application
│   └── main.tsx            # Entry point
├── supabase/
│   └── migrations/         # Database migration files
├── docs/                   # Comprehensive documentation
└── README.md              # This file
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Migration Files

1. `20250621211523_spring_frog.sql` - Initial schema creation
2. `20250621211632_winter_sky.sql` - Seed data insertion
3. `20250622063608_damp_surf.sql` - Duration fields addition
4. `20250622064655_pale_art.sql` - COPPA compliance enhancements
5. `20250622064849_quiet_haze.sql` - Progression system
6. `20250628211740_sparkling_beacon.sql` - Exercise structure parsing

## 🎯 Use Cases

### For Developers
- **Reference implementation** for COPPA-compliant fitness apps
- **Structured exercise data** parsing techniques
- **Family account management** patterns
- **Gamification system** design

### For Fitness Apps
- **Child-safe progress tracking** without health data
- **Parent oversight tools** with privacy controls
- **Engaging progression systems** with story-driven content
- **Scalable database architecture** for growth

## 🔒 COPPA Compliance

This schema is designed with children's privacy as the top priority:

- ❌ **No health data collection** (calories, weight, BMI)
- ✅ **Adventure points system** for engagement
- ✅ **Parent consent tracking** with audit trails
- ✅ **Minimal data collection** with privacy controls
- ✅ **Secure family relationships** with RLS

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style and conventions
- Add tests for new functionality
- Update documentation for schema changes
- Ensure COPPA compliance for any new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Supabase](https://supabase.com) for backend infrastructure
- [React](https://reactjs.org) and [Tailwind CSS](https://tailwindcss.com) for the interface
- [Lucide React](https://lucide.dev) for icons
- Designed with children's privacy and safety in mind

## 📞 Support

- 📧 Email: [your-email@example.com]
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/childrens-fitness-db-schema/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/yourusername/childrens-fitness-db-schema/discussions)

---

**Built with ❤️ for children's health and privacy**