let currentOriginalFileName = null;

// Loading overlay functions
function showLoading() {
    const overlay = document.querySelector('.loading-overlay');
    overlay.style.display = 'flex';
}
function hideLoading() {
    const overlay = document.querySelector('.loading-overlay');
    overlay.style.display = 'none';
}

// Cargar imágenes del servidor
async function loadServerImages() {
    const response = await fetch('/images');
    const images = await response.json();
    const select = document.getElementById('serverImages');
    select.innerHTML = '';
    images.forEach(image => {
        const option = document.createElement('option');
        option.value = image.path;
        option.textContent = image.name;
        select.appendChild(option);
    });
}
loadServerImages();

// Al seleccionar archivo local
document.getElementById("imageInput").addEventListener("change", function () {
    const file = this.files[0];
    if (!file) return;
    currentOriginalFileName = file.name;
    const reader = new FileReader();
    reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
            const container = document.getElementById("originalImageContainer");
            container.innerHTML = "";
            container.appendChild(img);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
});

// Subir imagen original al servidor
document.getElementById("uploadOriginalImage").addEventListener("click", async function() {
    const fileInput = document.getElementById("imageInput");
    const file = fileInput.files[0];
    if (!file) {
        alert('Por favor, seleccione una imagen primero');
        return;
    }
    showLoading();
    await new Promise(resolve => setTimeout(resolve, 50));
    try {
        const formData = new FormData();
        formData.append('image', file);
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        alert(result.message);
        loadServerImages();
    } catch (error) {
        alert('Error al enviar la imagen al servidor');
    } finally {
        hideLoading();
    }
});

// Cargar imagen del servidor
document.getElementById("loadServerImage").addEventListener("click", async function() {
    const select = document.getElementById('serverImages');
    const imagePath = select.value;
    if (!imagePath) return;
    const parts = imagePath.split('/');
    currentOriginalFileName = parts[parts.length - 1];
    showLoading();
    await new Promise(resolve => setTimeout(resolve, 50));
    const img = new Image();
    img.onload = function() {
        const container = document.getElementById("serverImageContainer");
        container.innerHTML = "";
        container.appendChild(img);
        hideLoading();
    };
    img.onerror = function() {
        alert('Error al cargar la imagen del servidor');
        hideLoading();
    };
    img.src = imagePath;
});

// Procesar imagen desde el servidor (Otsu en backend)
document.getElementById("processServerImage").addEventListener("click", async function() {
    if (!currentOriginalFileName) {
        alert('Por favor, cargue una imagen del servidor primero');
        return;
    }
    showLoading();
    try {
        const response = await fetch('/process_server', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: currentOriginalFileName })
        });
        const result = await response.json();
        if (result.processed_url) {
            // Mostrar la imagen procesada en el canvas
            const img = new Image();
            img.onload = function() {
                const canvas = document.getElementById("serverResultCanvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);
            };
            img.src = result.processed_url;
            if (result.already_processed) {
                alert("La imagen ya estaba procesada, se muestra el resultado guardado.");
            }
        } else {
            alert(result.error || "Error al procesar la imagen");
        }
    } catch (error) {
        alert('Error al procesar la imagen en el servidor');
    } finally {
        hideLoading();
    }
});

// Guardar imagen procesada en el cliente
document.getElementById("saveProcessedImage").addEventListener("click", function() {
    const canvas = document.getElementById("serverResultCanvas");
    if (!canvas.toDataURL) {
        alert('Por favor, procese la imagen primero');
        return;
    }
    const link = document.createElement('a');
    link.download = currentOriginalFileName;
    link.href = canvas.toDataURL('image/png');
    link.click();
});

// Guardar imagen procesada en el servidor (ya está guardada por el backend, solo alerta)
document.getElementById("saveProcessedToServer").addEventListener("click", function() {
    alert("La imagen procesada ya está guardada en el servidor.");
});

// Procesar imagen local (enviar al servidor y mostrar resultado)
document.getElementById("processLocalImage").addEventListener("click", async function() {
    const fileInput = document.getElementById("imageInput");
    const file = fileInput.files[0];
    if (!file) {
        alert('Por favor, seleccione una imagen primero');
        return;
    }
    showLoading();
    await new Promise(resolve => setTimeout(resolve, 50));
    try {
        const formData = new FormData();
        formData.append('image', file);
        const response = await fetch('/process_local', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        if (result.processed_image) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.getElementById("resultCanvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);
            };
            img.src = result.processed_image;
            // Guarda la imagen base64 para el botón de guardar
            canvasProcessedImageData = result.processed_image;
        } else {
            alert(result.error || "Error al procesar la imagen");
        }
    } catch (error) {
        alert('Error al procesar la imagen en el servidor');
    } finally {
        hideLoading();
    }
});

// Guardar imagen procesada localmente en el servidor
let canvasProcessedImageData = null;
document.getElementById("saveLocalProcessedToServer").addEventListener("click", async function() {
    const canvas = document.getElementById("resultCanvas");
    let imageData = canvas.toDataURL("image/png");
    if (!imageData || canvas.width === 0) {
        alert('Por favor, procese la imagen primero');
        return;
    }
    showLoading();
    await new Promise(resolve => setTimeout(resolve, 50));
    try {
        const response = await fetch('/save_processed_local', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                image: imageData,
                filename: (currentOriginalFileName ? currentOriginalFileName.replace(/\.[^/.]+$/, ".png") : 'imagen.png')
            })
        });
        const result = await response.json();
        alert(result.message);
    } catch (error) {
        alert('Error al guardar la imagen procesada en el servidor');
    } finally {
        hideLoading();
    }
});