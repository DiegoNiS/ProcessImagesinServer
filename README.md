# Otsu Cliente-Servidor (Client Heavy)

Este proyecto es una aplicación web que implementa el algoritmo de umbralización de Otsu para la binarización de imágenes. Presenta una arquitectura híbrida que permite el procesamiento de imágenes tanto en el cliente (navegador) como en el servidor, priorizando el procesamiento en el lado del cliente mediante Pyodide.

## 🚀 Descripción

El sistema permite a los usuarios:

- Subir y procesar imágenes directamente en el servidor.
- Almacenar imágenes en el servidor para su posterior procesamiento.
- Procesar imágenes almacenadas en el servidor.
- Descargar las imágenes binarizadas resultantes.

Esta flexibilidad ofrece un equilibrio entre el rendimiento del procesamiento y las capacidades de almacenamiento del servidor.

## 🧱 Arquitectura del Sistema

- **Interfaz de Usuario**: HTML/CSS con Bootstrap 5.
- **Controlador del Cliente**: JavaScript (`main.js`) que gestiona eventos de la interfaz.
- **Motor de Procesamiento**: Python ejecutado en el navegador mediante Pyodide (WebAssembly).
- **Servidor**: Aplicación Flask que maneja el almacenamiento, procesamiento y recuperación de imágenes.
- **Sistema de Almacenamiento**: Sistema de archivos para almacenar imágenes subidas.
- **Algoritmo**: Implementación del algoritmo de umbralización de Otsu en Python.

## 🔄 Flujo de Procesamiento

1. El usuario sube una imagen a través de la interfaz web.
2. La imagen se muestra y se almacena en `currentOriginalImage`.
3. Al hacer clic en "Procesar":
   - La imagen se convierte a escala de grises.
   - Los datos en escala de grises se pasan al algoritmo de Otsu en Python.
   - La imagen binarizada resultante se renderiza en un canvas.

## 🛠️ Instalación y Ejecución

1. Clona el repositorio:

   ```bash
   git clone https://github.com/DiegoNiS/otsu-cliente-servidor_clientheavy.git
   cd otsu-cliente-servidor_clientheavy
   ```

2. (Opcional) Crea y activa un entorno virtual:

   ```bash
   python -m venv venv
   source venv/bin/activate  # En Windows: venv\Scripts\activate
   ```

3. Instala las dependencias:


   ```bash
   pip install -r requirements.txt
   ```

4. Ejecuta la aplicación:

   ```bash
   python app.py
   ```

5. Abre tu navegador en http://localhost:5000.

## Estructura del Proyecto

   ```bash
   otsu-cliente-servidor_clientheavy/
   ├── app.py                 # Servidor Flask
   ├── requirements.txt       # Dependencias del proyecto
   ├── static/                # Archivos estáticos (JS, CSS, imágenes)
   │   └── js/
   │       └── main.js        # Lógica del cliente y procesamiento de imágenes
   ├── templates/             # Plantillas HTML
   │   └── index.html         # Interfaz principal
   └── README.md              # Documentación del proyecto
   ```

