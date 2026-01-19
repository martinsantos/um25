from PIL import Image
import collections

def sample_colors(path):
    img = Image.open(path).convert("RGB")
    pixels = list(img.getdata())
    # Count frequencies of colors at the edges (where the background usually is)
    width, height = img.size
    edge_pixels = []
    for x in range(width):
        edge_pixels.append(img.getpixel((x, 0)))
        edge_pixels.append(img.getpixel((x, height - 1)))
    for y in range(height):
        edge_pixels.append(img.getpixel((0, y)))
        edge_pixels.append(img.getpixel((width - 1, y)))
    
    counts = collections.Counter(edge_pixels)
    print("Most common edge colors:")
    for color, count in counts.most_common(10):
        print(f"{color}: {count}")

if __name__ == "__main__":
    sample_colors("serviciosimg/redes.png")
