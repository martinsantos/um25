#!/bin/bash

# Configuration
DIRECTUS_URL="http://localhost:8055"
TOKEN="k6P8LAY8_x_y1miB_KTlWnysCnx2Abky"
UPLOADS_DIR="local-uploads"

# Ensure the uploads directory exists
if [ ! -d "$UPLOADS_DIR" ]; then
  echo "Error: Uploads directory $UPLOADS_DIR not found"
  exit 1
fi

# Function to get file MIME type
get_mime_type() {
  local file=$1
  file --mime-type -b "$file"
}

# Function to get file size
get_file_size() {
  local file=$1
  stat -f %z "$file" 2>/dev/null || stat -c %s "$file" 2>/dev/null
}

# Function to get image dimensions
get_image_dimensions() {
  local file=$1
  local mime_type=$(get_mime_type "$file")
  
  if [[ $mime_type == image/* ]]; then
    # Try different methods to get dimensions
    if command -v identify >/dev/null 2>&1; then
      # Using ImageMagick
      identify -format "%w %h" "$file" 2>/dev/null
    elif command -v sips >/dev/null 2>&1; then
      # Using sips (macOS)
      sips -g pixelWidth -g pixelHeight "$file" | 
        awk '/pixelWidth/{w=$2} /pixelHeight/{h=$2} END{print w " " h}'
    fi
  fi
  echo ""
}

# Process each file in the uploads directory
find "$UPLOADS_DIR" -type f | while read -r file; do
  # Skip hidden files and directories
  if [[ $(basename "$file") == .* ]]; then
    continue
  fi

  echo "Processing file: $file"
  
  # Get file info
  filename=$(basename "$file")
  mime_type=$(get_mime_type "$file")
  filesize=$(get_file_size "$file")
  
  # Get image dimensions if it's an image
  dimensions=$(get_image_dimensions "$file")
  width=$(echo "$dimensions" | awk '{print $1}')
  height=$(echo "$dimensions" | awk '{print $2}')
  
  # Extract title from filename (remove UUID and extension)
  title=$(echo "$filename" | sed -E 's/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[-_]?//' | sed 's/\.[^.]*$//')
  
  # Prepare the file data
  file_data="{\"title\":\"$title\",\"type\":\"$mime_type\",\"filesize\":$filesize"
  
  # Add dimensions if available
  if [ -n "$width" ] && [ -n "$height" ]; then
    file_data="$file_data,\"width\":$width,\"height\":$height"
  fi
  
  file_data="$file_data}"
  
  # Upload the file to Directus
  echo "Uploading $filename..."
  response=$(curl -s -X POST "$DIRECTUS_URL/files" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: multipart/form-data" \
    -F "file=@$file" \
    -F "title=$title" \
    -F "type=$mime_type" \
    -F "filesize=$filesize" \
    -F "width=$width" \
    -F "height=$height")
  
  # Check if the upload was successful
  if echo "$response" | grep -q '"id":'; then
    file_id=$(echo "$response" | jq -r '.data.id')
    echo "Successfully uploaded $filename with ID: $file_id"
  else
    echo "Error uploading $filename: $response"
  fi
  
  # Add a small delay to avoid overwhelming the server
  sleep 0.5

done

echo "File migration completed."
