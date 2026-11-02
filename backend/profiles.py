PROFILES = {
    "Chettinad Spice Court": {
        "cuisines": ["Chettinad", "South Indian", "Seafood"],
        "area": "Nungambakkam, Chennai",
        "phone": "+91 44 2822 4455",
        "cost_for_two": 950,
        "opens_at": "11:30",
        "closes_at": "23:00",
        "rating": 4.4,
        "rating_count": 1240,
        "known_for": ["Pepper chicken", "Chettinad gravy", "Filter coffee"],
        "amenities": [
            "Parking",
            "Wifi",
            "Wheelchair access",
            "High chair",
            "Air conditioning",
            "Family seating",
        ],
    },
    "Koli Kadai House": {
        "cuisines": ["Chicken", "Street Food", "Biryani"],
        "area": "T. Nagar, Chennai",
        "phone": "+91 44 2432 1188",
        "cost_for_two": 700,
        "opens_at": "12:00",
        "closes_at": "23:30",
        "rating": 4.2,
        "rating_count": 2310,
        "known_for": ["Koli chicken", "Crunchy fried chicken", "Kerala parotta"],
        "amenities": [
            "Parking",
            "Takeaway",
            "Family seating",
            "Air conditioning",
            "Late night",
        ],
    },
    "Anjappar Express": {
        "cuisines": ["Chettinad", "South Indian", "Vegetarian"],
        "area": "Egmore, Chennai",
        "phone": "+91 44 2855 1900",
        "cost_for_two": 800,
        "opens_at": "06:30",
        "closes_at": "22:30",
        "rating": 4.1,
        "rating_count": 3050,
        "known_for": ["Chettinad dosa", "Idiyappam", "Mutton gravy"],
        "amenities": [
            "Parking",
            "Wifi",
            "High chair",
            "Family seating",
            "Breakfast",
        ],
    },
    "Madras Grill Room": {
        "cuisines": ["North Indian", "Continental", "Grill"],
        "area": "Alwarpet, Chennai",
        "phone": "+91 44 4998 6600",
        "cost_for_two": 1600,
        "opens_at": "12:00",
        "closes_at": "23:00",
        "rating": 4.5,
        "rating_count": 890,
        "known_for": ["Tandoori platter", "Grilled fish", "Live grill counter"],
        "amenities": [
            "Parking",
            "Wifi",
            "Bar",
            "Valet parking",
            "Live music",
            "Air conditioning",
        ],
    },
    "T Nagar Tandoor": {
        "cuisines": ["Mughlai", "Tandoor", "Biryani"],
        "area": "T. Nagar, Chennai",
        "phone": "+91 44 2498 7700",
        "cost_for_two": 1100,
        "opens_at": "11:00",
        "closes_at": "23:00",
        "rating": 4.3,
        "rating_count": 1675,
        "known_for": ["Butter chicken", "Tandoori roti", "Dum biryani"],
        "amenities": [
            "Parking",
            "Wifi",
            "Bar",
            "Family seating",
            "Air conditioning",
            "Home delivery",
        ],
    },
}

REVIEWS = {
    "Chettinad Spice Court": [
        ("Priya S.", 5, "The pepper chicken is unreal — proper Chettinad heat, not toned down for tourists. Rooftop seating on a weekend evening is perfect.", "2026-10-24T19:32:00"),
        ("Rahul M.", 4, "Took my parents here for dinner. Service was warm and the mutton chukka disappeared in minutes. Slightly loud on Saturdays.", "2026-10-18T21:05:00"),
        ("Meera K.", 4, "Filter coffee after a Chettinad meal is a must here. Ground floor fills up fast at lunch — book a table the night before.", "2026-10-09T13:40:00"),
        ("Karthik D.", 5, "Second visit this month. The crab masala and parotta combo is worth every rupee. Rooftop has a nice breeze.", "2026-09-28T20:15:00"),
    ],
    "Koli Kadai House": [
        ("Ananya R.", 5, "Best fried chicken in T. Nagar, hands down. The koli chicken with kerala parotta is a deadly combination.", "2026-10-26T14:20:00"),
        ("Vikram N.", 4, "Quick, spicy, no-nonsense. Great for a late dinner after a movie — they shut at 11:30 which saves us every time.", "2026-10-15T22:48:00"),
        ("Divya P.", 4, "Biryani portion sizes are generous. Ask for extra gravy on the side. Parking can be tricky on weekdays.", "2026-10-02T20:30:00"),
    ],
    "Anjappar Express": [
        ("Suresh B.", 4, "Classic Chettinad fast service. The ghee roast dosa in the morning is my weekly ritual now.", "2026-10-25T08:15:00"),
        ("Lakshmi V.", 5, "Idiyappam with mutton gravy — exactly how my grandmother made it. Clean, quick, family-friendly.", "2026-10-17T12:50:00"),
        ("Arun T.", 3, "Food is great but it gets crowded at breakfast. Good thing Tablu lets you grab a table in advance.", "2026-10-05T09:35:00"),
        ("Nithya R.", 4, "Vegetarian options are genuinely good, not an afterthought. The Chettinad veg thali is a steal at this price.", "2026-09-22T13:10:00"),
    ],
    "Madras Grill Room": [
        ("Faizal H.", 5, "The live grill counter is the show. Ordered the tandoori platter for four — every item came out perfectly charred.", "2026-10-23T20:40:00"),
        ("Shreya M.", 5, "Best place in Alwarpet for a client dinner. Quiet corners, great wine list, grilled fish was outstanding.", "2026-10-14T21:25:00"),
        ("Gopal K.", 4, "Pricey but the quality matches. Weekend brunch with the jazz trio playing is a different vibe altogether.", "2026-10-01T12:55:00"),
    ],
    "T Nagar Tandoor": [
        ("Imran S.", 5, "Butter chicken here is the benchmark — silky gravy, smoky chicken. The dum biryani sells out by 9pm on Fridays.", "2026-10-25T21:10:00"),
        ("Bhavana L.", 4, "Solid family restaurant. High chairs available, staff patient with kids. Tandoori roti comes out hot every single time.", "2026-10-19T19:55:00"),
        ("Deepak R.", 4, "Ordered for a house party — 15 people, everything reached hot and on time. The seekh kebab is a must-try.", "2026-10-08T18:30:00"),
        ("Radhika A.", 4, "Good Mughlai spread near T. Nagar. Parking in the basement is a lifesaver on shopping days.", "2026-09-30T20:20:00"),
    ],
}

LIST_FIELDS = ("cuisines", "known_for", "amenities")


def profile_row(name):
    p = PROFILES.get(name)
    if p is None:
        return None
    return (
        ",".join(p["cuisines"]),
        p["area"],
        p["phone"],
        p["cost_for_two"],
        p["opens_at"],
        p["closes_at"],
        p["rating"],
        p["rating_count"],
        ",".join(p["known_for"]),
        ",".join(p["amenities"]),
    )


def profile_dict(row):
    out = dict(row)
    for field in LIST_FIELDS:
        value = out.get(field)
        out[field] = [v for v in value.split(",") if v] if value else []
    return out
