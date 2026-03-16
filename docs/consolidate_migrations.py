import os

migrations_dir = r"c:\Users\serva\OneDrive\Documents\THE FOURTHS PROJECTS\PRODUCTION\supabase\migrations"
output_file = r"c:\Users\serva\OneDrive\Documents\THE FOURTHS PROJECTS\PRODUCTION\docs\consolidated_schema.sql"

files = sorted([f for f in os.listdir(migrations_dir) if f.endswith('.sql')])

with open(output_file, 'w', encoding='utf-8') as outfile:
    for filename in files:
        filepath = os.path.join(migrations_dir, filename)
        with open(filepath, 'r', encoding='utf-8') as infile:
            outfile.write(f"-- Source: {filename}\n")
            outfile.write(infile.read())
            outfile.write("\n\n")

print(f"Consolidated {len(files)} migrations into {output_file}")
