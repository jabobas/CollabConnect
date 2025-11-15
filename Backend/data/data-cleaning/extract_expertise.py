#!/usr/bin/env python3
"""
Extract expertise from person bios using a lightweight LLM and populate expertise fields.

This script reads the roux_institute_data.json file, uses a lightweight LLM to extract
three expertise keywords from each person's bio, and populates the expertise_1, 
expertise_2, and expertise_3 fields.

Uses Hugging Face's transformers library with a small model suitable for text generation.

Author: Wyatt McCurdy
Date: November 13, 2025
"""

import json
from pathlib import Path
from typing import List, Dict, Optional
import warnings
warnings.filterwarnings('ignore')

try:
    from transformers import pipeline
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False
    print("⚠ transformers not available. Install with: pip install transformers torch")
    exit(1)


class ExpertiseExtractor:
    """Extract expertise using hybrid LLM + rule-based approach."""
    
    def __init__(self):
        """Initialize the LLM pipeline."""
        self.pipe = None
        # Extended technical term database
        self.technical_domains = self._build_technical_domains()
        
    def _build_technical_domains(self) -> set:
        """Build comprehensive set of technical terms to match."""
        return {
            # AI/ML
            'Machine Learning', 'Deep Learning', 'Artificial Intelligence', 
            'Neural Networks', 'Computer Vision', 'Natural Language Processing', 
            'NLP', 'Reinforcement Learning', 'Transfer Learning',
            # Data Science
            'Data Science', 'Data Analysis', 'Data Analytics', 'Data Visualization',
            'Data Mining', 'Data Engineering', 'Big Data', 'Business Intelligence',
            # Statistics
            'Statistical Modeling', 'Statistics', 'Quantitative Methods', 
            'Biostatistics', 'Predictive Modeling', 'Statistical Analysis',
            'Bayesian Statistics', 'Time Series Analysis',
            # Software/Computing
            'Software Engineering', 'Software Development', 'Web Development',
            'Cloud Computing', 'DevOps', 'Cybersecurity', 'Information Security',
            'Database Systems', 'Distributed Systems', 'System Architecture',
            # Biology/Health
            'Bioinformatics', 'Computational Biology', 'Genomics', 'Proteomics',
            'Biotechnology', 'Molecular Biology', 'Cell Biology', 'Biochemistry',
            'Protein Engineering', 'Drug Discovery', 'Pharmaceutical Sciences',
            'Synthetic Biology', 'Systems Biology',
            # Healthcare
            'Healthcare Analytics', 'Health Informatics', 'Clinical Research',
            'Epidemiology', 'Public Health', 'Population Health', 
            'Biomedical Engineering', 'Medical Imaging', 'Health Data Science',
            'Electronic Health Records', 'Clinical Trials',
            # Networks/Systems
            'Network Science', 'Graph Theory', 'Complex Systems',
            'Social Networks', 'Network Analysis',
            # Math/Engineering
            'Optimization', 'Operations Research', 'Mathematical Modeling',
            'Signal Processing', 'Image Processing', 'Computer Graphics',
            'Simulation', 'Numerical Methods',
            # Robotics/Control
            'Robotics', 'Autonomous Systems', 'Control Systems',
            'Mechatronics', 'Sensor Systems',
            # Design/UX
            'Human-Computer Interaction', 'User Experience', 'UX Design',
            'User Research', 'Interaction Design', 'Information Architecture',
            # Business/Management
            'Project Management', 'Product Management', 'Business Analytics',
            'Strategic Planning', 'Organizational Development',
            # Finance/Economics
            'Financial Modeling', 'Economics', 'Econometrics',
            'Quantitative Finance', 'Risk Analysis',
            # Education
            'Education Technology', 'Learning Analytics', 'Instructional Design',
            'Curriculum Development', 'Educational Assessment',
            # Marketing/Digital
            'Digital Marketing', 'Social Media Analytics', 'Web Analytics',
            'Marketing Analytics', 'Customer Analytics',
            # Domain-specific
            'Geographic Information Systems', 'GIS', 'Remote Sensing',
            'Climate Modeling', 'Environmental Science', 'Sustainability'
        }
        
    def initialize(self):
        """Load the model (lazy initialization)."""
        if self.pipe is None:
            print("Initializing LLM model (this may take a moment)...")
            print("Using: Flan-T5-Small (77M parameters, fast and lightweight)")
            try:
                # Use Flan-T5-Small - a lightweight but capable model
                # Good balance between size (~300MB) and performance
                self.pipe = pipeline(
                    "text2text-generation",
                    model="google/flan-t5-small",
                    max_length=50,
                    device=-1  # CPU
                )
                print("✓ Model loaded successfully\n")
            except Exception as e:
                print(f"✗ Error loading model: {e}")
                raise
        return self.pipe
    
    def extract_expertise(self, bio: str, name: str = "", title: str = "") -> List[str]:
        """
        Extract three expertise keywords from a bio using hybrid approach.
        
        Args:
            bio: Person's biographical text
            name: Person's name (for logging)
            title: Person's job title (for context)
            
        Returns:
            List of 3 expertise keywords
        """
        if not bio:
            return [None, None, None]
        
        # First try: Extract technical terms from bio
        technical_terms = self._extract_technical_terms(bio, title)
        
        # If we found good technical terms, use them
        valid_terms = [t for t in technical_terms if t is not None]
        if len(valid_terms) >= 2:
            return technical_terms
        
        # Second try: Use LLM for more nuanced extraction
        try:
            # Ensure model is loaded
            pipe = self.initialize()
            
            # Construct the prompt
            prompt = self._create_prompt(bio, title)
            
            # Generate keywords
            result = pipe(prompt, max_length=60, do_sample=True, temperature=0.7)
            keywords_text = result[0]['generated_text']
            
            # Parse the output
            keywords = self._parse_keywords(keywords_text)
            
            # Validate quality - if we got good keywords from LLM, use them
            valid_keywords = [k for k in keywords if k is not None and len(k) > 3]
            if len(valid_keywords) >= 2:
                return keywords
                
        except Exception as e:
            print(f"  ⚠ LLM extraction failed: {e}")
        
        # Fallback: Return technical terms even if incomplete
        return technical_terms
    
    def _extract_technical_terms(self, bio: str, title: str = "") -> List[str]:
        """
        Extract technical terms using keyword matching and contextual analysis.
        
        Args:
            bio: Person's biographical text
            title: Person's job title
            
        Returns:
            List of 3 expertise keywords
        """
        import re
        
        # Find matching terms in bio (case insensitive, whole word matching)
        bio_lower = bio.lower()
        found_terms = []
        term_scores = {}  # Track relevance scores
        
        for term in self.technical_domains:
            term_lower = term.lower()
            # Use word boundaries for better matching
            pattern = r'\b' + re.escape(term_lower) + r'\b'
            matches = re.findall(pattern, bio_lower)
            
            if matches:
                count = len(matches)
                # Score based on frequency and position (earlier mentions = more important)
                position_score = 1.0
                first_pos = bio_lower.find(term_lower)
                if first_pos < len(bio) * 0.3:  # In first 30% of bio
                    position_score = 1.5
                
                score = count * position_score
                term_scores[term] = score
                found_terms.append(term)
        
        # Also extract from title
        if title:
            title_lower = title.lower()
            for term in self.technical_domains:
                term_lower = term.lower()
                if term_lower in title_lower and term not in found_terms:
                    # Title mentions get high scores
                    term_scores[term] = 2.0
                    found_terms.insert(0, term)  # Priority for title terms
        
        # If we found terms, sort by score and take top 3
        if found_terms:
            # Remove duplicates while preserving scores
            unique_terms = list(dict.fromkeys(found_terms))
            # Sort by score (descending)
            sorted_terms = sorted(unique_terms, key=lambda t: term_scores.get(t, 0), reverse=True)
            expertise = sorted_terms[:3]
        else:
            # No technical terms found - try to extract domain from title or bio
            expertise = self._extract_from_context(bio, title)
        
        # Pad with None if needed
        while len(expertise) < 3:
            expertise.append(None)
        
        return expertise[:3]
    
    def _extract_from_context(self, bio: str, title: str = "") -> List[str]:
        """
        Extract expertise from context when no direct technical terms found.
        Uses field-specific keywords.
        
        Args:
            bio: Person's biographical text
            title: Person's job title
            
        Returns:
            List of expertise keywords
        """
        import re
        
        expertise = []
        bio_lower = bio.lower()
        title_lower = title.lower() if title else ""
        
        # Field indicators
        field_mappings = {
            'data': ['Data Science', 'Data Analysis', 'Data Analytics'],
            'software': ['Software Engineering', 'Software Development'],
            'health': ['Healthcare Analytics', 'Public Health', 'Health Informatics'],
            'bio': ['Biotechnology', 'Molecular Biology', 'Bioinformatics'],
            'machine learning': ['Machine Learning', 'Artificial Intelligence'],
            'statistics': ['Statistical Modeling', 'Biostatistics'],
            'research': ['Research Methodology', 'Scientific Research'],
            'education': ['Education Technology', 'Instructional Design'],
            'business': ['Business Analytics', 'Project Management'],
            'engineering': ['Biomedical Engineering', 'System Engineering']
        }
        
        # Check for field indicators
        for indicator, fields in field_mappings.items():
            if indicator in bio_lower or indicator in title_lower:
                expertise.extend(fields[:min(2, 3-len(expertise))])
                if len(expertise) >= 3:
                    break
        
        # Look for "PhD in X", "MS in X", "Bachelor in X" patterns
        degree_patterns = [
            r"ph\.?d\.?\s+in\s+([a-z\s]+?)(?:\s+from|\s+at|,|\.|$)",
            r"doctorate\s+in\s+([a-z\s]+?)(?:\s+from|\s+at|,|\.|$)",
            r"master'?s?\s+(?:of|in)\s+([a-z\s]+?)(?:\s+from|\s+at|,|\.|$)",
            r"m\.?s\.?\s+in\s+([a-z\s]+?)(?:\s+from|\s+at|,|\.|$)",
        ]
        
        for pattern in degree_patterns:
            matches = re.findall(pattern, bio_lower)
            for match in matches:
                field = match.strip().title()
                # Clean up common suffixes
                field = re.sub(r'\s+(From|At)$', '', field, flags=re.IGNORECASE)
                if len(field) > 3 and len(field) < 50:
                    expertise.append(field)
                    if len(expertise) >= 3:
                        break
            if len(expertise) >= 3:
                break
        
        return expertise[:3]
    
    def _create_prompt(self, bio: str, title: str = "") -> str:
        """
        Create a prompt for the LLM.
        
        The prompt includes:
        - A system-like instruction (Flan-T5 is instruction-tuned)
        - Context about the role
        - The task
        - The bio text
        """
        # Truncate bio if too long (keep first 500 chars for context)
        bio_truncated = bio[:500] + "..." if len(bio) > 500 else bio
        
        # Construct prompt with clear instructions focused on technical/domain expertise
        # Flan-T5 works well with imperative instructions and examples
        prompt = (
            f"You are an HR recruiter evaluating technical and professional skillsets. "
            f"Extract exactly three domain expertise areas or technical skills from this biography. "
            f"Focus on: research areas, technical skills, scientific domains, methodologies, "
            f"or specialized knowledge areas. Avoid generic job titles. "
            f"Examples: 'Machine Learning', 'Healthcare Analytics', 'Protein Engineering', "
            f"'Statistical Modeling', 'Data Visualization'.\n\n"
            f"Biography: {bio_truncated}\n\n"
            f"Three expertise areas (comma-separated):"
        )
        
        return prompt
    
    def _parse_keywords(self, text: str) -> List[str]:
        """
        Parse the LLM output to extract exactly 3 keywords.
        
        Args:
            text: Raw text output from LLM
            
        Returns:
            List of exactly 3 keywords (or None if not found)
        """
        # Clean the text
        text = text.strip()
        
        # Split by comma or newline
        if ',' in text:
            keywords = [k.strip() for k in text.split(',')]
        elif '\n' in text:
            keywords = [k.strip() for k in text.split('\n')]
        else:
            # Single word or phrase, try to split by spaces if multiple words
            words = text.split()
            if len(words) <= 3:
                keywords = words
            else:
                # Take first 3 words as fallback
                keywords = words[:3]
        
        # Clean and capitalize each keyword
        cleaned = []
        # Common words to filter out (job title indicators)
        filter_words = {
            'assistant', 'associate', 'professor', 'director', 'manager', 
            'coordinator', 'of', 'and', 'the', 'for', 'in', 'at', 'with',
            'job', 'title', 'biography', 'research', 'fellow', 'postdoctoral',
            'lecturer', 'teaching', 'visiting', 'adjunct', 'senior', 'lead',
            'head', 'chief', 'part-time', 'full-time'
        }
        
        for kw in keywords:
            if kw and len(kw) > 1:
                # Remove numbering like "1.", "2.", etc.
                kw = kw.lstrip('0123456789.-) ')
                kw = kw.rstrip('.:,')
                
                # Skip if it's just a filtered word
                if kw.lower() in filter_words:
                    continue
                    
                # Skip if it's mostly filtered words
                words_in_kw = kw.lower().split()
                if len(words_in_kw) > 0:
                    valid_words = [w for w in words_in_kw if w not in filter_words]
                    # If more than half are filter words, skip
                    if len(valid_words) < len(words_in_kw) / 2:
                        continue
                
                # Capitalize properly
                kw = ' '.join(word.capitalize() for word in kw.split())
                if kw and len(kw) > 2:  # At least 3 characters
                    cleaned.append(kw)
        
        # Remove duplicates while preserving order
        seen = set()
        unique_cleaned = []
        for item in cleaned:
            item_lower = item.lower()
            if item_lower not in seen:
                seen.add(item_lower)
                unique_cleaned.append(item)
        
        # Ensure exactly 3 elements
        while len(unique_cleaned) < 3:
            unique_cleaned.append(None)
        
        return unique_cleaned[:3]


