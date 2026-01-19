from PIL import Image
import os

images_dir = '/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/serviciosimg'
files = ['desarrollo.png', 'seguridad.png', 'redinfraestructura.png', 'consultoria.png', 'soportetic.png']

print("Analyzing background pixels (Top-Left corner)...")

for f in files:
    path = os.path.join(images_dir, f)
    if not os.path.exists(path):
        print(f"File not found: {f}")
        continue
        
    try:
        img = Image.open(path)
        pixel = img.getpixel((0, 0))
        print(f"{f}: {pixel} mode={img.mode}")
        
        # Check if it's pure white
        if img.mode == 'RGBA':
            is_white = pixel[0] >= 250 and pixel[1] >= 250 and pixel[2] >= 250
            if is_white and pixel[3] == 0:
                print(f"  -> Transparent")
            elif is_white:
                print(f"  -> White-ish (alpha={pixel[3]})")
            else:
                print(f"  -> NOT White")
        elif img.mode == 'RGB':
             is_white = pixel[0] >= 250 and pixel[1] >= 250 and pixel[2] >= 250
             print(f"  -> {'White-ish' if is_white else 'NOT White'}")
             
    except Exception as e:
        print(f"Error reading {f}: {e}")
