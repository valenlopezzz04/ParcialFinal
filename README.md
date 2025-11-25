# Instrucciones para ejecutar el proyecto

Este proyecto está compuesto por tres servicios principales:

1. **Backend (Spring Boot)** – API REST, autenticación y persistencia.  
2. **WebSocket Server (Node.js)** – comunicación en tiempo real y distribución de mensajes.  
3. **Frontend (Vite + React)** – cliente del chat en el navegador.

---

## 1. Requisitos

Tener instalado:

- **Java 17+**
- **Maven**
- **Node.js 18+**
- **npm**
- **Python 3.9+** (opcional, para simulación)
- **PostgreSQL** (si no se usa Docker)

---

## 🗄️ 2. Levantar la base de datos

Con Docker:

```bash
docker compose up -d
```

## 3. Ejecutar el Backend (Spring Boot)

En una terminal:

```bash
cd backend
./mvnw spring-boot:run
# Windows:
mvn spring-boot:run
```

El backend queda disponible el puerto 8080.

## 4. Ejecutar el WebSocket Server (Node.js)

En otra terminal:

```bash
cd websocket-server
npm install
npm start
```

El WebSocket se expone en: ws://localhost:3001/?token=<JWT>

Ejecutar el Frontend (Vite)

En otra terminal:

```bash
cd chat-client
npm install
npm run dev
```

El frontend estará disponible en: http://localhost:5173

## 4. Crear usuario y obtener token (para login)

Desde Postman:

```bash
- Registro
POST http://localhost:8080/api/auth/register
Content-Type: application/json

{
  "username": "mila",
  "password": "123456",
  "email": "mila@example.com"
}
```

```bash
- Login
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{
  "username": "mila",
  "password": "123456"
}
```

La respuesta contiene un JWT:
```bash
{ "token": "<JWT_GENERADO>" }
```

Este token se usa para iniciar sesión en el frontend, y para conectarse al WebSocket.

## 7. Probar el chat (modo normal)

1. Abre http://localhost:5173
2. Inicia sesión con el usuario creado.
3. Entra a una sala (por ejemplo room 1).
4. Abre otra ventana del navegador, inicia sesión con otro usuario y entra a la misma sala.
5. Envía mensajes: verás la actualización en tiempo real.

# Usuarios utilizados:

username: milazro
password: 1234

username: geny
password: 4556

## 8. Ejecutar el script de simulación de carga.

El proyecto incluye un script Python (simulate.py) para probar:

- concurrencia (decenas de usuarios),
- latencias típicas,
- eco del mensaje (new_message),
- métricas del WebSocket.

1. Instalar dependencia
pip install websockets

2. Configurar variables
# JWT obtenido en el login
export BASE_TOKEN="<JWT_AQUI>"

3. Room donde se hará la prueba
export ROOM_ID=1

4. Cantidad de usuarios simulados
export CONCURRENT_USERS=30

5. Duración de la prueba (segundos)
export TEST_DURATION_S=30

6. Ejecutar
python simulate.py

Se verá algo como

[metrics] connected=29/30 sent=300 echoes=295 errors=0 lat_mean_ms=180.4 lat_p95_ms=420.7

========= RESUMEN PoC =========
Usuarios objetivo: 30
Conectados OK:     29
Latencia p95:      420 ms
Violaciones SLO<850ms: 0%


Esto permite evaluar la estabilidad del WebSocket bajo carga.
