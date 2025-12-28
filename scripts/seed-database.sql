-- ============================================================================
-- FAM APP DATABASE SEED SCRIPT
-- ============================================================================
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- This populates the database with sample data for hazel.quimpo@gmail.com's family
-- Reference date: December 27, 2025
-- ============================================================================

DO $$
DECLARE
    v_family_id UUID;
    v_owner_id UUID;  -- The existing user (hazel.quimpo@gmail.com)
    v_member2_id UUID;
    v_member3_id UUID;
    v_member4_id UUID;
    v_place_pediatrician UUID;
    v_place_dentist UUID;
    v_place_school UUID;
    v_place_middle_school UUID;
    v_place_soccer UUID;
    v_place_grocery UUID;
    v_place_restaurant UUID;
    v_place_hardware UUID;
    v_contact_grandma UUID;
    v_contact_grandpa UUID;
    v_contact_uncle UUID;
    v_contact_aunt UUID;
    v_contact_cousin UUID;
    v_contact_neighbors UUID;
    v_contact_emma_friend UUID;
    v_contact_jake_friend UUID;
    v_goal_vacation UUID;
    v_goal_emergency UUID;
    v_goal_mike_run UUID;
    v_goal_mike_read UUID;
    v_goal_treehouse UUID;
    v_goal_sarah_yoga UUID;
    v_goal_sarah_garden UUID;
    v_goal_emma_art UUID;
    v_goal_emma_soccer UUID;
    v_goal_jake_reading UUID;
    v_goal_jake_lego UUID;
    v_habit_mike_run UUID;
    v_habit_mike_read UUID;
    v_habit_sarah_yoga UUID;
    v_habit_sarah_med UUID;
    v_habit_sarah_garden UUID;
    v_habit_emma_art UUID;
    v_habit_emma_hw UUID;
    v_habit_jake_read UUID;
    v_habit_jake_bball UUID;
    v_habit_family_dinner UUID;
    v_habit_dog_walk UUID;
    v_project_kitchen UUID;
    v_project_hawaii UUID;
    v_project_treehouse UUID;
    v_project_nye UUID;
    v_project_school UUID;
    v_recipe_tacos UUID;
    v_recipe_pasta UUID;
    v_recipe_stirfry UUID;
    v_recipe_pancakes UUID;
    v_recipe_salad UUID;
    v_recipe_grilled_cheese UUID;
    v_task_groceries UUID;
    v_task_nye_food UUID;
    v_task_nye_deco UUID;
    v_task_garage UUID;
