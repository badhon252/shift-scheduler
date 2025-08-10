-- Seed some sample shifts for existing members (current month)
-- This will create a variety of shifts to demonstrate the color coding

DO $$
DECLARE
    member_record RECORD;
    current_month_start DATE;
    current_month_end DATE;
    day_counter DATE;
    shift_types TEXT[] := ARRAY[
        'Morning Shift (07:00 - 03:00 PM)',
        'Evening Shift (02:50 - 11:00 PM)', 
        'Night Shift (10:30 - 07:00 AM)',
        'Offday',
        'Leave'
    ];
    random_shift TEXT;
BEGIN
    -- Get current month boundaries
    current_month_start := DATE_TRUNC('month', CURRENT_DATE);
    current_month_end := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;
    
    -- Loop through each member
    FOR member_record IN SELECT id, name FROM public.members LOOP
        -- Create shifts for each day of the current month
        day_counter := current_month_start;
        
        WHILE day_counter <= current_month_end LOOP
            -- Skip some days randomly to create variety (about 20% will be unassigned)
            IF RANDOM() > 0.2 THEN
                -- Pick a random shift type
                random_shift := shift_types[1 + FLOOR(RANDOM() * array_length(shift_types, 1))];
                
                -- Insert the shift (ignore conflicts)
                INSERT INTO public.shifts (member_id, date, shift_type)
                VALUES (member_record.id, day_counter, random_shift)
                ON CONFLICT (member_id, date) DO NOTHING;
            END IF;
            
            day_counter := day_counter + INTERVAL '1 day';
        END LOOP;
        
        RAISE NOTICE 'Created shifts for member: %', member_record.name;
    END LOOP;
END $$;

-- Also create some shifts for next month to show navigation
DO $$
DECLARE
    member_record RECORD;
    next_month_start DATE;
    next_month_end DATE;
    day_counter DATE;
    shift_types TEXT[] := ARRAY[
        'Morning Shift (07:00 - 03:00 PM)',
        'Evening Shift (02:50 - 11:00 PM)', 
        'Night Shift (10:30 - 07:00 AM)',
        'Offday',
        'Leave'
    ];
    random_shift TEXT;
BEGIN
    -- Get next month boundaries
    next_month_start := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month')::DATE;
    next_month_end := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '2 months - 1 day')::DATE;
    
    -- Loop through first 3 members only for next month
    FOR member_record IN SELECT id, name FROM public.members LIMIT 3 LOOP
        day_counter := next_month_start;
        
        WHILE day_counter <= next_month_end LOOP
            IF RANDOM() > 0.3 THEN
                random_shift := shift_types[1 + FLOOR(RANDOM() * array_length(shift_types, 1))];
                
                INSERT INTO public.shifts (member_id, date, shift_type)
                VALUES (member_record.id, day_counter, random_shift)
                ON CONFLICT (member_id, date) DO NOTHING;
            END IF;
            
            day_counter := day_counter + INTERVAL '1 day';
        END LOOP;
    END LOOP;
END $$;
