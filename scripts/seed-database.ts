/**
 * Database Seed Script
 *
 * Populates the Fam app with realistic sample data for a family of 4.
 * Run with: npx tsx scripts/seed-database.ts
 *
 * Requires environment variables:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Reference date: December 27, 2025
const TODAY = new Date('2025-12-27');
const toDateStr = (d: Date) => d.toISOString().split('T')[0];
const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
const subDays = (d: Date, days: number) => addDays(d, -days);

// Generate UUIDs (simple version for seeding)
const uuid = () => crypto.randomUUID();

// Store IDs for relationships
const ids = {
  family: uuid(),
  members: {
    mike: uuid(),
    sarah: uuid(),
    emma: uuid(),
    jake: uuid(),
  },
  projects: {} as Record<string, string>,
  goals: {} as Record<string, string>,
  habits: {} as Record<string, string>,
  places: {} as Record<string, string>,
  contacts: {} as Record<string, string>,
  vendors: {} as Record<string, string>,
  recipes: {} as Record<string, string>,
  tasks: {} as Record<string, string>,
  somedayItems: {} as Record<string, string>,
};

async function seedDatabase() {
  console.log('🌱 Starting database seed...\n');

  try {
    // ============================================
    // 1. CREATE FAMILY
    // ============================================
    console.log('👨‍👩‍👧‍👦 Creating family...');

    const { error: familyError } = await supabase.from('families').insert({
      id: ids.family,
      name: 'The Johnson Family',
      settings: {
        timezone: 'America/Los_Angeles',
        meeting_day: 'sunday',
        meeting_time: '18:00',
      },
      profile: {
        location: 'San Francisco, CA',
        interests: ['hiking', 'board games', 'cooking', 'travel'],
        pets: [{ name: 'Buddy', type: 'dog', breed: 'Golden Retriever' }],
      },
    });
    if (familyError) throw familyError;

    // ============================================
    // 2. CREATE FAMILY MEMBERS
    // ============================================
    console.log('👥 Creating family members...');

    const members = [
      {
        id: ids.members.mike,
        family_id: ids.family,
        name: 'Mike',
        email: 'mike@johnson.family',
        role: 'owner',
        color: '#3B82F6', // blue
        birthday: '1985-03-15',
        preferences: { theme: 'light', notifications: true },
        profile: { occupation: 'Software Engineer', hobbies: ['woodworking', 'cycling'] },
      },
      {
        id: ids.members.sarah,
        family_id: ids.family,
        name: 'Sarah',
        email: 'sarah@johnson.family',
        role: 'adult',
        color: '#EC4899', // pink
        birthday: '1987-07-22',
        preferences: { theme: 'light', notifications: true },
        profile: { occupation: 'Marketing Manager', hobbies: ['yoga', 'reading', 'gardening'] },
      },
      {
        id: ids.members.emma,
        family_id: ids.family,
        name: 'Emma',
        email: 'emma@johnson.family',
        role: 'kid',
        color: '#8B5CF6', // purple
        birthday: '2012-11-08',
        preferences: { theme: 'dark' },
        profile: { grade: '7th grade', interests: ['art', 'soccer', 'minecraft'] },
      },
      {
        id: ids.members.jake,
        family_id: ids.family,
        name: 'Jake',
        email: 'jake@johnson.family',
        role: 'kid',
        color: '#10B981', // green
        birthday: '2015-04-30',
        preferences: { theme: 'light' },
        profile: { grade: '4th grade', interests: ['legos', 'basketball', 'dinosaurs'] },
      },
    ];

    const { error: membersError } = await supabase.from('family_members').insert(members);
    if (membersError) throw membersError;

    // ============================================
    // 3. CREATE PLACES
    // ============================================
    console.log('📍 Creating places...');

    const places = [
      { id: ids.places.pediatrician = uuid(), family_id: ids.family, name: 'Bay Area Pediatrics', category: 'medical', address_line1: '123 Health Way', city: 'San Francisco', state: 'CA', postal_code: '94110', phone: '(415) 555-0101', created_by: ids.members.sarah },
      { id: ids.places.dentist = uuid(), family_id: ids.family, name: 'Smile Family Dentistry', category: 'medical', address_line1: '456 Dental Dr', city: 'San Francisco', state: 'CA', postal_code: '94115', phone: '(415) 555-0102', created_by: ids.members.mike },
      { id: ids.places.school = uuid(), family_id: ids.family, name: 'Sunset Elementary', category: 'school', address_line1: '789 Education Blvd', city: 'San Francisco', state: 'CA', postal_code: '94116', phone: '(415) 555-0103', created_by: ids.members.sarah },
      { id: ids.places.middleSchool = uuid(), family_id: ids.family, name: 'Marina Middle School', category: 'school', address_line1: '321 Learning Lane', city: 'San Francisco', state: 'CA', postal_code: '94123', phone: '(415) 555-0104', created_by: ids.members.sarah },
      { id: ids.places.soccerField = uuid(), family_id: ids.family, name: 'Golden Gate Soccer Fields', category: 'activity', address_line1: 'Golden Gate Park', city: 'San Francisco', state: 'CA', postal_code: '94117', created_by: ids.members.mike },
      { id: ids.places.groceryStore = uuid(), family_id: ids.family, name: 'Whole Foods Market', category: 'shopping', address_line1: '1765 California St', city: 'San Francisco', state: 'CA', postal_code: '94109', phone: '(415) 555-0105', created_by: ids.members.sarah },
      { id: ids.places.favoriteRestaurant = uuid(), family_id: ids.family, name: 'Pasta Palace', category: 'restaurant', address_line1: '555 Italian Way', city: 'San Francisco', state: 'CA', postal_code: '94111', phone: '(415) 555-0106', notes: 'Great kids menu! Ask for the corner booth.', created_by: ids.members.mike },
      { id: ids.places.hardware = uuid(), family_id: ids.family, name: 'Home Depot', category: 'shopping', address_line1: '2000 Market St', city: 'San Francisco', state: 'CA', postal_code: '94114', created_by: ids.members.mike },
    ];

    const { error: placesError } = await supabase.from('places').insert(places);
    if (placesError) throw placesError;

    // ============================================
    // 4. CREATE CONTACTS
    // ============================================
    console.log('👋 Creating contacts...');

    const contacts = [
      { id: ids.contacts.grandmaJane = uuid(), family_id: ids.family, name: 'Grandma Jane', contact_type: 'family', phone: '(510) 555-0201', birthday: '1955-12-10', relationship: "Mike's mother", city: 'Oakland', state: 'CA', created_by: ids.members.mike },
      { id: ids.contacts.grandpaBob = uuid(), family_id: ids.family, name: 'Grandpa Bob', contact_type: 'family', phone: '(510) 555-0201', birthday: '1953-06-18', relationship: "Mike's father", city: 'Oakland', state: 'CA', created_by: ids.members.mike },
      { id: ids.contacts.uncleTom = uuid(), family_id: ids.family, name: 'Uncle Tom', contact_type: 'family', phone: '(650) 555-0202', birthday: '1982-09-25', relationship: "Sarah's brother", city: 'Palo Alto', state: 'CA', created_by: ids.members.sarah },
      { id: ids.contacts.auntLisa = uuid(), family_id: ids.family, name: 'Aunt Lisa', contact_type: 'family', phone: '(650) 555-0203', birthday: '1984-02-14', relationship: "Tom's wife", city: 'Palo Alto', state: 'CA', created_by: ids.members.sarah },
      { id: ids.contacts.cousinSophie = uuid(), family_id: ids.family, name: 'Sophie (cousin)', contact_type: 'family', birthday: '2013-08-05', relationship: "Tom & Lisa's daughter", created_by: ids.members.sarah },
      { id: ids.contacts.davidFamily = uuid(), family_id: ids.family, name: 'The Martinez Family', contact_type: 'friend', phone: '(415) 555-0301', relationship: 'Neighbors, kids are friends', notes: 'Maria and Carlos. Kids: Olivia (12), Lucas (9)', created_by: ids.members.sarah },
      { id: ids.contacts.emmaFriend = uuid(), family_id: ids.family, name: 'Zoe Chen', contact_type: 'friend', relationship: "Emma's best friend from school", notes: "Parents: Kevin & Amy. Lives on Oak Street.", created_by: ids.members.emma },
      { id: ids.contacts.jakeFriend = uuid(), family_id: ids.family, name: 'Tyler Wilson', contact_type: 'friend', relationship: "Jake's friend from basketball", notes: "Mom: Rebecca. Dad: James.", created_by: ids.members.jake },
    ];

    const { error: contactsError } = await supabase.from('contacts').insert(contacts);
    if (contactsError) throw contactsError;

    // ============================================
    // 5. CREATE VENDORS
    // ============================================
    console.log('🔧 Creating vendors...');

    const vendors = [
      { id: ids.vendors.drSmith = uuid(), family_id: ids.family, name: 'Dr. Emily Smith', category: 'medical', specialty: 'Pediatrician', phone: '(415) 555-0101', place_id: ids.places.pediatrician, notes: 'Great with kids, very patient', rating: 5, last_used_at: '2025-11-15', created_by: ids.members.sarah },
      { id: ids.vendors.drPatel = uuid(), family_id: ids.family, name: 'Dr. Raj Patel', category: 'dental', specialty: 'Family Dentist', phone: '(415) 555-0102', place_id: ids.places.dentist, notes: 'Does great cleanings, kids love the treasure chest', rating: 5, last_used_at: '2025-10-20', created_by: ids.members.mike },
      { id: ids.vendors.plumber = uuid(), family_id: ids.family, name: 'Mike\'s Plumbing', category: 'home', specialty: 'Plumber', phone: '(415) 555-0401', notes: 'Fast response, fair prices', rating: 4, last_used_at: '2025-08-10', created_by: ids.members.mike },
      { id: ids.vendors.electrician = uuid(), family_id: ids.family, name: 'Bay Electric', category: 'home', specialty: 'Electrician', phone: '(415) 555-0402', notes: 'Licensed and insured', rating: 5, created_by: ids.members.mike },
      { id: ids.vendors.vet = uuid(), family_id: ids.family, name: 'Happy Paws Vet Clinic', category: 'pet', specialty: 'Veterinarian', phone: '(415) 555-0501', notes: 'Buddy loves Dr. Garcia', rating: 5, last_used_at: '2025-09-01', created_by: ids.members.sarah },
      { id: ids.vendors.mechanic = uuid(), family_id: ids.family, name: 'AutoCare Plus', category: 'auto', specialty: 'Auto Repair', phone: '(415) 555-0601', notes: 'Honest pricing, quick turnaround', rating: 4, last_used_at: '2025-07-15', created_by: ids.members.mike },
    ];

    const { error: vendorsError } = await supabase.from('vendors').insert(vendors);
    if (vendorsError) throw vendorsError;

    // ============================================
    // 6. CREATE GOALS
    // ============================================
    console.log('🎯 Creating goals...');

    const goals = [
      // Family goals
      { id: ids.goals.familyVacation = uuid(), family_id: ids.family, title: 'Plan Summer Vacation to Hawaii', description: 'Research, book, and plan our summer 2026 family trip to Hawaii', definition_of_done: 'Flights booked, hotel reserved, itinerary planned', is_family_goal: true, goal_type: 'qualitative', status: 'active', target_date: '2026-06-01', created_by: ids.members.sarah },
      { id: ids.goals.emergencyFund = uuid(), family_id: ids.family, title: 'Build Emergency Fund', description: 'Save 6 months of expenses in emergency fund', is_family_goal: true, goal_type: 'quantitative', target_value: 30000, current_value: 18500, unit: 'dollars', status: 'active', target_date: '2026-12-31', created_by: ids.members.mike },

      // Mike's goals
      { id: ids.goals.mikeRun = uuid(), family_id: ids.family, title: 'Run a Half Marathon', description: 'Train for and complete a half marathon', definition_of_done: 'Cross the finish line!', owner_id: ids.members.mike, goal_type: 'qualitative', status: 'active', target_date: '2026-04-15', created_by: ids.members.mike },
      { id: ids.goals.mikeRead = uuid(), family_id: ids.family, title: 'Read 24 Books in 2026', owner_id: ids.members.mike, goal_type: 'quantitative', target_value: 24, current_value: 0, unit: 'books', status: 'active', target_date: '2026-12-31', created_by: ids.members.mike },
      { id: ids.goals.woodworkingProject = uuid(), family_id: ids.family, title: 'Build Kids\' Treehouse', description: 'Design and build a treehouse in the backyard', definition_of_done: 'Treehouse completed, safe, and kids approved', owner_id: ids.members.mike, goal_type: 'qualitative', status: 'active', target_date: '2026-08-01', created_by: ids.members.mike },

      // Sarah's goals
      { id: ids.goals.sarahYoga = uuid(), family_id: ids.family, title: 'Complete Yoga Teacher Training', description: '200-hour yoga teacher certification', definition_of_done: 'Receive certification', owner_id: ids.members.sarah, goal_type: 'qualitative', status: 'active', target_date: '2026-06-30', created_by: ids.members.sarah },
      { id: ids.goals.sarahGarden = uuid(), family_id: ids.family, title: 'Grow 50% of Summer Vegetables', description: 'Expand garden to grow more of our own food', owner_id: ids.members.sarah, goal_type: 'quantitative', target_value: 50, current_value: 20, unit: 'percent', status: 'active', target_date: '2026-09-01', created_by: ids.members.sarah },

      // Emma's goals
      { id: ids.goals.emmaArt = uuid(), family_id: ids.family, title: 'Create Art Portfolio', description: 'Build a portfolio of 20 pieces for art school applications', owner_id: ids.members.emma, goal_type: 'quantitative', target_value: 20, current_value: 8, unit: 'pieces', status: 'active', target_date: '2026-05-01', created_by: ids.members.emma },
      { id: ids.goals.emmaSoccer = uuid(), family_id: ids.family, title: 'Make Varsity Soccer Team', definition_of_done: 'Selected for varsity team in tryouts', owner_id: ids.members.emma, goal_type: 'qualitative', status: 'active', target_date: '2026-08-15', created_by: ids.members.emma },

      // Jake's goals
      { id: ids.goals.jakeReading = uuid(), family_id: ids.family, title: 'Read 15 Chapter Books', owner_id: ids.members.jake, goal_type: 'quantitative', target_value: 15, current_value: 3, unit: 'books', status: 'active', target_date: '2026-06-01', created_by: ids.members.jake },
      { id: ids.goals.jakeLego = uuid(), family_id: ids.family, title: 'Complete Star Wars Lego Collection', owner_id: ids.members.jake, goal_type: 'quantitative', target_value: 5, current_value: 2, unit: 'sets', status: 'active', target_date: '2026-12-31', created_by: ids.members.jake },
    ];

    const { error: goalsError } = await supabase.from('goals').insert(goals);
    if (goalsError) throw goalsError;

    // ============================================
    // 7. CREATE HABITS
    // ============================================
    console.log('🔄 Creating habits...');

    const habits = [
      // Mike's habits
      { id: ids.habits.mikeExercise = uuid(), family_id: ids.family, title: 'Morning Run', description: '30 min run before work', frequency: 'custom', days_of_week: [1, 3, 5], owner_id: ids.members.mike, goal_id: ids.goals.mikeRun, current_streak: 12, longest_streak: 28, last_completed_at: '2025-12-27', created_by: ids.members.mike },
      { id: ids.habits.mikeRead = uuid(), family_id: ids.family, title: 'Read 30 Minutes', frequency: 'daily', owner_id: ids.members.mike, goal_id: ids.goals.mikeRead, current_streak: 5, longest_streak: 45, last_completed_at: '2025-12-27', created_by: ids.members.mike },

      // Sarah's habits
      { id: ids.habits.sarahYoga = uuid(), family_id: ids.family, title: 'Morning Yoga', description: '20 min yoga practice', frequency: 'daily', owner_id: ids.members.sarah, goal_id: ids.goals.sarahYoga, current_streak: 30, longest_streak: 60, last_completed_at: '2025-12-27', created_by: ids.members.sarah },
      { id: ids.habits.sarahMeditation = uuid(), family_id: ids.family, title: 'Evening Meditation', description: '10 min meditation before bed', frequency: 'daily', owner_id: ids.members.sarah, current_streak: 14, longest_streak: 30, last_completed_at: '2025-12-27', created_by: ids.members.sarah },
      { id: ids.habits.sarahGarden = uuid(), family_id: ids.family, title: 'Garden Check', description: 'Water and check on garden', frequency: 'custom', days_of_week: [0, 2, 4, 6], owner_id: ids.members.sarah, goal_id: ids.goals.sarahGarden, current_streak: 8, longest_streak: 20, last_completed_at: '2025-12-26', created_by: ids.members.sarah },

      // Emma's habits
      { id: ids.habits.emmaArt = uuid(), family_id: ids.family, title: 'Art Practice', description: 'Work on art portfolio piece', frequency: 'custom', days_of_week: [1, 3, 5, 6], owner_id: ids.members.emma, goal_id: ids.goals.emmaArt, current_streak: 4, longest_streak: 15, last_completed_at: '2025-12-26', created_by: ids.members.emma },
      { id: ids.habits.emmaHomework = uuid(), family_id: ids.family, title: 'Homework Time', description: 'Complete daily homework', frequency: 'weekly', target_days_per_week: 5, owner_id: ids.members.emma, current_streak: 10, longest_streak: 25, last_completed_at: '2025-12-20', created_by: ids.members.sarah },

      // Jake's habits
      { id: ids.habits.jakeReading = uuid(), family_id: ids.family, title: 'Reading Time', description: 'Read chapter book for 20 mins', frequency: 'daily', owner_id: ids.members.jake, goal_id: ids.goals.jakeReading, current_streak: 7, longest_streak: 21, last_completed_at: '2025-12-27', created_by: ids.members.sarah },
      { id: ids.habits.jakePractice = uuid(), family_id: ids.family, title: 'Basketball Practice', description: 'Practice dribbling and shooting', frequency: 'custom', days_of_week: [2, 4, 6], owner_id: ids.members.jake, current_streak: 3, longest_streak: 12, last_completed_at: '2025-12-26', created_by: ids.members.jake },

      // Family habits
      { id: ids.habits.familyDinner = uuid(), family_id: ids.family, title: 'Family Dinner Together', frequency: 'daily', current_streak: 5, longest_streak: 14, last_completed_at: '2025-12-27', created_by: ids.members.sarah },
      { id: ids.habits.dogWalk = uuid(), family_id: ids.family, title: 'Walk Buddy', description: 'Evening dog walk', frequency: 'daily', current_streak: 30, longest_streak: 90, last_completed_at: '2025-12-27', created_by: ids.members.mike },
    ];

    const { error: habitsError } = await supabase.from('habits').insert(habits);
    if (habitsError) throw habitsError;

    // ============================================
    // 8. CREATE HABIT LOGS (last 14 days)
    // ============================================
    console.log('📝 Creating habit logs...');

    const habitLogs: Array<{habit_id: string; log_date: string; status: string; notes?: string}> = [];

    // Generate logs for the last 14 days for each habit
    for (let i = 0; i < 14; i++) {
      const logDate = toDateStr(subDays(TODAY, i));
      const isWeekend = [0, 6].includes(subDays(TODAY, i).getDay());
      const dayOfWeek = subDays(TODAY, i).getDay();

      // Mike's running (Mon, Wed, Fri)
      if ([1, 3, 5].includes(dayOfWeek)) {
        habitLogs.push({ habit_id: ids.habits.mikeExercise, log_date: logDate, status: Math.random() > 0.1 ? 'done' : 'skipped' });
      }

      // Mike's reading (daily)
      habitLogs.push({ habit_id: ids.habits.mikeRead, log_date: logDate, status: Math.random() > 0.15 ? 'done' : 'missed' });

      // Sarah's yoga (daily)
      habitLogs.push({ habit_id: ids.habits.sarahYoga, log_date: logDate, status: 'done' });

      // Sarah's meditation (daily)
      habitLogs.push({ habit_id: ids.habits.sarahMeditation, log_date: logDate, status: Math.random() > 0.2 ? 'done' : 'skipped' });

      // Sarah's garden (Sun, Tue, Thu, Sat)
      if ([0, 2, 4, 6].includes(dayOfWeek)) {
        habitLogs.push({ habit_id: ids.habits.sarahGarden, log_date: logDate, status: Math.random() > 0.1 ? 'done' : 'skipped' });
      }

      // Emma's art (Mon, Wed, Fri, Sat)
      if ([1, 3, 5, 6].includes(dayOfWeek)) {
        habitLogs.push({ habit_id: ids.habits.emmaArt, log_date: logDate, status: Math.random() > 0.2 ? 'done' : 'missed' });
      }

      // Jake's reading (daily)
      habitLogs.push({ habit_id: ids.habits.jakeReading, log_date: logDate, status: Math.random() > 0.15 ? 'done' : 'missed' });

      // Jake's basketball (Tue, Thu, Sat)
      if ([2, 4, 6].includes(dayOfWeek)) {
        habitLogs.push({ habit_id: ids.habits.jakePractice, log_date: logDate, status: Math.random() > 0.2 ? 'done' : 'skipped' });
      }

      // Family dinner (daily)
      habitLogs.push({ habit_id: ids.habits.familyDinner, log_date: logDate, status: Math.random() > 0.3 ? 'done' : 'missed' });

      // Dog walk (daily)
      habitLogs.push({ habit_id: ids.habits.dogWalk, log_date: logDate, status: 'done', notes: isWeekend ? 'Long walk at the park!' : undefined });
    }

    const { error: habitLogsError } = await supabase.from('habit_logs').insert(habitLogs);
    if (habitLogsError) throw habitLogsError;

    // ============================================
    // 9. CREATE PROJECTS
    // ============================================
    console.log('📁 Creating projects...');

    const projects = [
      { id: ids.projects.kitchenReno = uuid(), family_id: ids.family, title: 'Kitchen Renovation', description: 'Update kitchen cabinets, countertops, and appliances', notes: '## Budget\n- Cabinets: $8,000\n- Countertops: $3,000\n- Appliances: $4,000\n\n## Timeline\nStart after New Year', status: 'planning', owner_id: ids.members.mike, target_date: '2026-03-01', color: '#F59E0B', icon: '🏠', tags: ['home', 'renovation'], created_by: ids.members.mike },
      { id: ids.projects.hawaiiTrip = uuid(), family_id: ids.family, title: 'Hawaii Vacation Planning', description: 'Plan summer 2026 trip to Hawaii', status: 'active', owner_id: ids.members.sarah, target_date: '2026-06-15', color: '#06B6D4', icon: '🌴', tags: ['travel', 'vacation'], created_by: ids.members.sarah },
      { id: ids.projects.treehouse = uuid(), family_id: ids.family, title: 'Backyard Treehouse', description: 'Build a treehouse for the kids', notes: '## Materials Needed\n- Lumber\n- Hardware\n- Rope ladder\n- Safety rails', status: 'planning', owner_id: ids.members.mike, target_date: '2026-08-01', color: '#84CC16', icon: '🌳', tags: ['diy', 'kids'], created_by: ids.members.mike },
      { id: ids.projects.newYearsParty = uuid(), family_id: ids.family, title: 'New Year\'s Eve Party', description: 'Host NYE party for friends and family', status: 'active', owner_id: ids.members.sarah, target_date: '2025-12-31', color: '#A855F7', icon: '🎉', tags: ['party', 'holiday'], created_by: ids.members.sarah },
      { id: ids.projects.schoolYear = uuid(), family_id: ids.family, title: 'Spring Semester Prep', description: 'Get kids ready for spring semester', status: 'active', owner_id: ids.members.sarah, target_date: '2026-01-06', color: '#3B82F6', icon: '📚', tags: ['school', 'kids'], created_by: ids.members.sarah },
    ];

    const { error: projectsError } = await supabase.from('projects').insert(projects);
    if (projectsError) throw projectsError;

    // ============================================
    // 10. CREATE SOMEDAY ITEMS
    // ============================================
    console.log('💭 Creating someday items...');

    const somedayItems = [
      { id: ids.somedayItems.japan = uuid(), family_id: ids.family, title: 'Trip to Japan', description: 'Visit Tokyo, Kyoto, and Mount Fuji', category: 'trip', estimated_cost: 15000, added_by_id: ids.members.mike },
      { id: ids.somedayItems.hotTub = uuid(), family_id: ids.family, title: 'Install Hot Tub', description: 'Add a hot tub to the backyard', category: 'house', estimated_cost: 8000, added_by_id: ids.members.sarah },
      { id: ids.somedayItems.electricCar = uuid(), family_id: ids.family, title: 'Buy Electric Car', description: 'Replace minivan with an EV', category: 'purchase', estimated_cost: 45000, added_by_id: ids.members.mike },
      { id: ids.somedayItems.skiTrip = uuid(), family_id: ids.family, title: 'Family Ski Trip', description: 'Learn to ski together in Tahoe', category: 'experience', estimated_cost: 3000, added_by_id: ids.members.sarah },
      { id: ids.somedayItems.piano = uuid(), family_id: ids.family, title: 'Get Piano for Kids', description: 'Buy a piano and start lessons', category: 'purchase', estimated_cost: 2500, added_by_id: ids.members.sarah },
      { id: ids.somedayItems.solarPanels = uuid(), family_id: ids.family, title: 'Install Solar Panels', description: 'Go solar to reduce electricity bills', category: 'house', estimated_cost: 20000, added_by_id: ids.members.mike },
    ];

    const { error: somedayError } = await supabase.from('someday_items').insert(somedayItems);
    if (somedayError) throw somedayError;

    // ============================================
    // 11. CREATE TASKS
    // ============================================
    console.log('✅ Creating tasks...');

    const tasks = [
      // Inbox tasks
      { id: ids.tasks.inbox1 = uuid(), family_id: ids.family, title: 'Call insurance about car claim', status: 'inbox', created_by: ids.members.mike },
      { id: ids.tasks.inbox2 = uuid(), family_id: ids.family, title: 'Research summer camps for kids', status: 'inbox', created_by: ids.members.sarah },
      { id: ids.tasks.inbox3 = uuid(), family_id: ids.family, title: 'Fix squeaky door in hallway', status: 'inbox', created_by: ids.members.mike },

      // Active tasks - today and upcoming
      { id: ids.tasks.groceries = uuid(), family_id: ids.family, title: 'Grocery shopping for the week', description: 'Get items for meal plan', status: 'active', due_date: toDateStr(TODAY), scheduled_date: toDateStr(TODAY), assigned_to_id: ids.members.sarah, place_id: ids.places.groceryStore, priority: 2, tags: ['errands', 'weekly'], created_by: ids.members.sarah },
      { id: ids.tasks.nyeFood = uuid(), family_id: ids.family, title: 'Order NYE party appetizers', status: 'active', due_date: toDateStr(addDays(TODAY, 2)), project_id: ids.projects.newYearsParty, assigned_to_id: ids.members.sarah, priority: 3, created_by: ids.members.sarah },
      { id: ids.tasks.nyeDecorations = uuid(), family_id: ids.family, title: 'Set up NYE decorations', status: 'active', due_date: toDateStr(addDays(TODAY, 4)), project_id: ids.projects.newYearsParty, assigned_to_id: ids.members.mike, priority: 2, created_by: ids.members.sarah },
      { id: ids.tasks.cleanGarage = uuid(), family_id: ids.family, title: 'Clean out garage', status: 'active', due_date: toDateStr(addDays(TODAY, 3)), assigned_to_id: ids.members.mike, priority: 1, tags: ['home', 'cleaning'], created_by: ids.members.mike },
      { id: ids.tasks.buddyVet = uuid(), family_id: ids.family, title: 'Schedule Buddy\'s annual checkup', status: 'active', due_date: toDateStr(addDays(TODAY, 7)), assigned_to_id: ids.members.sarah, priority: 2, tags: ['pet'], created_by: ids.members.sarah },
      { id: ids.tasks.emmaSupplies = uuid(), family_id: ids.family, title: 'Buy school supplies for spring semester', status: 'active', due_date: toDateStr(addDays(TODAY, 8)), project_id: ids.projects.schoolYear, assigned_to_id: ids.members.sarah, priority: 2, created_by: ids.members.sarah },
      { id: ids.tasks.jakeBackpack = uuid(), family_id: ids.family, title: 'Order new backpack for Jake', status: 'active', due_date: toDateStr(addDays(TODAY, 5)), project_id: ids.projects.schoolYear, assigned_to_id: ids.members.sarah, priority: 1, created_by: ids.members.sarah },
      { id: ids.tasks.carWash = uuid(), family_id: ids.family, title: 'Get car washed', status: 'active', scheduled_date: toDateStr(addDays(TODAY, 1)), assigned_to_id: ids.members.mike, priority: 1, tags: ['errands'], created_by: ids.members.mike },
      { id: ids.tasks.dentistAppt = uuid(), family_id: ids.family, title: 'Schedule kids dental checkups', status: 'active', due_date: toDateStr(addDays(TODAY, 10)), assigned_to_id: ids.members.sarah, priority: 2, tags: ['health', 'kids'], created_by: ids.members.sarah },

      // Hawaii trip tasks
      { id: ids.tasks.hawaiiFlights = uuid(), family_id: ids.family, title: 'Research Hawaii flight options', status: 'active', due_date: toDateStr(addDays(TODAY, 14)), project_id: ids.projects.hawaiiTrip, goal_id: ids.goals.familyVacation, assigned_to_id: ids.members.sarah, priority: 2, created_by: ids.members.sarah },
      { id: ids.tasks.hawaiiHotel = uuid(), family_id: ids.family, title: 'Compare Maui vs Big Island hotels', status: 'active', due_date: toDateStr(addDays(TODAY, 21)), project_id: ids.projects.hawaiiTrip, goal_id: ids.goals.familyVacation, assigned_to_id: ids.members.mike, priority: 1, created_by: ids.members.sarah },

      // Treehouse tasks
      { id: ids.tasks.treehousePlans = uuid(), family_id: ids.family, title: 'Find treehouse building plans', status: 'active', due_date: toDateStr(addDays(TODAY, 30)), project_id: ids.projects.treehouse, goal_id: ids.goals.woodworkingProject, assigned_to_id: ids.members.mike, priority: 1, created_by: ids.members.mike },
      { id: ids.tasks.treehouseMaterials = uuid(), family_id: ids.family, title: 'Get lumber quote from Home Depot', status: 'active', project_id: ids.projects.treehouse, goal_id: ids.goals.woodworkingProject, assigned_to_id: ids.members.mike, place_id: ids.places.hardware, priority: 1, created_by: ids.members.mike },

      // Waiting for tasks
      { id: ids.tasks.waitingRefund = uuid(), family_id: ids.family, title: 'Amazon refund for broken toy', status: 'waiting_for', waiting_for: 'Waiting for Amazon to process refund - submitted 12/20', assigned_to_id: ids.members.sarah, created_by: ids.members.sarah },
      { id: ids.tasks.waitingPlumber = uuid(), family_id: ids.family, title: 'Plumber to fix bathroom leak', status: 'waiting_for', waiting_for: 'Scheduled for Jan 3rd', assigned_to_id: ids.members.mike, created_by: ids.members.mike },

      // Kids' tasks
      { id: ids.tasks.emmaRoom = uuid(), family_id: ids.family, title: 'Clean bedroom', description: 'Full room clean before New Year', status: 'active', due_date: toDateStr(addDays(TODAY, 2)), assigned_to_id: ids.members.emma, priority: 2, tags: ['chores'], created_by: ids.members.sarah },
      { id: ids.tasks.jakeRoom = uuid(), family_id: ids.family, title: 'Clean bedroom', description: 'Full room clean before New Year', status: 'active', due_date: toDateStr(addDays(TODAY, 2)), assigned_to_id: ids.members.jake, priority: 2, tags: ['chores'], created_by: ids.members.sarah },
      { id: ids.tasks.emmaThankYou = uuid(), family_id: ids.family, title: 'Write thank you cards for Christmas gifts', status: 'active', due_date: toDateStr(addDays(TODAY, 5)), assigned_to_id: ids.members.emma, priority: 1, created_by: ids.members.sarah },
      { id: ids.tasks.jakeThankYou = uuid(), family_id: ids.family, title: 'Write thank you cards for Christmas gifts', status: 'active', due_date: toDateStr(addDays(TODAY, 5)), assigned_to_id: ids.members.jake, priority: 1, created_by: ids.members.sarah },

      // Recurring tasks (examples)
      { id: ids.tasks.takeOutTrash = uuid(), family_id: ids.family, title: 'Take out trash', status: 'active', is_recurring: true, recurrence_frequency: 'weekly', recurrence_days_of_week: [4], assigned_to_id: ids.members.mike, tags: ['chores', 'weekly'], created_by: ids.members.mike },
      { id: ids.tasks.mowLawn = uuid(), family_id: ids.family, title: 'Mow the lawn', status: 'someday', is_recurring: true, recurrence_frequency: 'biweekly', assigned_to_id: ids.members.mike, tags: ['yard', 'chores'], created_by: ids.members.mike },

      // Completed tasks (recent)
      { id: ids.tasks.done1 = uuid(), family_id: ids.family, title: 'Wrap Christmas presents', status: 'done', completed_at: subDays(TODAY, 3).toISOString(), assigned_to_id: ids.members.sarah, created_by: ids.members.sarah },
      { id: ids.tasks.done2 = uuid(), family_id: ids.family, title: 'Buy Christmas tree', status: 'done', completed_at: subDays(TODAY, 10).toISOString(), assigned_to_id: ids.members.mike, created_by: ids.members.mike },
      { id: ids.tasks.done3 = uuid(), family_id: ids.family, title: 'Send holiday cards', status: 'done', completed_at: subDays(TODAY, 7).toISOString(), assigned_to_id: ids.members.sarah, created_by: ids.members.sarah },
      { id: ids.tasks.done4 = uuid(), family_id: ids.family, title: 'Kids dentist appointments', status: 'done', completed_at: subDays(TODAY, 14).toISOString(), assigned_to_id: ids.members.sarah, place_id: ids.places.dentist, created_by: ids.members.sarah },
    ];

    const { error: tasksError } = await supabase.from('tasks').insert(tasks);
    if (tasksError) throw tasksError;

    // ============================================
    // 12. CREATE SUBTASKS
    // ============================================
    console.log('📋 Creating subtasks...');

    const subtasks = [
      // Grocery shopping subtasks
      { task_id: ids.tasks.groceries, title: 'Milk and eggs', is_complete: false, sort_order: 0 },
      { task_id: ids.tasks.groceries, title: 'Fresh vegetables', is_complete: false, sort_order: 1 },
      { task_id: ids.tasks.groceries, title: 'Chicken breasts', is_complete: false, sort_order: 2 },
      { task_id: ids.tasks.groceries, title: 'Pasta and sauce', is_complete: false, sort_order: 3 },
      { task_id: ids.tasks.groceries, title: 'Snacks for kids', is_complete: false, sort_order: 4 },

      // NYE decorations subtasks
      { task_id: ids.tasks.nyeDecorations, title: 'Get balloons from party store', is_complete: false, sort_order: 0 },
      { task_id: ids.tasks.nyeDecorations, title: 'Set up photo backdrop', is_complete: false, sort_order: 1 },
      { task_id: ids.tasks.nyeDecorations, title: 'Hang string lights', is_complete: false, sort_order: 2 },
      { task_id: ids.tasks.nyeDecorations, title: 'Put out party hats and noisemakers', is_complete: false, sort_order: 3 },

      // Clean garage subtasks
      { task_id: ids.tasks.cleanGarage, title: 'Sort items into keep/donate/trash', is_complete: false, sort_order: 0 },
      { task_id: ids.tasks.cleanGarage, title: 'Sweep floor', is_complete: false, sort_order: 1 },
      { task_id: ids.tasks.cleanGarage, title: 'Organize tools', is_complete: false, sort_order: 2 },
      { task_id: ids.tasks.cleanGarage, title: 'Take donations to Goodwill', is_complete: false, sort_order: 3 },
    ];

    const { error: subtasksError } = await supabase.from('subtasks').insert(subtasks);
    if (subtasksError) throw subtasksError;

    // ============================================
    // 13. CREATE RECIPES
    // ============================================
    console.log('🍳 Creating recipes...');

    const recipes = [
      {
        id: ids.recipes.tacos = uuid(),
        family_id: ids.family,
        title: 'Chicken Tacos',
        description: 'Easy weeknight chicken tacos everyone loves',
        prep_time_minutes: 15,
        cook_time_minutes: 20,
        servings: 4,
        difficulty: 'easy',
        ingredients: JSON.stringify([
          { amount: '1', unit: 'lb', item: 'chicken breast' },
          { amount: '1', unit: 'packet', item: 'taco seasoning' },
          { amount: '8', unit: '', item: 'taco shells' },
          { amount: '1', unit: 'cup', item: 'shredded cheese' },
          { amount: '1', unit: 'cup', item: 'lettuce, shredded' },
          { amount: '1', unit: '', item: 'tomato, diced' },
          { amount: '', unit: '', item: 'sour cream' },
        ]),
        instructions: '1. Cook chicken in skillet until done\n2. Add taco seasoning with water per package\n3. Simmer until thickened\n4. Serve in shells with toppings',
        cuisine: 'Mexican',
        meal_type: ['dinner'],
        tags: ['quick', 'kid-friendly'],
        times_made: 12,
        last_made_at: '2025-12-15',
        rating: 5,
        created_by: ids.members.sarah,
      },
      {
        id: ids.recipes.pasta = uuid(),
        family_id: ids.family,
        title: 'Spaghetti Bolognese',
        description: 'Classic Italian meat sauce with spaghetti',
        prep_time_minutes: 20,
        cook_time_minutes: 45,
        servings: 6,
        difficulty: 'medium',
        ingredients: JSON.stringify([
          { amount: '1', unit: 'lb', item: 'ground beef' },
          { amount: '1', unit: 'can', item: 'crushed tomatoes (28oz)' },
          { amount: '1', unit: '', item: 'onion, diced' },
          { amount: '3', unit: 'cloves', item: 'garlic, minced' },
          { amount: '1', unit: 'lb', item: 'spaghetti' },
          { amount: '', unit: '', item: 'Italian seasoning' },
          { amount: '', unit: '', item: 'Parmesan cheese' },
        ]),
        instructions: '1. Brown beef with onion and garlic\n2. Add tomatoes and seasonings\n3. Simmer 30 minutes\n4. Cook pasta and serve with sauce',
        cuisine: 'Italian',
        meal_type: ['dinner'],
        tags: ['classic', 'comfort-food'],
        times_made: 8,
        last_made_at: '2025-12-10',
        rating: 5,
        created_by: ids.members.sarah,
      },
      {
        id: ids.recipes.stirfry = uuid(),
        family_id: ids.family,
        title: 'Veggie Stir Fry',
        description: 'Quick and healthy vegetable stir fry',
        prep_time_minutes: 15,
        cook_time_minutes: 10,
        servings: 4,
        difficulty: 'easy',
        ingredients: JSON.stringify([
          { amount: '2', unit: 'cups', item: 'broccoli florets' },
          { amount: '1', unit: '', item: 'bell pepper, sliced' },
          { amount: '1', unit: 'cup', item: 'snap peas' },
          { amount: '2', unit: 'tbsp', item: 'soy sauce' },
          { amount: '1', unit: 'tbsp', item: 'sesame oil' },
          { amount: '2', unit: 'cups', item: 'cooked rice' },
        ]),
        instructions: '1. Heat oil in wok\n2. Add vegetables and stir fry 5-7 min\n3. Add soy sauce\n4. Serve over rice',
        cuisine: 'Asian',
        meal_type: ['dinner', 'lunch'],
        dietary: ['vegetarian'],
        tags: ['healthy', 'quick'],
        times_made: 5,
        rating: 4,
        created_by: ids.members.sarah,
      },
      {
        id: ids.recipes.pancakes = uuid(),
        family_id: ids.family,
        title: 'Fluffy Pancakes',
        description: 'Weekend morning pancakes',
        prep_time_minutes: 10,
        cook_time_minutes: 15,
        servings: 4,
        difficulty: 'easy',
        ingredients: JSON.stringify([
          { amount: '2', unit: 'cups', item: 'flour' },
          { amount: '2', unit: 'tbsp', item: 'sugar' },
          { amount: '2', unit: 'tsp', item: 'baking powder' },
          { amount: '2', unit: '', item: 'eggs' },
          { amount: '1.5', unit: 'cups', item: 'milk' },
          { amount: '3', unit: 'tbsp', item: 'melted butter' },
        ]),
        instructions: '1. Mix dry ingredients\n2. Mix wet ingredients\n3. Combine and stir until just mixed\n4. Cook on griddle until bubbles form, flip',
        meal_type: ['breakfast'],
        tags: ['weekend', 'kid-favorite'],
        times_made: 20,
        last_made_at: '2025-12-22',
        rating: 5,
        created_by: ids.members.mike,
      },
      {
        id: ids.recipes.salad = uuid(),
        family_id: ids.family,
        title: 'Greek Salad',
        description: 'Fresh Mediterranean salad',
        prep_time_minutes: 15,
        cook_time_minutes: 0,
        servings: 4,
        difficulty: 'easy',
        ingredients: JSON.stringify([
          { amount: '1', unit: 'head', item: 'romaine lettuce' },
          { amount: '1', unit: 'cup', item: 'cherry tomatoes' },
          { amount: '1', unit: '', item: 'cucumber, diced' },
          { amount: '0.5', unit: 'cup', item: 'feta cheese' },
          { amount: '0.25', unit: 'cup', item: 'kalamata olives' },
          { amount: '', unit: '', item: 'olive oil and lemon dressing' },
        ]),
        instructions: '1. Chop vegetables\n2. Combine in bowl\n3. Add feta and olives\n4. Dress and serve',
        cuisine: 'Mediterranean',
        meal_type: ['lunch', 'dinner'],
        dietary: ['vegetarian', 'gluten-free'],
        tags: ['healthy', 'fresh'],
        times_made: 6,
        rating: 4,
        created_by: ids.members.sarah,
      },
      {
        id: ids.recipes.grilled_cheese = uuid(),
        family_id: ids.family,
        title: 'Grilled Cheese Sandwiches',
        description: 'Classic comfort food for quick lunches',
        prep_time_minutes: 5,
        cook_time_minutes: 10,
        servings: 4,
        difficulty: 'easy',
        ingredients: JSON.stringify([
          { amount: '8', unit: 'slices', item: 'bread' },
          { amount: '8', unit: 'slices', item: 'cheddar cheese' },
          { amount: '4', unit: 'tbsp', item: 'butter' },
        ]),
        instructions: '1. Butter one side of each bread slice\n2. Place cheese between unbuttered sides\n3. Grill until golden and cheese melts',
        meal_type: ['lunch'],
        tags: ['quick', 'kid-favorite', 'comfort-food'],
        times_made: 25,
        rating: 5,
        created_by: ids.members.sarah,
      },
    ];

    const { error: recipesError } = await supabase.from('recipes').insert(recipes);
    if (recipesError) throw recipesError;

    // ============================================
    // 14. CREATE MEALS (next 7 days)
    // ============================================
    console.log('🍽️ Creating meal plans...');

    const meals = [
      // Today - Dec 27
      { family_id: ids.family, meal_date: toDateStr(TODAY), meal_type: 'breakfast', title: 'Cereal and fruit', assigned_to_id: ids.members.sarah },
      { family_id: ids.family, meal_date: toDateStr(TODAY), meal_type: 'lunch', recipe_id: ids.recipes.grilled_cheese, assigned_to_id: ids.members.sarah },
      { family_id: ids.family, meal_date: toDateStr(TODAY), meal_type: 'dinner', recipe_id: ids.recipes.tacos, assigned_to_id: ids.members.sarah },

      // Dec 28
      { family_id: ids.family, meal_date: toDateStr(addDays(TODAY, 1)), meal_type: 'breakfast', recipe_id: ids.recipes.pancakes, assigned_to_id: ids.members.mike },
      { family_id: ids.family, meal_date: toDateStr(addDays(TODAY, 1)), meal_type: 'lunch', title: 'Leftovers', assigned_to_id: ids.members.sarah },
      { family_id: ids.family, meal_date: toDateStr(addDays(TODAY, 1)), meal_type: 'dinner', recipe_id: ids.recipes.pasta, assigned_to_id: ids.members.sarah },

      // Dec 29
      { family_id: ids.family, meal_date: toDateStr(addDays(TODAY, 2)), meal_type: 'breakfast', title: 'Eggs and toast', assigned_to_id: ids.members.mike },
      { family_id: ids.family, meal_date: toDateStr(addDays(TODAY, 2)), meal_type: 'lunch', recipe_id: ids.recipes.salad, assigned_to_id: ids.members.sarah },
      { family_id: ids.family, meal_date: toDateStr(addDays(TODAY, 2)), meal_type: 'dinner', recipe_id: ids.recipes.stirfry, assigned_to_id: ids.members.sarah },

      // Dec 30
      { family_id: ids.family, meal_date: toDateStr(addDays(TODAY, 3)), meal_type: 'dinner', title: 'Pizza night (order in)', notes: 'Busy with NYE prep!' },

      // Dec 31 - NYE
      { family_id: ids.family, meal_date: toDateStr(addDays(TODAY, 4)), meal_type: 'dinner', title: 'NYE Party Food', notes: 'Appetizers and finger foods for the party' },

      // Jan 1
      { family_id: ids.family, meal_date: toDateStr(addDays(TODAY, 5)), meal_type: 'breakfast', title: 'New Year brunch', notes: 'Late brunch after staying up!' },
      { family_id: ids.family, meal_date: toDateStr(addDays(TODAY, 5)), meal_type: 'dinner', title: 'Leftover party food' },

      // Jan 2
      { family_id: ids.family, meal_date: toDateStr(addDays(TODAY, 6)), meal_type: 'dinner', recipe_id: ids.recipes.tacos, assigned_to_id: ids.members.sarah },
    ];

    const { error: mealsError } = await supabase.from('meals').insert(meals);
    if (mealsError) throw mealsError;

    // ============================================
    // 15. CREATE FAMILY EVENTS
    // ============================================
    console.log('📅 Creating events...');

    const events = [
      // Today
      { family_id: ids.family, title: 'Walk Buddy at the park', start_time: new Date('2025-12-27T16:00:00-08:00').toISOString(), end_time: new Date('2025-12-27T17:00:00-08:00').toISOString(), timezone: 'America/Los_Angeles', icon: '🐕', created_by: ids.members.mike },

      // Tomorrow
      { family_id: ids.family, title: 'Family game night', start_time: new Date('2025-12-28T19:00:00-08:00').toISOString(), end_time: new Date('2025-12-28T21:00:00-08:00').toISOString(), timezone: 'America/Los_Angeles', icon: '🎲', created_by: ids.members.sarah },

      // Dec 29
      { family_id: ids.family, title: 'Lunch with Grandma Jane & Grandpa Bob', start_time: new Date('2025-12-29T12:00:00-08:00').toISOString(), end_time: new Date('2025-12-29T14:00:00-08:00').toISOString(), location: 'Pasta Palace', timezone: 'America/Los_Angeles', icon: '👵', created_by: ids.members.mike },

      // Dec 30
      { family_id: ids.family, title: 'NYE Party Prep', description: 'Decorate and prepare food', start_time: new Date('2025-12-30T14:00:00-08:00').toISOString(), end_time: new Date('2025-12-30T18:00:00-08:00').toISOString(), timezone: 'America/Los_Angeles', icon: '🎊', created_by: ids.members.sarah },

      // Dec 31 - NYE
      { family_id: ids.family, title: "New Year's Eve Party!", description: 'Annual NYE celebration with friends and family', start_time: new Date('2025-12-31T18:00:00-08:00').toISOString(), end_time: new Date('2026-01-01T01:00:00-08:00').toISOString(), timezone: 'America/Los_Angeles', icon: '🎉', color: '#A855F7', created_by: ids.members.sarah },

      // Jan 1
      { family_id: ids.family, title: "New Year's Day", is_all_day: true, start_time: new Date('2026-01-01T00:00:00-08:00').toISOString(), timezone: 'America/Los_Angeles', icon: '🎆', created_by: ids.members.sarah },

      // Jan 3
      { family_id: ids.family, title: 'Plumber visit - bathroom leak', start_time: new Date('2026-01-03T10:00:00-08:00').toISOString(), end_time: new Date('2026-01-03T12:00:00-08:00').toISOString(), timezone: 'America/Los_Angeles', icon: '🔧', created_by: ids.members.mike },

      // Jan 6 - Back to school
      { family_id: ids.family, title: 'Kids back to school', is_all_day: true, start_time: new Date('2026-01-06T00:00:00-08:00').toISOString(), timezone: 'America/Los_Angeles', icon: '📚', created_by: ids.members.sarah },

      // Weekly recurring - Family Meeting
      { family_id: ids.family, title: 'Family Meeting', description: 'Weekly family sync', start_time: new Date('2025-12-28T18:00:00-08:00').toISOString(), end_time: new Date('2025-12-28T19:00:00-08:00').toISOString(), timezone: 'America/Los_Angeles', is_recurring: true, recurrence_rule: 'FREQ=WEEKLY;BYDAY=SU', icon: '👨‍👩‍👧‍👦', created_by: ids.members.sarah },

      // Emma's soccer practice (recurring)
      { family_id: ids.family, title: "Emma's Soccer Practice", start_time: new Date('2026-01-07T16:00:00-08:00').toISOString(), end_time: new Date('2026-01-07T17:30:00-08:00').toISOString(), location: 'Golden Gate Soccer Fields', timezone: 'America/Los_Angeles', is_recurring: true, recurrence_rule: 'FREQ=WEEKLY;BYDAY=TU,TH', assigned_to: ids.members.emma, icon: '⚽', created_by: ids.members.sarah },

      // Jake's basketball (recurring)
      { family_id: ids.family, title: "Jake's Basketball Practice", start_time: new Date('2026-01-08T15:30:00-08:00').toISOString(), end_time: new Date('2026-01-08T16:30:00-08:00').toISOString(), timezone: 'America/Los_Angeles', is_recurring: true, recurrence_rule: 'FREQ=WEEKLY;BYDAY=WE', assigned_to: ids.members.jake, icon: '🏀', created_by: ids.members.sarah },

      // Sarah's yoga class (recurring)
      { family_id: ids.family, title: "Sarah's Yoga Class", start_time: new Date('2026-01-04T09:00:00-08:00').toISOString(), end_time: new Date('2026-01-04T10:00:00-08:00').toISOString(), timezone: 'America/Los_Angeles', is_recurring: true, recurrence_rule: 'FREQ=WEEKLY;BYDAY=SA', assigned_to: ids.members.sarah, icon: '🧘', created_by: ids.members.sarah },

      // Upcoming appointments
      { family_id: ids.family, title: "Kids' Dental Checkup", start_time: new Date('2026-01-15T14:00:00-08:00').toISOString(), end_time: new Date('2026-01-15T15:30:00-08:00').toISOString(), location: 'Smile Family Dentistry', timezone: 'America/Los_Angeles', icon: '🦷', created_by: ids.members.sarah },
      { family_id: ids.family, title: "Buddy's Vet Checkup", start_time: new Date('2026-01-10T11:00:00-08:00').toISOString(), end_time: new Date('2026-01-10T12:00:00-08:00').toISOString(), location: 'Happy Paws Vet Clinic', timezone: 'America/Los_Angeles', icon: '🐕', created_by: ids.members.sarah },
    ];

    const { error: eventsError } = await supabase.from('family_events').insert(events);
    if (eventsError) throw eventsError;

    // ============================================
    // 16. CREATE MILESTONES
    // ============================================
    console.log('🏆 Creating milestones...');

    const milestones = [
      { family_id: ids.family, title: 'Completed first 5K run!', person_id: ids.members.mike, occurred_at: '2025-11-15', goal_id: ids.goals.mikeRun, created_by: ids.members.mike },
      { family_id: ids.family, title: 'Finished yoga teacher training application', person_id: ids.members.sarah, occurred_at: '2025-12-01', goal_id: ids.goals.sarahYoga, created_by: ids.members.sarah },
      { family_id: ids.family, title: 'Art piece selected for school gallery!', person_id: ids.members.emma, occurred_at: '2025-12-10', goal_id: ids.goals.emmaArt, created_by: ids.members.emma },
      { family_id: ids.family, title: 'Read 3rd chapter book of the year', person_id: ids.members.jake, occurred_at: '2025-12-20', goal_id: ids.goals.jakeReading, created_by: ids.members.jake },
      { family_id: ids.family, title: 'Emergency fund reached $18,500!', description: 'Over halfway to our goal', person_id: ids.members.mike, occurred_at: '2025-12-15', goal_id: ids.goals.emergencyFund, created_by: ids.members.mike },
      { family_id: ids.family, title: 'Completed 30-day yoga streak', person_id: ids.members.sarah, occurred_at: '2025-12-27', created_by: ids.members.sarah },
    ];

    const { error: milestonesError } = await supabase.from('milestones').insert(milestones);
    if (milestonesError) throw milestonesError;

    // ============================================
    // 17. CREATE MEETING NOTES
    // ============================================
    console.log('📝 Creating meeting notes...');

    const meetingNotes = [
      {
        family_id: ids.family,
        meeting_date: '2025-12-22',
        notes: '## This Week\n- Christmas prep going well\n- Kids finished school for break\n- Buddy needs vet appointment scheduled\n\n## Celebrations\n- Emma\'s art was selected for gallery!\n- Jake finished another chapter book\n- Sarah completed 30 days of yoga',
        decisions: '- NYE party confirmed for 12/31\n- Will visit grandparents on 12/29\n- Kids responsible for thank you cards by 1/2',
        attendees: [ids.members.mike, ids.members.sarah, ids.members.emma, ids.members.jake],
        duration_minutes: 25,
        created_by: ids.members.sarah,
      },
      {
        family_id: ids.family,
        meeting_date: '2025-12-15',
        notes: '## This Week\n- Holiday shopping almost done\n- School winter concert was great\n- Emergency fund milestone reached!\n\n## Upcoming\n- Christmas Eve plans\n- NYE party planning',
        decisions: '- Mike handling tree setup\n- Sarah coordinating NYE food\n- Kids helping with decorations',
        attendees: [ids.members.mike, ids.members.sarah, ids.members.emma, ids.members.jake],
        duration_minutes: 30,
        created_by: ids.members.sarah,
      },
      {
        family_id: ids.family,
        meeting_date: '2025-12-08',
        notes: '## This Week\n- Kids\' activities winding down for break\n- Holiday cards sent out\n- Started Hawaii trip research\n\n## Discussion\n- Summer vacation options\n- Spring semester activities',
        decisions: '- Will do Hawaii for summer 2026\n- Emma continuing soccer in spring\n- Jake wants to try basketball',
        attendees: [ids.members.mike, ids.members.sarah, ids.members.emma, ids.members.jake],
        duration_minutes: 35,
        created_by: ids.members.mike,
      },
    ];

    const { error: meetingNotesError } = await supabase.from('meeting_notes').insert(meetingNotes);
    if (meetingNotesError) throw meetingNotesError;

    console.log('\n✅ Database seeding complete!\n');
    console.log('📊 Summary:');
    console.log('   - 1 family (The Johnson Family)');
    console.log('   - 4 family members (Mike, Sarah, Emma, Jake)');
    console.log('   - 8 places');
    console.log('   - 8 contacts');
    console.log('   - 6 vendors');
    console.log('   - 11 goals');
    console.log('   - 11 habits with 14 days of logs');
    console.log('   - 5 projects');
    console.log('   - 6 someday items');
    console.log('   - 25+ tasks with subtasks');
    console.log('   - 6 recipes');
    console.log('   - 14 meal plans');
    console.log('   - 14 calendar events');
    console.log('   - 6 milestones');
    console.log('   - 3 meeting notes');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed
seedDatabase();
