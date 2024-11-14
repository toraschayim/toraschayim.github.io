# Python program that will rename all 
# PDF files in the “pdf” folder by 
# removing “-nodata” from their names:

import os

# Define the folder containing the PDF files
folder_path = 'pdf'

# Loop through all files in the folder
for filename in os.listdir(folder_path):
    # Check if the file is a PDF and contains "nodata" in its name
    if filename.endswith('.pdf') and 'nodata' in filename:
        # Create the new filename by removing "nodata"
        new_filename = filename.replace('-nodata', '')
        # Get the full path of the old and new filenames
        old_file = os.path.join(folder_path, filename)
        new_file = os.path.join(folder_path, new_filename)
        # Rename the file
        os.rename(old_file, new_file)
        print(f'Renamed: {filename} -> {new_filename}')

print('Renaming complete!')
