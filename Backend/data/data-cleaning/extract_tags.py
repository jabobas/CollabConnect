import json
from pathlib import Path
from typing import Any, Dict, List, Set

def extract_all_tags(raw: Any) -> Dict[str, List[str]]:
    """
    Extracts all unique project tags from a cleaned NIH dataset.

    Accepts raw data shaped like:
    - list of institutions
    - dict with institutions/projects
    - nested project lists inside institutions

    Returns a dict:
    {
        "all_tags": [ ... sorted unique tags ... ]
    }
    """

    tags: Set[str] = set()

    def process_projects(project_list):
        if not isinstance(project_list, list):
            return
        for pj in project_list:
            tag_list = pj.get("tags") or pj.get("project_tags") or []
            if isinstance(tag_list, list):
                for t in tag_list:
                    if isinstance(t, str) and t.strip():
                        tags.add(t.strip())

    # Case 1: raw is a direct list of institutions
    if isinstance(raw, list):
        for inst in raw:
            # look for projects at institution level
            process_projects(inst.get("projects") or inst.get("Projects") or [])

            # also look inside departments → people → projects
            for dept in inst.get("departments", []):
                for person in dept.get("people", []):
                    process_projects(person.get("projects", []))

    # Case 2: raw is a dict
    elif isinstance(raw, dict):

        # top-level projects
        process_projects(raw.get("projects") or raw.get("Projects") or [])

        # institution lists
        for key in ("institutions", "Institutions", "Institution", "items", "data"):
            if key in raw and isinstance(raw[key], list):
                for inst in raw[key]:

                    # projects inside institution
                    process_projects(inst.get("projects") or inst.get("Projects") or [])

                    # nested dept/people structure
                    for dept in inst.get("departments", []):
                        for person in dept.get("people", []):
                            process_projects(person.get("projects", []))

    # Final output
    return {
        "all_tags": sorted(tags)
    }


def generate_tags_file(in_path: str, out_path: str):
    """
    Reads the raw cleaning output JSON and writes a JSON file containing all tags.
    """
    p_in = Path(in_path)
    p_out = Path(out_path)

    raw = json.loads(p_in.read_text())
    tag_output = extract_all_tags(raw)

    p_out.write_text(json.dumps(tag_output, indent=4))
    print(f"Saved all project tags to {p_out.resolve()}")


if __name__ == "__main__":
    IN = "../processed/post_cleaning_nih_maine_data.json"
    OUT = "../processed/all_project_tags.json"

    generate_tags_file(IN, OUT)
