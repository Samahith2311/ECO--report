-- EcoReport sample data: 20 complaints around Mysuru, Karnataka.
-- Run ONCE, after the migration (SQL Editor, or `supabase db reset`).
-- Names and contacts are fictional. Coordinates are approximate locality centres.
-- Dates are relative to today (oldest 88 days ago, newest 3 days ago), so the
-- "last 3 months" trend chart always looks alive.

begin;

-- The status_history trigger would stamp every row with "now". We switch it off
-- here and write a realistic history by hand further down.
alter table public.complaints disable trigger complaints_log_status_change;

-- ---------------------------------------------------------------------------
-- Complaints. Column d = days ago the complaint was filed.
-- res_days = days from filing to "resolved" (only for resolved ones).
-- ---------------------------------------------------------------------------
insert into public.complaints (
  tracking_id, complaint_type, description, location_text, latitude, longitude,
  complaint_date, status, reporter_name, reporter_contact, created_at, updated_at
)
select
  'ECO-' || to_char(current_date - v.d, 'YYYY') || '-' || lpad(v.n::text, 4, '0'),
  v.t::public.complaint_type_enum,
  v.descr, v.loc, v.lat, v.lng,
  current_date - v.d,
  v.st::public.complaint_status_enum,
  v.rname, v.rcontact,
  (current_date - v.d)::timestamp + interval '10 hours 30 minutes',
  (current_date - v.d)::timestamp + interval '10 hours 30 minutes' + case v.st
    when 'submitted'    then interval '0 days'
    when 'under_review' then interval '2 days'
    when 'action_taken' then interval '6 days'
    when 'rejected'     then interval '5 days'
    when 'resolved'     then make_interval(days => v.res_days)
  end
