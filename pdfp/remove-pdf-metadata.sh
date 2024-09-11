#!/bin/bash
# exiftool input.pdf => this will show all the data
# exiftool -Title -Producer -Author -Creator input.pdf

# Check if a file is provided as input
if [ -z "$1" ]; then
  echo "Usage: $0 <input-pdf>"
  exit 1
fi

# Input PDF file
input_pdf="$1"

# Output PDF file with metadata removed
output_pdf="${input_pdf%.pdf}-nodata.pdf"

# Show specific metadata fields
echo "Showing filtered metadata for $input_pdf:"
exiftool -Title -Producer -Author -Creator "$input_pdf"

# Remove the specified metadata fields and save as a new file
echo "Removing metadata and saving as $output_pdf..."
exiftool -Title= -Producer= -Author= -Creator= "$input_pdf" -o "$output_pdf"

# Confirm removal and new file creation
echo "Metadata removed. New file created: $output_pdf"


