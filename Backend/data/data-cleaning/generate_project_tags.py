import json
from openai import OpenAI

client = OpenAI(api_key="Your Key Here")


def get_json_data(file_path: str):
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)   

def generate_tag(project_details: str) -> str:
    if not project_details.strip():
        return ""

    response = client.responses.create(
        model="gpt-5-nano",
        input=(
            "Create a concise expertise tag (max three words) for the following project: "
            + project_details
            + ". Respond with ONLY the tag. If you cannot create one, respond with an empty string."
        ),
        store=True,
    )

    return response.output_text.strip()

def gen_projects_multi_inst(data):
    institutions = data.get("institutions")

    # Normalize to list
    if isinstance(institutions, dict):
        institutions = [institutions]

    if not institutions:
        return

    for inst in institutions:
        for dept in inst.get("departments", []):
            for person, pdata in dept.get("people", {}).items():
                for proj in pdata.get("projects", []):
                    
                    # Add tag only if missing
                    if "tag_name" in proj and proj["tag_name"]:
                        continue

                    title = proj.get("project_title") or ""
                    desc = proj.get("project_description") or ""
                    project_details = f"{title} {desc}".strip()

                    tag = generate_tag(project_details)
                    proj["tag_name"] = tag


def gen_projects_one_inst(data):
    departments = data.get("departments", {})

    for dept_name, dept_data in departments.items():
        people = dept_data.get("people", {})

        for person_name, person_data in people.items():
            for project in person_data.get("projects", []):

                # Correct tag existence check
                if "tag_name" in project and project["tag_name"]:
                    continue

                title = project.get("project_title") or ""
                desc = project.get("project_description") or ""
                project_details = f"{title} {desc}".strip()

                tag = generate_tag(project_details)
                project["tag_name"] = tag


if __name__ == "__main__":

    # ONE institution
    single_inst_files = [
        "../processed/post_cleaning_usm_data.json",
    ]

    for path in single_inst_files:
        data = get_json_data(path)
        gen_projects_one_inst(data)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4)

    # MULTIPLE institutions
    multi_inst_files = [
        "../processed/nih_maine_data_formatted.json",
        "../processed/nih_projects_formatted.json",
    ]

    for path in multi_inst_files:
        data = get_json_data(path)
        gen_projects_multi_inst(data)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4)