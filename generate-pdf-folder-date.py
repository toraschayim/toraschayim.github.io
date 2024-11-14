#!/usr/bin/env python

import os
# This is needed only if we are adding a PDF file to "pdf" folder

def generate_js_array(pdf_folder="pdf", tag="Hashkafa"):
    # Initialize an empty list to hold the JavaScript object representations
    pdf_files_js = []

    # Loop through each file in the specified folder
    for filename in os.listdir(pdf_folder):
        # Check if the file is a PDF
        if filename.endswith(".pdf"):
            # Generate the name by removing only the ".pdf" extension
            name = filename.replace(".pdf", "")
            # Create the URL path for the PDF file
            url = f"{pdf_folder}/{filename}"
            # Append the JavaScript object to the list
            pdf_files_js.append(f'{{ name: "{name}", url: "{url}", tag: "{tag}" }}')

    # Join the list into a JavaScript array format
    js_array = "const pdfFiles = [\n" + ",\n".join(pdf_files_js) + "\n];"
    return js_array

# Define the output path for JavaScript
output_js = generate_js_array()

# Print the generated JavaScript array
print(output_js)



