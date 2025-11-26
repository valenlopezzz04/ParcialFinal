# ParcialFinal

## Información del Proyecto
- **Universidad:** Universidad de La Sabana
- **Facultad:** Facultad de Ingeniería
- **Materia:** Patrones Arquitectónicos Avanzados

## Integrantes del Proyecto
| Nombre | Correo Electrónico |
|---|---|
| Valentina Alejandra López Romero | valentinalopro@unisabana.edu.co |
| Laura Camila Rodriguez Leon | laurarodleo@unisabana.edu.co |
| Mariana Valle Moreno | marianavamo@unisabana.edu.co |

# Instrucciones para ejecutar el proyecto

Este proyecto está compuesto por tres servicios principales:

1. **Backend (Spring Boot)** – API REST, autenticación y persistencia.  
2. **WebSocket Server (Node.js)** – comunicación en tiempo real y distribución de mensajes.  
3. **Frontend (Vite + React)** – cliente del chat en el navegador.

---

## 1. Requisitos

Tener instalado:

- Docker
- Java 17+
- Maven
- Node.js 18+
- npm

---

## 🗄️ 2. Levantar la base de datos (PostgreSQL)

Con Docker:

docker-compose up postgres

---

## 3. Ejecutar el Backend (Spring Boot)

En una terminal:

cd E:\Documents\ParcialFinal\backend
mvn spring-boot:run

El backend queda disponible el puerto 8080.

---

## 4. Ejecutar RabbitMQ + WebSocket Server

### 4.1 Levantar RabbitMQ

docker-compose up rabbitmq

### 4.2 Levantar el WebSocket Server

En otra terminal:

cd websocket-server
$env:RABBIT_URL="amqp://admin:admin@localhost:5672"
npm start

El WebSocket se expone en:  
ws://localhost:3001/?token=<JWT>

---

## 5. Ejecutar el Frontend (Vite)

En otra terminal:

cd E:\Documents\ParcialFinal\chat-client
npm install
npm run dev

El frontend estará disponible en:  
http://localhost:5173

---

## 6. Probar el chat (modo normal)

1. Abre http://localhost:5173  
2. Inicia sesión con el usuario creado.  
3. Entra a una sala (por ejemplo room 1).  
4. Abre otra ventana del navegador, inicia sesión con otro usuario y entra a la misma sala.  
5. Envía mensajes: verás la actualización en tiempo real.

---

# 7. Para crear usuarios:

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
bash
```
```bash
- Login
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{
  "username": "mila",
  "password": "123456"
}
bash
```

---

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


Esto permite evaluar la estabilidad del WebSocket bajo carga.
