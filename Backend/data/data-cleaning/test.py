import json

def normalize_expertise_fields(path: str):
    # Load JSON
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    for dept_name, dept in data.get("departments", {}).items():
        for person_name, person in dept.get("people", {}).items():

            # Normalize main_field
            if "main_field" in person:
                val = person["main_field"]
                if isinstance(val, list) and val:
                    person["main_field"] = val[0]

            # Normalize expertise_1 .. expertise_10 (safe upper bound)
            for i in range(1, 11):
                key = f"expertise_{i}"
                if key in person:
                    val = person[key]

                    # If it's a list, take the first item
                    if isinstance(val, list):
                        person[key] = val[0] if val else None

    # Save updated JSON
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

    print("All expertise fields normalized: only first value kept for lists.")

normalize_expertise_fields("../processed/post_cleaning_usm_data.json")