def process_roux_data(input_path: Path, output_path: Path) -> Dict:
    """
    Process Roux Institute data and populate expertise fields.
    
    Args:
        input_path: Path to input JSON file
        output_path: Path to output JSON file
        
    Returns:
        Updated data dictionary
    """
    # Load the data
    with open(input_path, 'r') as f:
        data = json.load(f)
    
    print(f"Processing {len(data.get('Person', []))} people...\n")
    
    # Initialize extractor
    extractor = ExpertiseExtractor()
    
    # Process each person
    processed_count = 0
    for i, person in enumerate(data.get('Person', []), 1):
        name = person.get('person_name', '')
        bio = person.get('bio', '')
        title = person.get('main_field', '')
        
        print(f"[{i}/{len(data['Person'])}] Processing: {name}")
        
        # Extract expertise using LLM
        expertise = extractor.extract_expertise(bio, name, title)
        
        # Populate expertise fields
        person['expertise_1'] = expertise[0]
        person['expertise_2'] = expertise[1]
        person['expertise_3'] = expertise[2]
        
        if any(expertise):
            processed_count += 1
            expertise_str = ', '.join([e for e in expertise if e])
            print(f"  ✓ Expertise: {expertise_str}")
        else:
            print(f"  ⚠ No expertise extracted")
        print()
    
    print(f"\n{'='*60}")
    print(f"Processed {processed_count}/{len(data.get('Person', []))} people with expertise")
    print(f"{'='*60}\n")
    
    # Save updated data
    with open(output_path, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"✓ Updated data saved to: {output_path}\n")
    
    return data


