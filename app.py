from flask import Flask, render_template, request, jsonify, send_from_directory, send_file
import os
from PIL import Image
import numpy as np
import io
import base64
import re

app = Flask(__name__)

UPLOAD_FOLDER = os.path.join("static", "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

PROCESSED_FOLDER = os.path.join("static", "processed")
os.makedirs(PROCESSED_FOLDER, exist_ok=True)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/upload", methods=["POST"])
def upload():
    file = request.files.get("image")
    if file:
        path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(path)
        return jsonify({"message": "Imagen guardada exitosamente.", "path": path})
    return jsonify({"error": "No se recibió ninguna imagen"}), 400

@app.route("/images", methods=["GET"])
def get_images():
    images = []
    for filename in os.listdir(UPLOAD_FOLDER):
        if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp')):
            images.append({
                "name": filename,
                "path": f"/static/uploads/{filename}"
            })
    return jsonify(images)

@app.route("/static/uploads/<filename>")
def serve_image(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route("/process_server", methods=["POST"])
def process_server():
    data = request.json
    filename = data.get("filename")
    if not filename:
        return jsonify({"error": "No se recibió el nombre de la imagen"}), 400

    upload_path = os.path.join(UPLOAD_FOLDER, filename)
    processed_path = os.path.join(PROCESSED_FOLDER, filename)

    # Si ya existe la imagen procesada, devolverla
    if os.path.exists(processed_path):
        return jsonify({"already_processed": True, "processed_url": f"/processed/{filename}"})

    # Procesar la imagen
    if not os.path.exists(upload_path):
        return jsonify({"error": "No existe la imagen original en el servidor"}), 404

    img = Image.open(upload_path).convert("L")
    img_np = np.array(img)

    # Otsu
    threshold = otsu_threshold(img_np)
    binary = (img_np >= threshold) * 255
    binary_img = Image.fromarray(np.uint8(binary))

    # Guardar
    binary_img.save(processed_path)

    # Devolver la url
    return jsonify({"already_processed": False, "processed_url": f"/processed/{filename}"})

def otsu_threshold(image):
    pixel_counts = np.bincount(image.flatten(), minlength=256)
    total = image.size
    sum_total = np.dot(np.arange(256), pixel_counts)
    sumB = 0
    wB = 0
    max_var = 0
    threshold = 0

    for i in range(256):
        wB += pixel_counts[i]
        if wB == 0:
            continue
        wF = total - wB
        if wF == 0:
            break
        sumB += i * pixel_counts[i]
        mB = sumB / wB
        mF = (sum_total - sumB) / wF
        var_between = wB * wF * (mB - mF) ** 2
        if var_between > max_var:
            max_var = var_between
            threshold = i
    return threshold

@app.route("/processed/<filename>")
def get_processed_image(filename):
    path = os.path.join(PROCESSED_FOLDER, filename)
    if os.path.exists(path):
        return send_from_directory(PROCESSED_FOLDER, filename)
    return jsonify({"error": "No existe la imagen procesada"}), 404

@app.route("/process_local", methods=["POST"])
def process_local():
    file = request.files.get("image")
    if not file:
        return jsonify({"error": "No se recibió ninguna imagen"}), 400

    img = Image.open(file.stream).convert("L")
    img_np = np.array(img)
    threshold = otsu_threshold(img_np)
    binary = (img_np >= threshold) * 255
    binary_img = Image.fromarray(np.uint8(binary))

    # Convertir a base64 para enviar al frontend
    buf = io.BytesIO()
    binary_img.save(buf, format="PNG")
    buf.seek(0)
    img_bytes = buf.read()
    img_b64 = base64.b64encode(img_bytes).decode("utf-8")
    return jsonify({"processed_image": f"data:image/png;base64,{img_b64}"})

@app.route("/save_processed_local", methods=["POST"])
def save_processed_local():
    data = request.json
    img_b64 = data.get("image")
    filename = data.get("filename")
    if not img_b64 or not filename:
        return jsonify({"error": "Faltan datos"}), 400

    # Extraer base64 puro
    img_b64_clean = re.sub('^data:image/.+;base64,', '', img_b64)
    img_bytes = base64.b64decode(img_b64_clean)
    img = Image.open(io.BytesIO(img_bytes))

    # Forzar extensión y modo correcto
    ext = os.path.splitext(filename)[1].lower()
    save_path = os.path.join(PROCESSED_FOLDER, filename)
    if ext in [".jpg", ".jpeg"]:
        img = img.convert("RGB")
        save_path = os.path.splitext(save_path)[0] + ".jpg"
        img.save(save_path, format="JPEG")
    else:
        img.save(save_path, format="PNG")

    return jsonify({"message": "Imagen procesada guardada en el servidor.", "path": f"/processed/{os.path.basename(save_path)}"})

if __name__ == "__main__":
    app.run(debug=True)