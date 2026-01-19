import sys
from PIL import Image

def remove_background(input_path, output_path):
    print(f"Processing: {input_path}")
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()

    new_data = []
    for item in datas:
        # Threshold for 'white-ish' pixels
        # We also look for pixels that are very bright
        avg = (item[0] + item[1] + item[2]) / 3
        if avg > 250: # Very close to white
            new_data.append((255, 255, 255, 0))
        elif avg > 240: # Near white, add partial transparency for smoothing
            alpha = int((255 - avg) * (255 / (255 - 240)))
            new_data.append((item[0], item[1], item[2], max(0, min(255, alpha))))
        else:
            new_data.append(item)

    img.putdata(new_data)
    img.save(output_path, "PNG")
    print(f"Saved to: {output_path}")

if __name__ == "__main__":
    files = [
        ("redes_volumetric_pure_white_1768440837625.png", "infraestructura-redes-volumetric.png"),
        ("soporte_volumetric_pure_white_1768440852614.png", "soporte-tecnico-volumetric.png"),
        ("ciberseguridad_volumetric_pure_white_1768440867511.png", "ciberseguridad-volumetric.png"),
        ("desarrollo_volumetric_pure_white_1768440882017.png", "desarrollo-software-volumetric.png"),
        ("consultoria_volumetric_pure_white_1768440898283.png", "consultoria-it-volumetric.png")
    ]
    
    base_path = "/Users/santosma/.gemini/antigravity/brain/a50cc31c-d0e0-4430-bbe9-9f289fe33ede/"
    target_path = "/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/public/images/services/"
    
    for input_file, output_name in files:
        remove_background(base_path + input_file, target_path + output_name)