def generate_expertise_report(data: Dict) -> None:
    """Generate a summary report of extracted expertise."""
    print("="*60)
    print("EXPERTISE EXTRACTION SUMMARY")
    print("="*60)
    
    all_expertise = []
    people_with_expertise = 0
    
    for person in data.get('Person', []):
        person_expertise = []
        for i in range(1, 4):
            exp = person.get(f'expertise_{i}')
            if exp:
                all_expertise.append(exp)
                person_expertise.append(exp)
        
        if person_expertise:
            people_with_expertise += 1
    
    print(f"\nPeople with expertise: {people_with_expertise}/{len(data.get('Person', []))}")
    print(f"Total expertise entries: {len(all_expertise)}")
    print(f"Average per person: {len(all_expertise)/len(data.get('Person', [])) if data.get('Person') else 0:.1f}")
    
    # Show sample
    print("\nSample expertise extracted:")
    for i, person in enumerate(data.get('Person', [])[:5], 1):
        expertise = [person.get(f'expertise_{j}') for j in range(1, 4) if person.get(f'expertise_{j}')]
        if expertise:
            print(f"  {i}. {person['person_name']}: {', '.join(expertise)}")


def main():
    """Main execution function."""
    print("="*60)
    print("Roux Institute - LLM-Based Expertise Extraction")
    print("="*60)
    print()
    
    # Set up paths
    backend_dir = Path(__file__).parent.parent
    input_file = backend_dir / 'unprocessed' / 'roux_institute_data.json'
    output_file = backend_dir  / 'processed' / 'roux_institute_data_with_expertise.json'
    
    # Check if input file exists
    if not input_file.exists():
        print(f"✗ Error: Input file not found: {input_file}")
        print("  Please run the roux_scraper.py first to generate the data.")
        return
    
    try:
        # Process the data
        data = process_roux_data(input_file, output_file)
        
        # Generate report
        generate_expertise_report(data)
        
        print("\n" + "="*60)
        print("✓ Expertise extraction completed!")
        print("="*60)
        print(f"\nNext steps:")
        print(f"1. Review the output: {output_file.name}")
        print(f"2. If satisfied, replace original:")
        print(f"   mv {output_file} {input_file}")
        print(f"3. Run insert_roux_data.py to load into database")
        
    except KeyboardInterrupt:
        print("\n\n✗ Process interrupted by user")
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()