BEGIN
    -- ========================================
    -- 1. LOOK UP EXISTING USER & FAMILY
    -- ========================================
    -- Find the family member for hazel.quimpo@gmail.com
    SELECT fm.id, fm.family_id INTO v_owner_id, v_family_id
    FROM family_members fm
    WHERE fm.email = 'hazel.quimpo@gmail.com'
    LIMIT 1;

    -- If not found by email, try looking up via auth.users
    IF v_owner_id IS NULL THEN
        SELECT fm.id, fm.family_id INTO v_owner_id, v_family_id
        FROM family_members fm
        JOIN auth.users au ON fm.auth_user_id = au.id
        WHERE au.email = 'hazel.quimpo@gmail.com'
        LIMIT 1;
    END IF;

    IF v_family_id IS NULL THEN
        RAISE EXCEPTION 'Could not find family for hazel.quimpo@gmail.com. Please make sure you have signed up and created a family first.';
    END IF;

    RAISE NOTICE 'Found family_id: %, owner_id: %', v_family_id, v_owner_id;

    -- ========================================
    -- 2. CREATE ADDITIONAL FAMILY MEMBERS (optional sample members)
    -- ========================================
    v_member2_id := gen_random_uuid();
    v_member3_id := gen_random_uuid();
    v_member4_id := gen_random_uuid();

    INSERT INTO family_members (id, family_id, name, email, role, color, birthday, preferences, profile) VALUES
    (v_member2_id, v_family_id, 'Alex', 'alex@example.family', 'adult', '#EC4899', '1990-07-22', '{"theme": "light"}'::jsonb, '{"hobbies": ["yoga", "reading", "gardening"]}'::jsonb),
    (v_member3_id, v_family_id, 'Emma', 'emma@example.family', 'kid', '#8B5CF6', '2012-11-08', '{"theme": "dark"}'::jsonb, '{"grade": "7th grade", "interests": ["art", "soccer", "minecraft"]}'::jsonb),
    (v_member4_id, v_family_id, 'Jake', 'jake@example.family', 'kid', '#10B981', '2015-04-30', '{"theme": "light"}'::jsonb, '{"grade": "4th grade", "interests": ["legos", "basketball", "dinosaurs"]}'::jsonb)
    ON CONFLICT DO NOTHING;

    -- ========================================
    -- 3. CREATE PLACES
    -- ========================================
    v_place_pediatrician := gen_random_uuid();
    v_place_dentist := gen_random_uuid();
    v_place_school := gen_random_uuid();
    v_place_middle_school := gen_random_uuid();
    v_place_soccer := gen_random_uuid();
    v_place_grocery := gen_random_uuid();
    v_place_restaurant := gen_random_uuid();
    v_place_hardware := gen_random_uuid();

    INSERT INTO places (id, family_id, name, category, address_line1, city, state, postal_code, phone, notes, created_by) VALUES
    (v_place_pediatrician, v_family_id, 'Bay Area Pediatrics', 'medical', '123 Health Way', 'San Francisco', 'CA', '94110', '(415) 555-0101', NULL, v_member2_id),
    (v_place_dentist, v_family_id, 'Smile Family Dentistry', 'medical', '456 Dental Dr', 'San Francisco', 'CA', '94115', '(415) 555-0102', NULL, v_owner_id),
    (v_place_school, v_family_id, 'Sunset Elementary', 'school', '789 Education Blvd', 'San Francisco', 'CA', '94116', '(415) 555-0103', NULL, v_member2_id),
    (v_place_middle_school, v_family_id, 'Marina Middle School', 'school', '321 Learning Lane', 'San Francisco', 'CA', '94123', '(415) 555-0104', NULL, v_member2_id),
    (v_place_soccer, v_family_id, 'Golden Gate Soccer Fields', 'activity', 'Golden Gate Park', 'San Francisco', 'CA', '94117', NULL, NULL, v_owner_id),
    (v_place_grocery, v_family_id, 'Whole Foods Market', 'shopping', '1765 California St', 'San Francisco', 'CA', '94109', '(415) 555-0105', NULL, v_member2_id),
    (v_place_restaurant, v_family_id, 'Pasta Palace', 'restaurant', '555 Italian Way', 'San Francisco', 'CA', '94111', '(415) 555-0106', 'Great kids menu! Ask for the corner booth.', v_owner_id),
    (v_place_hardware, v_family_id, 'Home Depot', 'shopping', '2000 Market St', 'San Francisco', 'CA', '94114', NULL, NULL, v_owner_id);

    -- ========================================
    -- 4. CREATE CONTACTS
    -- ========================================
    v_contact_grandma := gen_random_uuid();
    v_contact_grandpa := gen_random_uuid();
    v_contact_uncle := gen_random_uuid();
    v_contact_aunt := gen_random_uuid();
    v_contact_cousin := gen_random_uuid();
    v_contact_neighbors := gen_random_uuid();
    v_contact_emma_friend := gen_random_uuid();
    v_contact_jake_friend := gen_random_uuid();

    INSERT INTO contacts (id, family_id, name, contact_type, phone, birthday, relationship, city, state, notes, created_by) VALUES
    (v_contact_grandma, v_family_id, 'Grandma Jane', 'family', '(510) 555-0201', '1955-12-10', 'Mike''s mother', 'Oakland', 'CA', NULL, v_owner_id),
    (v_contact_grandpa, v_family_id, 'Grandpa Bob', 'family', '(510) 555-0201', '1953-06-18', 'Mike''s father', 'Oakland', 'CA', NULL, v_owner_id),
    (v_contact_uncle, v_family_id, 'Uncle Tom', 'family', '(650) 555-0202', '1982-09-25', 'Sarah''s brother', 'Palo Alto', 'CA', NULL, v_member2_id),
    (v_contact_aunt, v_family_id, 'Aunt Lisa', 'family', '(650) 555-0203', '1984-02-14', 'Tom''s wife', 'Palo Alto', 'CA', NULL, v_member2_id),
    (v_contact_cousin, v_family_id, 'Sophie (cousin)', 'family', NULL, '2013-08-05', 'Tom & Lisa''s daughter', NULL, NULL, NULL, v_member2_id),
    (v_contact_neighbors, v_family_id, 'The Martinez Family', 'friend', '(415) 555-0301', NULL, 'Neighbors, kids are friends', NULL, NULL, 'Maria and Carlos. Kids: Olivia (12), Lucas (9)', v_member2_id),
    (v_contact_emma_friend, v_family_id, 'Zoe Chen', 'friend', NULL, NULL, 'Emma''s best friend from school', NULL, NULL, 'Parents: Kevin & Amy. Lives on Oak Street.', v_member3_id),
    (v_contact_jake_friend, v_family_id, 'Tyler Wilson', 'friend', NULL, NULL, 'Jake''s friend from basketball', NULL, NULL, 'Mom: Rebecca. Dad: James.', v_member4_id);

    -- ========================================
    -- 5. CREATE VENDORS
    -- ========================================
    INSERT INTO vendors (id, family_id, name, category, specialty, phone, place_id, notes, rating, last_used_at, created_by) VALUES
    (gen_random_uuid(), v_family_id, 'Dr. Emily Smith', 'medical', 'Pediatrician', '(415) 555-0101', v_place_pediatrician, 'Great with kids, very patient', 5, '2025-11-15', v_member2_id),
    (gen_random_uuid(), v_family_id, 'Dr. Raj Patel', 'dental', 'Family Dentist', '(415) 555-0102', v_place_dentist, 'Does great cleanings, kids love the treasure chest', 5, '2025-10-20', v_owner_id),
    (gen_random_uuid(), v_family_id, 'Mike''s Plumbing', 'home', 'Plumber', '(415) 555-0401', NULL, 'Fast response, fair prices', 4, '2025-08-10', v_owner_id),
    (gen_random_uuid(), v_family_id, 'Bay Electric', 'home', 'Electrician', '(415) 555-0402', NULL, 'Licensed and insured', 5, NULL, v_owner_id),
    (gen_random_uuid(), v_family_id, 'Happy Paws Vet Clinic', 'pet', 'Veterinarian', '(415) 555-0501', NULL, 'Buddy loves Dr. Garcia', 5, '2025-09-01', v_member2_id),
    (gen_random_uuid(), v_family_id, 'AutoCare Plus', 'auto', 'Auto Repair', '(415) 555-0601', NULL, 'Honest pricing, quick turnaround', 4, '2025-07-15', v_owner_id);

    -- ========================================
    -- 6. CREATE GOALS
    -- ========================================
    v_goal_vacation := gen_random_uuid();
    v_goal_emergency := gen_random_uuid();
    v_goal_mike_run := gen_random_uuid();
    v_goal_mike_read := gen_random_uuid();
    v_goal_treehouse := gen_random_uuid();
    v_goal_sarah_yoga := gen_random_uuid();
    v_goal_sarah_garden := gen_random_uuid();
    v_goal_emma_art := gen_random_uuid();
    v_goal_emma_soccer := gen_random_uuid();
    v_goal_jake_reading := gen_random_uuid();
    v_goal_jake_lego := gen_random_uuid();

    INSERT INTO goals (id, family_id, title, description, definition_of_done, owner_id, is_family_goal, goal_type, target_value, current_value, unit, status, target_date, created_by) VALUES
    -- Family goals
    (v_goal_vacation, v_family_id, 'Plan Summer Vacation to Hawaii', 'Research, book, and plan our summer 2026 family trip to Hawaii', 'Flights booked, hotel reserved, itinerary planned', NULL, true, 'qualitative', NULL, NULL, NULL, 'active', '2026-06-01', v_member2_id),
    (v_goal_emergency, v_family_id, 'Build Emergency Fund', 'Save 6 months of expenses in emergency fund', NULL, NULL, true, 'quantitative', 30000, 18500, 'dollars', 'active', '2026-12-31', v_owner_id),
    -- Mike's goals
    (v_goal_mike_run, v_family_id, 'Run a Half Marathon', 'Train for and complete a half marathon', 'Cross the finish line!', v_owner_id, false, 'qualitative', NULL, NULL, NULL, 'active', '2026-04-15', v_owner_id),
    (v_goal_mike_read, v_family_id, 'Read 24 Books in 2026', NULL, NULL, v_owner_id, false, 'quantitative', 24, 0, 'books', 'active', '2026-12-31', v_owner_id),
    (v_goal_treehouse, v_family_id, 'Build Kids'' Treehouse', 'Design and build a treehouse in the backyard', 'Treehouse completed, safe, and kids approved', v_owner_id, false, 'qualitative', NULL, NULL, NULL, 'active', '2026-08-01', v_owner_id),
    -- Sarah's goals
    (v_goal_sarah_yoga, v_family_id, 'Complete Yoga Teacher Training', '200-hour yoga teacher certification', 'Receive certification', v_member2_id, false, 'qualitative', NULL, NULL, NULL, 'active', '2026-06-30', v_member2_id),
    (v_goal_sarah_garden, v_family_id, 'Grow 50% of Summer Vegetables', 'Expand garden to grow more of our own food', NULL, v_member2_id, false, 'quantitative', 50, 20, 'percent', 'active', '2026-09-01', v_member2_id),
    -- Emma's goals
    (v_goal_emma_art, v_family_id, 'Create Art Portfolio', 'Build a portfolio of 20 pieces for art school applications', NULL, v_member3_id, false, 'quantitative', 20, 8, 'pieces', 'active', '2026-05-01', v_member3_id),
    (v_goal_emma_soccer, v_family_id, 'Make Varsity Soccer Team', NULL, 'Selected for varsity team in tryouts', v_member3_id, false, 'qualitative', NULL, NULL, NULL, 'active', '2026-08-15', v_member3_id),
    -- Jake's goals
    (v_goal_jake_reading, v_family_id, 'Read 15 Chapter Books', NULL, NULL, v_member4_id, false, 'quantitative', 15, 3, 'books', 'active', '2026-06-01', v_member4_id),
    (v_goal_jake_lego, v_family_id, 'Complete Star Wars Lego Collection', NULL, NULL, v_member4_id, false, 'quantitative', 5, 2, 'sets', 'active', '2026-12-31', v_member4_id);

    -- ========================================
    -- 7. CREATE HABITS
    -- ========================================
    v_habit_mike_run := gen_random_uuid();
    v_habit_mike_read := gen_random_uuid();
    v_habit_sarah_yoga := gen_random_uuid();
    v_habit_sarah_med := gen_random_uuid();
    v_habit_sarah_garden := gen_random_uuid();
    v_habit_emma_art := gen_random_uuid();
    v_habit_emma_hw := gen_random_uuid();
    v_habit_jake_read := gen_random_uuid();
    v_habit_jake_bball := gen_random_uuid();
    v_habit_family_dinner := gen_random_uuid();
    v_habit_dog_walk := gen_random_uuid();

    INSERT INTO habits (id, family_id, title, description, frequency, days_of_week, target_days_per_week, owner_id, goal_id, current_streak, longest_streak, last_completed_at, created_by) VALUES
    -- Mike's habits
    (v_habit_mike_run, v_family_id, 'Morning Run', '30 min run before work', 'custom', ARRAY[1,3,5], NULL, v_owner_id, v_goal_mike_run, 12, 28, '2025-12-27', v_owner_id),
    (v_habit_mike_read, v_family_id, 'Read 30 Minutes', NULL, 'daily', NULL, NULL, v_owner_id, v_goal_mike_read, 5, 45, '2025-12-27', v_owner_id),
    -- Sarah's habits
    (v_habit_sarah_yoga, v_family_id, 'Morning Yoga', '20 min yoga practice', 'daily', NULL, NULL, v_member2_id, v_goal_sarah_yoga, 30, 60, '2025-12-27', v_member2_id),
    (v_habit_sarah_med, v_family_id, 'Evening Meditation', '10 min meditation before bed', 'daily', NULL, NULL, v_member2_id, NULL, 14, 30, '2025-12-27', v_member2_id),
    (v_habit_sarah_garden, v_family_id, 'Garden Check', 'Water and check on garden', 'custom', ARRAY[0,2,4,6], NULL, v_member2_id, v_goal_sarah_garden, 8, 20, '2025-12-26', v_member2_id),
    -- Emma's habits
    (v_habit_emma_art, v_family_id, 'Art Practice', 'Work on art portfolio piece', 'custom', ARRAY[1,3,5,6], NULL, v_member3_id, v_goal_emma_art, 4, 15, '2025-12-26', v_member3_id),
    (v_habit_emma_hw, v_family_id, 'Homework Time', 'Complete daily homework', 'weekly', NULL, 5, v_member3_id, NULL, 10, 25, '2025-12-20', v_member2_id),
    -- Jake's habits
    (v_habit_jake_read, v_family_id, 'Reading Time', 'Read chapter book for 20 mins', 'daily', NULL, NULL, v_member4_id, v_goal_jake_reading, 7, 21, '2025-12-27', v_member2_id),
    (v_habit_jake_bball, v_family_id, 'Basketball Practice', 'Practice dribbling and shooting', 'custom', ARRAY[2,4,6], NULL, v_member4_id, NULL, 3, 12, '2025-12-26', v_member4_id),
    -- Family habits
    (v_habit_family_dinner, v_family_id, 'Family Dinner Together', NULL, 'daily', NULL, NULL, NULL, NULL, 5, 14, '2025-12-27', v_member2_id),
    (v_habit_dog_walk, v_family_id, 'Walk Buddy', 'Evening dog walk', 'daily', NULL, NULL, NULL, NULL, 30, 90, '2025-12-27', v_owner_id);

    -- ========================================
    -- 8. CREATE HABIT LOGS (last 14 days)
    -- ========================================
    INSERT INTO habit_logs (habit_id, log_date, status, notes)
    SELECT v_habit_sarah_yoga, d::date, 'done', NULL
    FROM generate_series('2025-12-14'::date, '2025-12-27'::date, '1 day'::interval) d;

    INSERT INTO habit_logs (habit_id, log_date, status, notes)
    SELECT v_habit_dog_walk, d::date, 'done', CASE WHEN EXTRACT(dow FROM d) IN (0,6) THEN 'Long walk at the park!' ELSE NULL END
    FROM generate_series('2025-12-14'::date, '2025-12-27'::date, '1 day'::interval) d;

    INSERT INTO habit_logs (habit_id, log_date, status, notes) VALUES
    (v_habit_mike_run, '2025-12-27', 'done', NULL),
    (v_habit_mike_run, '2025-12-25', 'done', NULL),
    (v_habit_mike_run, '2025-12-23', 'done', NULL),
    (v_habit_mike_run, '2025-12-20', 'done', NULL),
    (v_habit_mike_run, '2025-12-18', 'done', NULL),
    (v_habit_mike_run, '2025-12-16', 'done', NULL),
    (v_habit_mike_read, '2025-12-27', 'done', NULL),
    (v_habit_mike_read, '2025-12-26', 'done', NULL),
    (v_habit_mike_read, '2025-12-25', 'done', NULL),
    (v_habit_mike_read, '2025-12-24', 'done', NULL),
    (v_habit_mike_read, '2025-12-23', 'done', NULL),
    (v_habit_jake_read, '2025-12-27', 'done', NULL),
    (v_habit_jake_read, '2025-12-26', 'done', NULL),
    (v_habit_jake_read, '2025-12-25', 'done', NULL),
    (v_habit_jake_read, '2025-12-24', 'done', NULL),
    (v_habit_jake_read, '2025-12-23', 'done', NULL),
    (v_habit_jake_read, '2025-12-22', 'done', NULL),
    (v_habit_jake_read, '2025-12-21', 'done', NULL);

    -- ========================================
    -- 9. CREATE PROJECTS
    -- ========================================
    v_project_kitchen := gen_random_uuid();
    v_project_hawaii := gen_random_uuid();
    v_project_treehouse := gen_random_uuid();
    v_project_nye := gen_random_uuid();
    v_project_school := gen_random_uuid();

    INSERT INTO projects (id, family_id, title, description, notes, status, owner_id, target_date, color, icon, tags, created_by) VALUES
    (v_project_kitchen, v_family_id, 'Kitchen Renovation', 'Update kitchen cabinets, countertops, and appliances', '## Budget\n- Cabinets: $8,000\n- Countertops: $3,000\n- Appliances: $4,000\n\n## Timeline\nStart after New Year', 'planning', v_owner_id, '2026-03-01', '#F59E0B', '🏠', ARRAY['home', 'renovation'], v_owner_id),
    (v_project_hawaii, v_family_id, 'Hawaii Vacation Planning', 'Plan summer 2026 trip to Hawaii', NULL, 'active', v_member2_id, '2026-06-15', '#06B6D4', '🌴', ARRAY['travel', 'vacation'], v_member2_id),
    (v_project_treehouse, v_family_id, 'Backyard Treehouse', 'Build a treehouse for the kids', '## Materials Needed\n- Lumber\n- Hardware\n- Rope ladder\n- Safety rails', 'planning', v_owner_id, '2026-08-01', '#84CC16', '🌳', ARRAY['diy', 'kids'], v_owner_id),
    (v_project_nye, v_family_id, 'New Year''s Eve Party', 'Host NYE party for friends and family', NULL, 'active', v_member2_id, '2025-12-31', '#A855F7', '🎉', ARRAY['party', 'holiday'], v_member2_id),
    (v_project_school, v_family_id, 'Spring Semester Prep', 'Get kids ready for spring semester', NULL, 'active', v_member2_id, '2026-01-06', '#3B82F6', '📚', ARRAY['school', 'kids'], v_member2_id);

    -- ========================================
    -- 10. CREATE SOMEDAY ITEMS
    -- ========================================
    INSERT INTO someday_items (family_id, title, description, category, estimated_cost, added_by_id) VALUES
    (v_family_id, 'Trip to Japan', 'Visit Tokyo, Kyoto, and Mount Fuji', 'trip', 15000, v_owner_id),
    (v_family_id, 'Install Hot Tub', 'Add a hot tub to the backyard', 'house', 8000, v_member2_id),
    (v_family_id, 'Buy Electric Car', 'Replace minivan with an EV', 'purchase', 45000, v_owner_id),
    (v_family_id, 'Family Ski Trip', 'Learn to ski together in Tahoe', 'experience', 3000, v_member2_id),
    (v_family_id, 'Get Piano for Kids', 'Buy a piano and start lessons', 'purchase', 2500, v_member2_id),
    (v_family_id, 'Install Solar Panels', 'Go solar to reduce electricity bills', 'house', 20000, v_owner_id);

    -- ========================================
    -- 11. CREATE TASKS
    -- ========================================
    v_task_groceries := gen_random_uuid();
    v_task_nye_food := gen_random_uuid();
    v_task_nye_deco := gen_random_uuid();
    v_task_garage := gen_random_uuid();

    -- Inbox tasks
    INSERT INTO tasks (family_id, title, status, created_by) VALUES
    (v_family_id, 'Call insurance about car claim', 'inbox', v_owner_id),
    (v_family_id, 'Research summer camps for kids', 'inbox', v_member2_id),
    (v_family_id, 'Fix squeaky door in hallway', 'inbox', v_owner_id);

    -- Active tasks
    INSERT INTO tasks (id, family_id, title, description, status, due_date, scheduled_date, assigned_to_id, place_id, priority, tags, created_by) VALUES
    (v_task_groceries, v_family_id, 'Grocery shopping for the week', 'Get items for meal plan', 'active', '2025-12-27', '2025-12-27', v_member2_id, v_place_grocery, 2, ARRAY['errands', 'weekly'], v_member2_id);

    INSERT INTO tasks (id, family_id, title, status, due_date, project_id, assigned_to_id, priority, created_by) VALUES
    (v_task_nye_food, v_family_id, 'Order NYE party appetizers', 'active', '2025-12-29', v_project_nye, v_member2_id, 3, v_member2_id),
    (v_task_nye_deco, v_family_id, 'Set up NYE decorations', 'active', '2025-12-31', v_project_nye, v_owner_id, 2, v_member2_id);

    INSERT INTO tasks (id, family_id, title, status, due_date, assigned_to_id, priority, tags, created_by) VALUES
    (v_task_garage, v_family_id, 'Clean out garage', 'active', '2025-12-30', v_owner_id, 1, ARRAY['home', 'cleaning'], v_owner_id);

    INSERT INTO tasks (family_id, title, status, due_date, assigned_to_id, priority, tags, created_by) VALUES
    (v_family_id, 'Schedule Buddy''s annual checkup', 'active', '2026-01-03', v_member2_id, 2, ARRAY['pet'], v_member2_id),
    (v_family_id, 'Buy school supplies for spring semester', 'active', '2026-01-04', v_member2_id, 2, NULL, v_member2_id),
    (v_family_id, 'Order new backpack for Jake', 'active', '2026-01-01', v_member2_id, 1, NULL, v_member2_id),
    (v_family_id, 'Get car washed', 'active', '2025-12-28', v_owner_id, 1, ARRAY['errands'], v_owner_id),
    (v_family_id, 'Schedule kids dental checkups', 'active', '2026-01-06', v_member2_id, 2, ARRAY['health', 'kids'], v_member2_id);

    -- Hawaii trip tasks
    INSERT INTO tasks (family_id, title, status, due_date, project_id, goal_id, assigned_to_id, priority, created_by) VALUES
    (v_family_id, 'Research Hawaii flight options', 'active', '2026-01-10', v_project_hawaii, v_goal_vacation, v_member2_id, 2, v_member2_id),
    (v_family_id, 'Compare Maui vs Big Island hotels', 'active', '2026-01-17', v_project_hawaii, v_goal_vacation, v_owner_id, 1, v_member2_id);

    -- Treehouse tasks
    INSERT INTO tasks (family_id, title, status, due_date, project_id, goal_id, assigned_to_id, priority, place_id, created_by) VALUES
    (v_family_id, 'Find treehouse building plans', 'active', '2026-01-26', v_project_treehouse, v_goal_treehouse, v_owner_id, 1, NULL, v_owner_id),
    (v_family_id, 'Get lumber quote from Home Depot', 'active', NULL, v_project_treehouse, v_goal_treehouse, v_owner_id, 1, v_place_hardware, v_owner_id);

    -- Waiting for tasks
    INSERT INTO tasks (family_id, title, status, waiting_for, assigned_to_id, created_by) VALUES
    (v_family_id, 'Amazon refund for broken toy', 'waiting_for', 'Waiting for Amazon to process refund - submitted 12/20', v_member2_id, v_member2_id),
    (v_family_id, 'Plumber to fix bathroom leak', 'waiting_for', 'Scheduled for Jan 3rd', v_owner_id, v_owner_id);

    -- Kids' tasks
    INSERT INTO tasks (family_id, title, description, status, due_date, assigned_to_id, priority, tags, created_by) VALUES
    (v_family_id, 'Clean bedroom', 'Full room clean before New Year', 'active', '2025-12-29', v_member3_id, 2, ARRAY['chores'], v_member2_id),
    (v_family_id, 'Clean bedroom', 'Full room clean before New Year', 'active', '2025-12-29', v_member4_id, 2, ARRAY['chores'], v_member2_id),
    (v_family_id, 'Write thank you cards for Christmas gifts', NULL, 'active', '2026-01-01', v_member3_id, 1, NULL, v_member2_id),
    (v_family_id, 'Write thank you cards for Christmas gifts', NULL, 'active', '2026-01-01', v_member4_id, 1, NULL, v_member2_id);

    -- Recurring tasks
    INSERT INTO tasks (family_id, title, status, is_recurring, recurrence_frequency, recurrence_days_of_week, assigned_to_id, tags, created_by) VALUES
    (v_family_id, 'Take out trash', 'active', true, 'weekly', ARRAY[4], v_owner_id, ARRAY['chores', 'weekly'], v_owner_id),
    (v_family_id, 'Mow the lawn', 'someday', true, 'biweekly', NULL, v_owner_id, ARRAY['yard', 'chores'], v_owner_id);

    -- Completed tasks
    INSERT INTO tasks (family_id, title, status, completed_at, assigned_to_id, created_by) VALUES
    (v_family_id, 'Wrap Christmas presents', 'done', '2025-12-24 15:00:00-08', v_member2_id, v_member2_id),
    (v_family_id, 'Buy Christmas tree', 'done', '2025-12-17 14:00:00-08', v_owner_id, v_owner_id),
    (v_family_id, 'Send holiday cards', 'done', '2025-12-20 10:00:00-08', v_member2_id, v_member2_id),
    (v_family_id, 'Kids dentist appointments', 'done', '2025-12-13 14:30:00-08', v_member2_id, v_member2_id);

    -- ========================================
    -- 12. CREATE SUBTASKS
    -- ========================================
    INSERT INTO subtasks (task_id, title, is_complete, sort_order) VALUES
    (v_task_groceries, 'Milk and eggs', false, 0),
    (v_task_groceries, 'Fresh vegetables', false, 1),
    (v_task_groceries, 'Chicken breasts', false, 2),
    (v_task_groceries, 'Pasta and sauce', false, 3),
    (v_task_groceries, 'Snacks for kids', false, 4),
    (v_task_nye_deco, 'Get balloons from party store', false, 0),
    (v_task_nye_deco, 'Set up photo backdrop', false, 1),
    (v_task_nye_deco, 'Hang string lights', false, 2),
    (v_task_nye_deco, 'Put out party hats and noisemakers', false, 3),
    (v_task_garage, 'Sort items into keep/donate/trash', false, 0),
    (v_task_garage, 'Sweep floor', false, 1),
    (v_task_garage, 'Organize tools', false, 2),
    (v_task_garage, 'Take donations to Goodwill', false, 3);

    -- ========================================
    -- 13. CREATE RECIPES
    -- ========================================
    v_recipe_tacos := gen_random_uuid();
    v_recipe_pasta := gen_random_uuid();
    v_recipe_stirfry := gen_random_uuid();
    v_recipe_pancakes := gen_random_uuid();
    v_recipe_salad := gen_random_uuid();
    v_recipe_grilled_cheese := gen_random_uuid();

    INSERT INTO recipes (id, family_id, title, description, prep_time_minutes, cook_time_minutes, servings, difficulty, ingredients, instructions, cuisine, meal_type, dietary, tags, times_made, last_made_at, rating, created_by) VALUES
    (v_recipe_tacos, v_family_id, 'Chicken Tacos', 'Easy weeknight chicken tacos everyone loves', 15, 20, 4, 'easy',
     '[{"amount": "1", "unit": "lb", "item": "chicken breast"}, {"amount": "1", "unit": "packet", "item": "taco seasoning"}, {"amount": "8", "unit": "", "item": "taco shells"}, {"amount": "1", "unit": "cup", "item": "shredded cheese"}, {"amount": "1", "unit": "cup", "item": "lettuce, shredded"}, {"amount": "1", "unit": "", "item": "tomato, diced"}, {"amount": "", "unit": "", "item": "sour cream"}]'::jsonb,
     '1. Cook chicken in skillet until done\n2. Add taco seasoning with water per package\n3. Simmer until thickened\n4. Serve in shells with toppings',
     'Mexican', ARRAY['dinner'], NULL, ARRAY['quick', 'kid-friendly'], 12, '2025-12-15', 5, v_member2_id),
    (v_recipe_pasta, v_family_id, 'Spaghetti Bolognese', 'Classic Italian meat sauce with spaghetti', 20, 45, 6, 'medium',
     '[{"amount": "1", "unit": "lb", "item": "ground beef"}, {"amount": "1", "unit": "can", "item": "crushed tomatoes (28oz)"}, {"amount": "1", "unit": "", "item": "onion, diced"}, {"amount": "3", "unit": "cloves", "item": "garlic, minced"}, {"amount": "1", "unit": "lb", "item": "spaghetti"}, {"amount": "", "unit": "", "item": "Italian seasoning"}, {"amount": "", "unit": "", "item": "Parmesan cheese"}]'::jsonb,
     '1. Brown beef with onion and garlic\n2. Add tomatoes and seasonings\n3. Simmer 30 minutes\n4. Cook pasta and serve with sauce',
     'Italian', ARRAY['dinner'], NULL, ARRAY['classic', 'comfort-food'], 8, '2025-12-10', 5, v_member2_id),
    (v_recipe_stirfry, v_family_id, 'Veggie Stir Fry', 'Quick and healthy vegetable stir fry', 15, 10, 4, 'easy',
     '[{"amount": "2", "unit": "cups", "item": "broccoli florets"}, {"amount": "1", "unit": "", "item": "bell pepper, sliced"}, {"amount": "1", "unit": "cup", "item": "snap peas"}, {"amount": "2", "unit": "tbsp", "item": "soy sauce"}, {"amount": "1", "unit": "tbsp", "item": "sesame oil"}, {"amount": "2", "unit": "cups", "item": "cooked rice"}]'::jsonb,
     '1. Heat oil in wok\n2. Add vegetables and stir fry 5-7 min\n3. Add soy sauce\n4. Serve over rice',
     'Asian', ARRAY['dinner', 'lunch'], ARRAY['vegetarian'], ARRAY['healthy', 'quick'], 5, NULL, 4, v_member2_id),
    (v_recipe_pancakes, v_family_id, 'Fluffy Pancakes', 'Weekend morning pancakes', 10, 15, 4, 'easy',
     '[{"amount": "2", "unit": "cups", "item": "flour"}, {"amount": "2", "unit": "tbsp", "item": "sugar"}, {"amount": "2", "unit": "tsp", "item": "baking powder"}, {"amount": "2", "unit": "", "item": "eggs"}, {"amount": "1.5", "unit": "cups", "item": "milk"}, {"amount": "3", "unit": "tbsp", "item": "melted butter"}]'::jsonb,
     '1. Mix dry ingredients\n2. Mix wet ingredients\n3. Combine and stir until just mixed\n4. Cook on griddle until bubbles form, flip',
     NULL, ARRAY['breakfast'], NULL, ARRAY['weekend', 'kid-favorite'], 20, '2025-12-22', 5, v_owner_id),
    (v_recipe_salad, v_family_id, 'Greek Salad', 'Fresh Mediterranean salad', 15, 0, 4, 'easy',
     '[{"amount": "1", "unit": "head", "item": "romaine lettuce"}, {"amount": "1", "unit": "cup", "item": "cherry tomatoes"}, {"amount": "1", "unit": "", "item": "cucumber, diced"}, {"amount": "0.5", "unit": "cup", "item": "feta cheese"}, {"amount": "0.25", "unit": "cup", "item": "kalamata olives"}, {"amount": "", "unit": "", "item": "olive oil and lemon dressing"}]'::jsonb,
     '1. Chop vegetables\n2. Combine in bowl\n3. Add feta and olives\n4. Dress and serve',
     'Mediterranean', ARRAY['lunch', 'dinner'], ARRAY['vegetarian', 'gluten-free'], ARRAY['healthy', 'fresh'], 6, NULL, 4, v_member2_id),
    (v_recipe_grilled_cheese, v_family_id, 'Grilled Cheese Sandwiches', 'Classic comfort food for quick lunches', 5, 10, 4, 'easy',
     '[{"amount": "8", "unit": "slices", "item": "bread"}, {"amount": "8", "unit": "slices", "item": "cheddar cheese"}, {"amount": "4", "unit": "tbsp", "item": "butter"}]'::jsonb,
     '1. Butter one side of each bread slice\n2. Place cheese between unbuttered sides\n3. Grill until golden and cheese melts',
     NULL, ARRAY['lunch'], NULL, ARRAY['quick', 'kid-favorite', 'comfort-food'], 25, NULL, 5, v_member2_id);

    -- ========================================
    -- 14. CREATE MEALS (next 7 days)
    -- ========================================
    INSERT INTO meals (family_id, meal_date, meal_type, recipe_id, title, notes, assigned_to_id) VALUES
    -- Dec 27
    (v_family_id, '2025-12-27', 'breakfast', NULL, 'Cereal and fruit', NULL, v_member2_id),
    (v_family_id, '2025-12-27', 'lunch', v_recipe_grilled_cheese, NULL, NULL, v_member2_id),
    (v_family_id, '2025-12-27', 'dinner', v_recipe_tacos, NULL, NULL, v_member2_id),
    -- Dec 28
    (v_family_id, '2025-12-28', 'breakfast', v_recipe_pancakes, NULL, NULL, v_owner_id),
    (v_family_id, '2025-12-28', 'lunch', NULL, 'Leftovers', NULL, v_member2_id),
    (v_family_id, '2025-12-28', 'dinner', v_recipe_pasta, NULL, NULL, v_member2_id),
    -- Dec 29
    (v_family_id, '2025-12-29', 'breakfast', NULL, 'Eggs and toast', NULL, v_owner_id),
    (v_family_id, '2025-12-29', 'lunch', v_recipe_salad, NULL, NULL, v_member2_id),
    (v_family_id, '2025-12-29', 'dinner', v_recipe_stirfry, NULL, NULL, v_member2_id),
    -- Dec 30
    (v_family_id, '2025-12-30', 'dinner', NULL, 'Pizza night (order in)', 'Busy with NYE prep!', NULL),
    -- Dec 31
    (v_family_id, '2025-12-31', 'dinner', NULL, 'NYE Party Food', 'Appetizers and finger foods for the party', NULL),
    -- Jan 1
    (v_family_id, '2026-01-01', 'breakfast', NULL, 'New Year brunch', 'Late brunch after staying up!', NULL),
    (v_family_id, '2026-01-01', 'dinner', NULL, 'Leftover party food', NULL, NULL),
    -- Jan 2
    (v_family_id, '2026-01-02', 'dinner', v_recipe_tacos, NULL, NULL, v_member2_id);

    -- ========================================
    -- 15. CREATE FAMILY EVENTS
    -- ========================================
    INSERT INTO family_events (family_id, title, description, location, start_time, end_time, is_all_day, timezone, is_recurring, recurrence_rule, assigned_to, icon, color, created_by) VALUES
    -- Today
    (v_family_id, 'Walk Buddy at the park', NULL, NULL, '2025-12-27 16:00:00-08', '2025-12-27 17:00:00-08', false, 'America/Los_Angeles', false, NULL, NULL, '🐕', NULL, v_owner_id),
    -- Tomorrow
    (v_family_id, 'Family game night', NULL, NULL, '2025-12-28 19:00:00-08', '2025-12-28 21:00:00-08', false, 'America/Los_Angeles', false, NULL, NULL, '🎲', NULL, v_member2_id),
    -- Dec 29
    (v_family_id, 'Lunch with Grandma Jane & Grandpa Bob', NULL, 'Pasta Palace', '2025-12-29 12:00:00-08', '2025-12-29 14:00:00-08', false, 'America/Los_Angeles', false, NULL, NULL, '👵', NULL, v_owner_id),
    -- Dec 30
    (v_family_id, 'NYE Party Prep', 'Decorate and prepare food', NULL, '2025-12-30 14:00:00-08', '2025-12-30 18:00:00-08', false, 'America/Los_Angeles', false, NULL, NULL, '🎊', NULL, v_member2_id),
    -- Dec 31 - NYE
    (v_family_id, 'New Year''s Eve Party!', 'Annual NYE celebration with friends and family', NULL, '2025-12-31 18:00:00-08', '2026-01-01 01:00:00-08', false, 'America/Los_Angeles', false, NULL, NULL, '🎉', '#A855F7', v_member2_id),
    -- Jan 1
    (v_family_id, 'New Year''s Day', NULL, NULL, '2026-01-01 00:00:00-08', NULL, true, 'America/Los_Angeles', false, NULL, NULL, '🎆', NULL, v_member2_id),
    -- Jan 3
    (v_family_id, 'Plumber visit - bathroom leak', NULL, NULL, '2026-01-03 10:00:00-08', '2026-01-03 12:00:00-08', false, 'America/Los_Angeles', false, NULL, NULL, '🔧', NULL, v_owner_id),
    -- Jan 6
    (v_family_id, 'Kids back to school', NULL, NULL, '2026-01-06 00:00:00-08', NULL, true, 'America/Los_Angeles', false, NULL, NULL, '📚', NULL, v_member2_id),
    -- Weekly recurring
    (v_family_id, 'Family Meeting', 'Weekly family sync', NULL, '2025-12-28 18:00:00-08', '2025-12-28 19:00:00-08', false, 'America/Los_Angeles', true, 'FREQ=WEEKLY;BYDAY=SU', NULL, '👨‍👩‍👧‍👦', NULL, v_member2_id),
    -- Emma's soccer
    (v_family_id, 'Emma''s Soccer Practice', NULL, 'Golden Gate Soccer Fields', '2026-01-07 16:00:00-08', '2026-01-07 17:30:00-08', false, 'America/Los_Angeles', true, 'FREQ=WEEKLY;BYDAY=TU,TH', v_member3_id, '⚽', NULL, v_member2_id),
    -- Jake's basketball
    (v_family_id, 'Jake''s Basketball Practice', NULL, NULL, '2026-01-08 15:30:00-08', '2026-01-08 16:30:00-08', false, 'America/Los_Angeles', true, 'FREQ=WEEKLY;BYDAY=WE', v_member4_id, '🏀', NULL, v_member2_id),
    -- Sarah's yoga
    (v_family_id, 'Sarah''s Yoga Class', NULL, NULL, '2026-01-04 09:00:00-08', '2026-01-04 10:00:00-08', false, 'America/Los_Angeles', true, 'FREQ=WEEKLY;BYDAY=SA', v_member2_id, '🧘', NULL, v_member2_id),
    -- Appointments
    (v_family_id, 'Kids'' Dental Checkup', NULL, 'Smile Family Dentistry', '2026-01-15 14:00:00-08', '2026-01-15 15:30:00-08', false, 'America/Los_Angeles', false, NULL, NULL, '🦷', NULL, v_member2_id),
    (v_family_id, 'Buddy''s Vet Checkup', NULL, 'Happy Paws Vet Clinic', '2026-01-10 11:00:00-08', '2026-01-10 12:00:00-08', false, 'America/Los_Angeles', false, NULL, NULL, '🐕', NULL, v_member2_id);

    -- ========================================
    -- 16. CREATE MILESTONES
    -- ========================================
    INSERT INTO milestones (family_id, title, description, person_id, occurred_at, goal_id, created_by) VALUES
    (v_family_id, 'Completed first 5K run!', NULL, v_owner_id, '2025-11-15', v_goal_mike_run, v_owner_id),
    (v_family_id, 'Finished yoga teacher training application', NULL, v_member2_id, '2025-12-01', v_goal_sarah_yoga, v_member2_id),
    (v_family_id, 'Art piece selected for school gallery!', NULL, v_member3_id, '2025-12-10', v_goal_emma_art, v_member3_id),
    (v_family_id, 'Read 3rd chapter book of the year', NULL, v_member4_id, '2025-12-20', v_goal_jake_reading, v_member4_id),
    (v_family_id, 'Emergency fund reached $18,500!', 'Over halfway to our goal', v_owner_id, '2025-12-15', v_goal_emergency, v_owner_id),
    (v_family_id, 'Completed 30-day yoga streak', NULL, v_member2_id, '2025-12-27', NULL, v_member2_id);

    -- ========================================
    -- 17. CREATE MEETING NOTES
    -- ========================================
    INSERT INTO meeting_notes (family_id, meeting_date, notes, decisions, attendees, duration_minutes, created_by) VALUES
    (v_family_id, '2025-12-22',
     '## This Week\n- Christmas prep going well\n- Kids finished school for break\n- Buddy needs vet appointment scheduled\n\n## Celebrations\n- Emma''s art was selected for gallery!\n- Jake finished another chapter book\n- Sarah completed 30 days of yoga',
     '- NYE party confirmed for 12/31\n- Will visit grandparents on 12/29\n- Kids responsible for thank you cards by 1/2',
     ARRAY[v_owner_id, v_member2_id, v_member3_id, v_member4_id], 25, v_member2_id),
    (v_family_id, '2025-12-15',
     '## This Week\n- Holiday shopping almost done\n- School winter concert was great\n- Emergency fund milestone reached!\n\n## Upcoming\n- Christmas Eve plans\n- NYE party planning',
     '- Mike handling tree setup\n- Sarah coordinating NYE food\n- Kids helping with decorations',
     ARRAY[v_owner_id, v_member2_id, v_member3_id, v_member4_id], 30, v_member2_id),
    (v_family_id, '2025-12-08',
     '## This Week\n- Kids'' activities winding down for break\n- Holiday cards sent out\n- Started Hawaii trip research\n\n## Discussion\n- Summer vacation options\n- Spring semester activities',
     '- Will do Hawaii for summer 2026\n- Emma continuing soccer in spring\n- Jake wants to try basketball',
     ARRAY[v_owner_id, v_member2_id, v_member3_id, v_member4_id], 35, v_owner_id);

    RAISE NOTICE '';
    RAISE NOTICE '✅ Database seeding complete!';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Created:';
    RAISE NOTICE '   - 1 family (The Johnson Family)';
    RAISE NOTICE '   - 4 family members (Mike, Sarah, Emma, Jake)';
    RAISE NOTICE '   - 8 places';
    RAISE NOTICE '   - 8 contacts';
    RAISE NOTICE '   - 6 vendors';
    RAISE NOTICE '   - 11 goals';
    RAISE NOTICE '   - 11 habits with logs';
    RAISE NOTICE '   - 5 projects';
    RAISE NOTICE '   - 6 someday items';
    RAISE NOTICE '   - 25+ tasks with subtasks';
    RAISE NOTICE '   - 6 recipes';
    RAISE NOTICE '   - 14 meal plans';
    RAISE NOTICE '   - 14 calendar events';
    RAISE NOTICE '   - 6 milestones';
    RAISE NOTICE '   - 3 meeting notes';
END $$;