from (values
  (1,  'illegal_dumping', 'Heaps of construction debris and household waste dumped on the lake bund road. Foul smell and stray animals gather every day.', 'Kukkarahalli Lake bund road, near Manasagangotri', 12.3092, 76.6335, 88, 'resolved',     'Anitha Rao',     'anitha.rao@example.com',     14),
  (2,  'water_pollution', 'Untreated sewage is entering the lake through an open drain. The water has turned dark green and fish are dying.',             'Lingambudhi Lake, Bogadi Road side',               12.2895, 76.6190, 84, 'resolved',     'Mahesh Gowda',   '+91 90000 00002',             9),
  (3,  'noise',           'Loudspeakers at a function hall run past 11 PM every weekend, disturbing residents and students preparing for exams.',        'Vijayanagar 2nd Stage, near the water tank',       12.3345, 76.6120, 80, 'resolved',     'Prakash N',      'prakash.n@example.com',      11),
  (4,  'air_pollution',   'Thick black smoke from burning plastic and old tyres in an open plot every evening.',                                         'Hebbal Industrial Area, 1st Stage',                12.3560, 76.6180, 77, 'resolved',     'Divya S',        '+91 90000 00004',            18),
  (5,  'deforestation',   'Several mature trees were felled along the road widening stretch without any visible permission board.',                     'Chamundi Hill road, near the foothills',           12.2810, 76.6720, 73, 'action_taken', 'Suresh Kumar',   'suresh.kumar@example.com',   null),
  (6,  'illegal_dumping', 'Meat and vegetable waste is dumped in the open drain behind the market, attracting rats and flies.',                         'Devaraja Market, rear lane',                       12.3055, 76.6558, 70, 'resolved',     'Fathima Begum',  '+91 90000 00006',             8),
  (7,  'water_pollution', 'Oily effluent from a vehicle service shop flows into the stormwater drain after every wash.',                                'Nazarbad Main Road',                               12.3010, 76.6490, 66, 'action_taken', 'Ramesh B',       'ramesh.b@example.com',       null),
  (8,  'noise',           'Generator and machinery noise from a workshop continues through the night.',                                                  'Metagalli Industrial Area',                        12.3470, 76.5960, 62, 'rejected',     'Kavitha M',      '+91 90000 00008',            null),
  (9,  'air_pollution',   'Fine dust from a stone crusher unit settles on houses and crops. Residents report coughing and eye irritation.',              'Hootagalli, near Outer Ring Road',                 12.3580, 76.5880, 58, 'action_taken', 'Basavaraj H',    'basavaraj.h@example.com',    null),
  (10, 'other',           'Unlabelled chemical drums are leaking an unknown liquid in the goods yard, close to a footpath.',                             'Railway goods yard, near Mysuru Junction',         12.3115, 76.6460, 54, 'under_review', 'Imran Pasha',    '+91 90000 00010',            null),
  (11, 'illegal_dumping', 'Used syringes and bandages were found dumped near the school gate. Children walk through this lane.',                        'Jayalakshmipuram, near the government school',     12.3170, 76.6270, 50, 'action_taken', 'Lakshmi Devi',   'lakshmi.devi@example.com',   null),
  (12, 'water_pollution', 'Borewell water has turned yellowish with a chemical smell since a nearby dyeing unit started operating.',                    'Srirampura 2nd Stage',                             12.3410, 76.6250, 45, 'under_review', 'Naveen Kumar',   '+91 90000 00012',            null),
  (13, 'air_pollution',   'Garbage is burnt every morning behind the grounds. Elderly residents have breathing trouble.',                                'Bannimantap, behind the grounds',                  12.3260, 76.6720, 40, 'resolved',     'Rekha Prasad',   'rekha.prasad@example.com',   21),
  (14, 'deforestation',   'Trees are being cut and the lake buffer zone is being levelled for plotting.',                                                'Karanji Lake surroundings',                        12.3020, 76.6720, 34, 'under_review', 'Girish A',       '+91 90000 00014',            null),
  (15, 'noise',           'Pile driving at a construction site starts at 6 AM, outside the permitted working hours.',                                    'Gokulam 3rd Stage',                                12.3360, 76.6340, 30, 'action_taken', 'Sunitha R',      'sunitha.r@example.com',      null),
  (16, 'illegal_dumping', 'Garbage trucks unload mixed waste in a vacant plot. It now overflows onto the road.',                                         'Kesare Main Road',                                 12.2950, 76.6600, 25, 'resolved',     'Harish Chandra', '+91 90000 00016',            10),
  (17, 'other',           'Banned plastic carry bags are sold openly at the market entrance.',                                                           'Devaraja Market, main entrance',                   12.3050, 76.6540, 18, 'submitted',    'Zainab K',       'zainab.k@example.com',       null),
  (18, 'water_pollution', 'Sewage from an overflowing manhole is mixing with the drinking water pipeline in the lane.',                                  'Siddarthanagar, 2nd Cross',                        12.3000, 76.6230, 12, 'submitted',    'Vinay Kumar',    '+91 90000 00018',            null),
  (19, 'air_pollution',   'Smoke from the same garbage burning spot near the grounds. Reported again because it continues.',                             'Bannimantap, behind the grounds',                  12.3262, 76.6718,  9, 'rejected',     'Rekha Prasad',   'rekha.prasad@example.com',   null),
  (20, 'noise',           'Loud DJ music at a banquet hall past midnight, close to a hospital.',                                                         'Yadavagiri, near the hospital',                    12.3280, 76.6260,  3, 'submitted',    'Deepak Shetty',  '+91 90000 00020',            null)
) as v(n, t, descr, loc, lat, lng, d, st, rname, rcontact, res_days);

-- Next real complaint gets ECO-<year>-0021.
select setval('public.complaint_seq', 20);

-- ---------------------------------------------------------------------------
-- Status history: every complaint starts as "submitted"; later steps follow
-- the same offsets used for updated_at above.
-- ---------------------------------------------------------------------------
insert into public.status_history (complaint_id, old_status, new_status, changed_at)
select id, null, 'submitted', created_at from public.complaints;

insert into public.status_history (complaint_id, old_status, new_status, changed_at)
select id, 'submitted', 'under_review', created_at + interval '2 days'
from public.complaints where status in ('under_review', 'action_taken', 'resolved', 'rejected');

insert into public.status_history (complaint_id, old_status, new_status, changed_at)
select id, 'under_review', 'action_taken', created_at + interval '6 days'
from public.complaints where status in ('action_taken', 'resolved');

insert into public.status_history (complaint_id, old_status, new_status, changed_at)
select id, 'action_taken', 'resolved', updated_at
from public.complaints where status = 'resolved';

insert into public.status_history (complaint_id, old_status, new_status, changed_at)
select id, 'under_review', 'rejected', created_at + interval '5 days'
from public.complaints where status = 'rejected';

-- ---------------------------------------------------------------------------
-- Interventions for the action_taken / resolved complaints (n = complaint number,
-- off = days after the complaint date).
-- ---------------------------------------------------------------------------
insert into public.interventions (complaint_id, action_taken, department, intervention_date, remarks)
select c.id, v.action, v.dept, c.complaint_date + v.off, v.remarks
from (values
  (1,  'Debris cleared with JCB and tippers. Fencing and No Dumping boards installed.',                             'Mysuru City Corporation - Solid Waste',      6, 'Site rechecked after 3 days, no fresh dumping.'),
  (2,  'Open drain diverted to the sewer line. Water samples collected for testing.',                               'Mysuru City Corporation - Drainage',         4, 'Lab report awaited.'),
  (2,  'Follow-up sampling shows oxygen levels recovering. Fish deaths have stopped.',                              'KSPCB Regional Office, Mysuru',              8, 'Closed after two clean samples.'),
  (3,  'Notice issued to the hall owner. Loudspeaker use restricted after 10 PM.',                                  'Mysuru City Police',                         3, 'Patrol visited the next two weekends, no violation.'),
  (4,  'Burning stopped and a fine levied on the plot owner. Waste lifted.',                                        'KSPCB Regional Office, Mysuru',              5, null),
  (4,  'Plot fenced and regular waste lifting arranged.',                                                           'Mysuru City Corporation - Solid Waste',      8, 'No further burning reported.'),
  (5,  'Spot inspection done. Show-cause notice served to the contractor for felling without permission.',          'Forest Department, Mysuru Division',         7, 'Contractor reply under review.'),
  (6,  'Daily lifting of market waste scheduled. Rear lane cleaned and drain desilted.',                            'Mysuru City Corporation - Health Section',   5, 'Supervisor assigned for the lane.'),
  (7,  'Notice issued to the shop to install an oil-water separator within 15 days.',                               'KSPCB Regional Office, Mysuru',              7, 'Compliance check due next month.'),
  (9,  'Unit inspected. Water sprinklers and dust covers made mandatory; closure notice issued for non-compliance.', 'KSPCB Regional Office, Mysuru',              8, 'Re-inspection scheduled.'),
  (11, 'Biomedical waste collected by an authorised agency. Source clinic identified and warned.',                  'Mysuru City Corporation - Health Section',   5, 'Warning letter on file.'),
  (13, 'Open burning stopped and a penalty imposed. Residents told about door-to-door waste pickup.',               'Mysuru City Corporation - Solid Waste',      9, 'Spot visited twice, no burning seen.'),
  (15, 'Contractor told to stop work before 8 AM. Compliance monitoring started.',                                  'Mysuru City Police',                         6, 'Monitoring for 30 days.'),
  (16, 'Plot cleaned and fenced. Truck contractor penalised.',                                                      'Mysuru City Corporation - Solid Waste',      4, 'Trucks now routed to the processing yard.')
) as v(n, action, dept, off, remarks)
join public.complaints c on right(c.tracking_id, 4) = lpad(v.n::text, 4, '0');

alter table public.complaints enable trigger complaints_log_status_change;

commit;
