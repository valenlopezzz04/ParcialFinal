# Documento Técnico: Sistema de Chat en Tiempo Real

**Proyecto:** ParcialFinal - Chat Backend  
**Fecha:** Noviembre 2025  
**Versión:** 1.0  
**Autores:** Persona 1 (Backend REST), Persona 2 (WebSockets/Features Avanzadas)

---

## 1. Requisitos

### 1.1 Requisitos Funcionales

#### RF-01: Gestión de Salas
- El sistema debe permitir crear salas de chat con tipo público o privado.
- Salas públicas accesibles por cualquier usuario sin restricción.
- Salas privadas protegidas por contraseña (hash bcrypt).
- CRUD completo: crear, listar, consultar individual, actualizar, eliminar.

#### RF-02: Control de Acceso
- Validar acceso a salas privadas mediante contraseña en endpoint `/join`.
- Permitir entrada directa a salas públicas.
- Retornar códigos HTTP apropiados (403 para acceso denegado, 404 para sala no encontrada).

#### RF-03: Gestión de Usuarios
- Registro y login de usuarios con autenticación.
- Contraseñas almacenadas con hash bcrypt.
- Email y username únicos por usuario.

#### RF-04: Histórico de Mensajes (Futuro - Persona 2)
- Almacenar mensajes por sala con timestamp.
- Soporte para paginación en consultas de historial.
- Asociar mensajes a usuarios y salas.

#### RF-05: Chat en Tiempo Real (Futuro - Persona 2)
- Conexión WebSocket para envío/recepción de mensajes en vivo.
- Notificación de usuarios conectados/desconectados en sala.
- Broadcast de mensajes a todos los miembros activos.

### 1.2 Requisitos No Funcionales

#### RNF-01: Rendimiento
- Respuestas de API en menos de 500ms para operaciones CRUD.
- Soporte para paginación de historial con tamaño de página configurable.

#### RNF-02: Seguridad
- Contraseñas hasheadas con BCrypt.
- Implementación futura de JWT para autenticación sin estado.
- CSRF deshabilitado en desarrollo, reactivar en producción.
- Validación de entrada en todos los endpoints.

#### RNF-03: Escalabilidad
- Base de datos PostgreSQL con índices en columnas frecuentes.
- Soporte para múltiples usuarios concurrentes via WebSocket.
- Mensaje queueing via RabbitMQ para descoupling.

#### RNF-04: Disponibilidad
- Despliegue containerizado con Docker Compose.
- Persistencia de datos en volúmenes de PostgreSQL.
- Reinicio automático de servicios en caso de fallo (con políticas configuradas).

---

## 2. Arquitectura

### 2.1 Patrón Arquitectónico

**Hexagonal Architecture (Puertos y Adaptadores)** adaptada a monolito Spring Boot:

```
┌─────────────────────────────────────────┐
│         REST API Layer                  │
│    (Controllers, DTOs, HTTP)            │
└────────────┬────────────────────────────┘
             │
┌─────────────┴────────────────────────────┐
│     Application Layer                    │
│  (Services, Business Logic)              │
└────────────┬────────────────────────────┘
             │
┌─────────────┴────────────────────────────┐
│     Domain Layer                         │
│ (Entities, Repositories, Models)        │
└────────────┬────────────────────────────┘
             │
┌─────────────┴────────────────────────────┐
│  Infrastructure Layer                   │
│ (DB, Config, Security, Queue)           │
└─────────────────────────────────────────┘
```

### 2.2 Componentes

#### Backend - Spring Boot 3.2.0
- **Framework:** Spring Boot con starter-web, starter-data-jpa, starter-security, starter-amqp.
- **ORM:** Hibernate 6.3.1.
- **Base de Datos:** PostgreSQL 15 (Alpine).
- **Message Broker:** RabbitMQ (futuro, configurado).
- **Seguridad:** BCrypt para hash de contraseñas, Spring Security (deshabilitado temporalmente en dev).
- **Construcción:** Maven 3.11.

#### Contenedores - Docker
- **PostgreSQL:** Base de datos relacional persistente.
- **RabbitMQ:** Message broker para descoupling de eventos.
- **Volúmenes:** Persistencia de datos en `postgres_data`.
- **Red:** `chat-network` para comunicación entre servicios.

### 2.3 Flujo de Solicitud

```
Cliente (Postman/Frontend)
    ↓
HTTP Request → Spring Boot
    ↓
DispatcherServlet → Controller (@RestController)
    ↓
DTO deserialization (JSON → Java)
    ↓
Service Layer (lógica de negocio)
    ↓
Repository → JPA → Hibernate
    ↓
PostgreSQL Query Execution
    ↓
ResultSet → Entity Mapping
    ↓
Service → DTO Serialization (Java → JSON)
    ↓
HTTP Response 200/201/400/403/404
    ↓
Cliente recibe JSON
```

---

## 3. Architecture Decision Records (ADRs)

### ADR-001: Elección de Spring Boot para Backend REST

**Decisión:** Usar Spring Boot 3.2.0 como framework principal.

**Contexto:**
- Proyecto universitario requiere arquitectura enterprise-ready.
- Necesidad de integración rápida con JPA, Security y Web.
- Comunidad activa y documentación amplia.

**Alternativas Consideradas:**
- Node.js/Express: Más ligero, pero menos experience del equipo en production setup.
- Go/Gin: Performante, pero curva de aprendizaje mayor.

**Consecuencias:**
- ✅ Rápido prototipado y escalabilidad.
- ✅ Ecosistema robusto (Spring Data, Security, Cloud).
- ❌ Overhead inicial y consumo de RAM.
- ❌ Compilación más lenta vs interpretados.

---

### ADR-002: Usar PostgreSQL en lugar de NoSQL

**Decisión:** PostgreSQL como base de datos relacional principal.

**Contexto:**
- Modelo de datos requiere relaciones: usuarios ↔ salas, mensajes → usuarios/salas.
- ACID compliance necesario para consistencia transaccional.
- Migraciones SQL facilitan versionado del esquema.

**Alternativas:**
- MongoDB: Flexible, pero overhead para este caso; JOINs complejos en consultas.
- SQLite: Insuficiente para concurrencia y escalabilidad.

**Consecuencias:**
- ✅ Integridad referencial garantizada.
- ✅ Soporte nativo para índices y optimización.
- ✅ Migraciones versionadas (Flyway, Liquibase).
- ❌ Mayor rigidez en esquema vs NoSQL.

---

### ADR-003: Architecture Layers (Hexagonal adaptada)

**Decisión:** Separar código en capas: controller → service → repository → entity.

**Contexto:**
- Testabilidad: Inyección de dependencias permite mocks.
- Mantenibilidad: Responsabilidad única por capa.
- Reusabilidad: Servicios compartibles entre diferentes controladores.

**Estructura:**
```
com.chat
├── controller/          # REST endpoints
├── service/             # Lógica de negocio
├── domain/
│   ├── model/          # Entities JPA
│   └── repository/     # Spring Data interfaces
├── infrastructure/
│   ├── rest/dto/       # DTOs para API
│   ├── config/         # Configuración Spring
│   └── security/       # JWT, BCrypt utilities
└── ChatApplication     # Main Spring Boot
```

**Consecuencias:**
- ✅ Fácil de testear en aislamiento.
- ✅ Cambios en BD no afectan controllers.
- ✅ Reutilizable en múltiples contextos.
- ❌ Más boilerplate inicial.

---

### ADR-004: BCrypt para Password Hashing

**Decisión:** Usar `org.springframework.security.crypto.bcrypt.BCrypt`.

**Contexto:**
- Requisito de seguridad: Contraseñas jamás en plaintext.
- BCrypt incluye salt automático y factor de trabajo (configurable).

**Alternativas:**
- SHA-256: Vulnerable sin salt; rápido ataque por fuerza bruta.
- Argon2: Más robusto, pero overhead mayor; overkill para este contexto.

**Consecuencias:**
- ✅ Estándar industry para auth.
- ✅ Resistente a rainbow tables.
- ✅ Adaptable (work factor aumentable con el tiempo).
- ❌ Lento (by design, pero OK para login/registro).

---

### ADR-005: Desactivar Spring Security en Desarrollo

**Decisión:** Desactivar autenticación temporalmente via `SecurityConfig` personalizada.

**Contexto:**
- Fase de desarrollo: Pruebas ágiles en Postman.
- JWT aún no implementado en full.
- Iterar rápidamente sin overhead de tokens.

**Alternativas:**
- Mock de usuario en todos los tests: Más trabajoso.
- Endpoint de login con credenciales hardcoded: Complejo.

**Consecuencias:**
- ✅ Desarrollo rápido sin overhead de auth.
- ❌ **CRÍTICO:** Reactivar en producción.
- ⚠️ Riesgo de security debt si se olvida.

**Mitigación:** Documento de checklist pre-producción.

---

### ADR-006: RabbitMQ para Event-Driven (Futuro)

**Decisión:** Incluir RabbitMQ en Docker Compose para comunicación asíncrona.

**Contexto:**
- WebSockets requerirán broadcast eficiente de mensajes.
- Descoupling entre generador de evento y consumidores.
- Escalabilidad: Múltiples instancias pueden consumir del mismo queue.

**Alternativas:**
- Kafka: Más robusto, pero overhead para este caso.
- Redis Pub/Sub: Más simple, pero no persistent; pérdida de eventos si broker cae.

**Consecuencias:**
- ✅ Patrón event-driven scalable.
- ✅ Decoupling de servicios.
- ❌ Complejidad adicional (topologías, routing, handlers).
- ⏳ A completar en siguiente fase.

---

## 4. Modelo de Datos

### 4.1 Diagrama ER

```
┌─────────────────────┐
│       USERS         │
├─────────────────────┤
│ id (bigserial) PK   │
│ username (varchar)  │ UNIQUE
│ password_hash       │
│ email (varchar)     │ UNIQUE
│ created_at (ts)     │
└──────┬──────────────┘
       │
       │ 1:N
       ├─────────────────────────┐
       │                         │
       ▼                         ▼
┌──────────────────┐      ┌──────────────────┐
│      ROOMS       │      │    MESSAGES      │
├──────────────────┤      ├──────────────────┤
│ id (bigserial)   │      │ id (bigserial)   │
│ name (varchar)   │◄─────┤ room_id (fk)     │
│ room_type        │   │  │ user_id (fk)     │
│ password_hash    │   │  │ content (text)   │
│ created_by (fk)  │   │  │ sent_at (ts)     │
│ created_at (ts)  │   │  └──────────────────┘
└──────┬───────────┘   │
       │               │
       │ N:N           │
       ▼               │
┌──────────────────┐   │
│  ROOM_MEMBERS    │   │
├──────────────────┤   │
│ id (bigserial)   │   │
│ room_id (fk)─────┼───┘
│ user_id (fk)─────┼─────┐
│ joined_at (ts)   │     │
│ UNIQUE(room_id,  │     │
│   user_id)       │     │
└──────────────────┘     │
                         │
                    Referencia
                     a USERS
```

### 4.2 Tablas

#### USERS
```sql
CREATE TABLE users (
    id bigserial PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### ROOMS
```sql
CREATE TABLE rooms (
    id bigserial PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    room_type VARCHAR(20) NOT NULL CHECK (room_type IN ('public', 'private')),
    password_hash VARCHAR(255),
    created_by bigint REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### ROOM_MEMBERS (Relación N:N)
```sql
CREATE TABLE room_members (
    id bigserial PRIMARY KEY,
    room_id bigint NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(room_id, user_id)
);
```

#### MESSAGES
```sql
CREATE TABLE messages (
    id bigserial PRIMARY KEY,
    room_id bigint NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimización
CREATE INDEX idx_messages_room_id ON messages(room_id);
CREATE INDEX idx_messages_sent_at ON messages(sent_at DESC);
CREATE INDEX idx_room_members_user_id ON room_members(user_id);
CREATE INDEX idx_room_members_room_id ON room_members(room_id);
```

### 4.3 Relaciones

| Tabla A | Relación | Tabla B | Descripción |
|---------|----------|---------|------------|
| USERS | 1:N | ROOMS | Un usuario crea múltiples salas |
| USERS | 1:N | MESSAGES | Un usuario envía múltiples mensajes |
| ROOMS | 1:N | MESSAGES | Una sala contiene múltiples mensajes |
| USERS | N:N | ROOMS | Usuarios miembros de múltiples salas (via ROOM_MEMBERS) |

---

## 5. API REST

### 5.1 Base URL
```
http://localhost:8080/api
```

### 5.2 Autenticación (Actual: Deshabilitada en Dev)
Futuro: Bearer Token JWT en header `Authorization`.
```
Authorization: Bearer <JWT_TOKEN>
```

### 5.3 Endpoints - Rooms

#### POST /rooms - Crear sala
**Descripción:** Crea una nueva sala pública o privada.

**Request:**
```http
POST /api/rooms HTTP/1.1
Content-Type: application/json

{
    "name": "General",
    "roomType": "public"
}
```

**Response 201:**
```json
{
    "id": 1,
    "name": "General",
    "roomType": "public",
    "passwordHash": null,
    "createdBy": null,
    "createdAt": "2025-11-19T17:41:20.173420"
}
```

**Error 400:**
```json
{
    "error": "Invalid room type. Use 'public' or 'private'."
}
```

---

#### GET /rooms - Listar todas las salas
**Descripción:** Obtiene todas las salas (paginación en futuro).

**Request:**
```http
GET /api/rooms HTTP/1.1
```

**Response 200:**
```json
[
    {
        "id": 1,
        "name": "General",
        "roomType": "public",
        "passwordHash": null,
        "createdAt": "2025-11-19T17:41:20.173420"
    },
    {
        "id": 2,
        "name": "PrivadaKenny",
        "roomType": "private",
        "passwordHash": "$2a$10$...",
        "createdAt": "2025-11-19T17:42:00.000000"
    }
]
```

---

#### GET /rooms/{id} - Consultar sala específica
**Descripción:** Obtiene datos de una sala por ID.

**Request:**
```http
GET /api/rooms/1 HTTP/1.1
```

**Response 200:**
```json
{
    "id": 1,
    "name": "General",
    "roomType": "public",
    "passwordHash": null,
    "createdAt": "2025-11-19T17:41:20.173420"
}
```

**Error 404:**
```json
{
    "error": "Room not found"
}
```

---

#### PUT /rooms/{id} - Actualizar sala
**Descripción:** Modifica nombre, tipo o contraseña de una sala.

**Request:**
```http
PUT /api/rooms/1 HTTP/1.1
Content-Type: application/json

{
    "name": "General Chat",
    "roomType": "public"
}
```

**Response 200:**
```json
{
    "id": 1,
    "name": "General Chat",
    "roomType": "public",
    "createdAt": "2025-11-19T17:41:20.173420"
}
```

---

#### DELETE /rooms/{id} - Eliminar sala
**Descripción:** Borra una sala y todos sus mensajes asociados (cascada).

**Request:**
```http
DELETE /api/rooms/1 HTTP/1.1
```

**Response 200:**
```
Room deleted
```

---

#### POST /rooms/{id}/join - Unirse a sala
**Descripción:** Valida acceso a sala (publica/privada con contraseña).

**Request (Sala Pública):**
```http
POST /api/rooms/1/join HTTP/1.1
```

**Response 200:**
```
Joined room successfully
```

**Request (Sala Privada):**
```http
POST /api/rooms/2/join?password=miclave HTTP/1.1
```

**Response 200:**
```
Joined room successfully
```

**Error 403 (Contraseña incorrecta):**
```
Invalid password for private room
```

**Error 404:**
```
Room not found
```

---

### 5.4 Endpoints - Messages (Futuro - Persona 2)

#### GET /rooms/{roomId}/messages - Historial paginado
**Descripción:** Obtiene mensajes de una sala con paginación.

**Request:**
```http
GET /api/rooms/1/messages?page=0&size=20 HTTP/1.1
```

**Response 200:**
```json
{
    "content": [
        {
            "id": 1,
            "userId": 5,
            "content": "¡Hola a todos!",
            "sentAt": "2025-11-19T17:50:00"
        }
    ],
    "totalElements": 1,
    "totalPages": 1,
    "currentPage": 0
}
```

---

### 5.5 Endpoints - Users (Futuro)

#### POST /auth/register - Registrarse
**Request:**
```http
POST /api/auth/register HTTP/1.1
Content-Type: application/json

{
    "username": "kenny",
    "email": "kenny@example.com",
    "password": "SecurePass123!"
}
```

**Response 201:**
```json
{
    "id": 1,
    "username": "kenny",
    "email": "kenny@example.com",
    "message": "User registered successfully"
}
```

---

#### POST /auth/login - Login
**Request:**
```http
POST /api/auth/login HTTP/1.1
Content-Type: application/json

{
    "username": "kenny",
    "password": "SecurePass123!"
}
```

**Response 200:**
```json
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "user": {
        "id": 1,
        "username": "kenny"
    }
}
```

---

## 6. Flujos

### 6.1 Flujo: Crear Sala Pública

```
Usuario (Postman)
    │
    ├─ POST /api/rooms
    │  { "name": "General", "roomType": "public" }
    │
    ▼
RoomController.createRoom()
    │
    ├─ Validar campos (name, roomType)
    ├─ Si type == "private" AND password: hash con BCrypt
    │
    ▼
RoomService (lógica)
    │
    ├─ Crear objeto Room (entity)
    ├─ Setear atributos
    │
    ▼
RoomRepository.save()
    │
    ├─ JPA → Hibernate
    ├─ INSERT INTO rooms (name, room_type, ...)
    │
    ▼
PostgreSQL
    │
    ├─ Asignar ID autoincrement
    ├─ Guardar en tabla
    ├─ Retornar row con ID
    │
    ▼
Controller → JSON Response 201
    │
    ├─ Serializar Room a RoomDto
    ├─ Retornar: { "id": 1, "name": "General", ... }
    │
    ▼
Usuario recibe JSON
```

### 6.2 Flujo: Unirse a Sala Privada

```
Usuario (Postman)
    │
    ├─ POST /api/rooms/2/join?password=clave123
    │
    ▼
RoomController.joinRoom(id=2, password="clave123")
    │
    ├─ Buscar sala por ID
    ├─ Si no existe → 404
    │
    ▼
Validar tipo de sala
    │
    ├─ Si room_type == "public"
    │  └─ Retornar 200: "Joined room successfully"
    │
    ├─ Si room_type == "private"
    │  │
    │  ├─ Verificar password_hash NOT NULL
    │  ├─ Validar: BCrypt.checkpw(password, passwordHash)
    │  │
    │  ├─ Si válida: Retornar 200
    │  └─ Si inválida: Retornar 403 "Invalid password"
    │
    ▼
Usuario recibe respuesta
```

### 6.3 Flujo: Enviar Mensaje en Tiempo Real (Futuro - Persona 2)

```
Usuario A (Cliente WebSocket)
    │
    ├─ Abre conexión: ws://localhost:8080/ws/rooms/1
    │  (Handshake WebSocket)
    │
    ▼
Spring WebSocket Handler
    │
    ├─ Registrar conexión en mapa de sesiones
    ├─ Notificar: "Usuario A joined room 1"
    │  → Broadcast a todos en room 1
    │
    ▼
Usuario A envía mensaje
    │
    ├─ { "content": "¡Hola!", "roomId": 1 }
    │
    ▼
MessageController.sendMessage()
    │
    ├─ Crear entity Message
    ├─ Guardar en BD (INSERT)
    │
    ▼
Publicar evento en RabbitMQ
    │
    ├─ Topic: "chat.messages"
    ├─ Payload: MessageEvent { roomId, userId, content, timestamp }
    │
    ▼
WebSocket Broadcast Consumer
    │
    ├─ Escuchar evento
    ├─ Enviar a todos los clientes en room 1
    │  (via WebSocket frame)
    │
    ▼
Otros usuarios en room 1
    │
    ├─ Reciben mensaje en tiempo real
    ├─ UI se actualiza dinámicamente
```

### 6.4 Flujo: Consultar Historial Paginado

```
Usuario (Cliente)
    │
    ├─ GET /api/rooms/1/messages?page=0&size=20
    │
    ▼
MessageController.getMessages(roomId=1, page=0, size=20)
    │
    ├─ Validar roomId existe
    ├─ Construir PageRequest(0, 20)
    │
    ▼
MessageRepository.findByRoom(room, pageRequest)
    │
    ├─ JPA Query con paginación
    ├─ SELECT * FROM messages 
    │  WHERE room_id = 1
    │  ORDER BY sent_at DESC
    │  LIMIT 20 OFFSET 0
    │
    ▼
PostgreSQL
    │
    ├─ Ejecutar query
    ├─ Usar índice idx_messages_room_id
    ├─ Retornar 20 resultados + totalCount
    │
    ▼
Mapper: Message → MessageDto
    │
    ├─ Convertir entities a DTOs
    │  (para no exponer internals)
    │
    ▼
Response 200 Page<MessageDto>
    │
    ├─ { 
    │    "content": [...],
    │    "totalElements": 150,
    │    "totalPages": 8,
    │    "currentPage": 0,
    │    "hasNext": true
    │   }
    │
    ▼
Usuario recibe JSON paginado
```

---

## 7. Infraestructura

### 7.1 Docker Compose Stack

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    container_name: chat-db
    environment:
      POSTGRES_DB: chatdb
      POSTGRES_USER: chatuser
      POSTGRES_PASSWORD: chatpass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/migrations:/docker-entrypoint-initdb.d
    networks:
      - chat-network

  rabbitmq:
    image: rabbitmq:3-management-alpine
    container_name: chat-broker
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest
    ports:
      - "5672:5672"
      - "15672:15672"
    networks:
      - chat-network

volumes:
  postgres_data:

networks:
  chat-network:
```

### 7.2 Cómo Levantar la Infraestructura

```bash
# Desde raíz del proyecto
docker compose up -d

# Verificar contenedores
docker ps

# Ver logs
docker compose logs -f postgres
docker compose logs -f rabbitmq

# Bajar
docker compose down

# Bajar y limpiar datos
docker compose down -v
```

### 7.3 Endpoints Administrativos

| Servicio | URL |
|----------|-----|
| PostgreSQL | localhost:5432 (pgAdmin recomendado) |
| RabbitMQ Management | http://localhost:15672 (guest/guest) |
| Spring Boot App | http://localhost:8080 |

---

## 8. Despliegue y Configuración

### 8.1 Variables de Entorno (application.yml)

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/chatdb
    username: chatuser
    password: chatpass
  jpa:
    hibernate:
      ddl-auto: validate
    properties:
      hibernate.dialect: org.hibernate.dialect.PostgreSQLDialect
  rabbitmq:
    host: localhost
    port: 5672
    username: guest
    password: guest

server:
  port: 8080
```

### 8.2 Build y Ejecución Local

```bash
# Build
mvn clean install

# Run
mvn spring-boot:run

# O jar standalone
mvn clean package
java -jar target/chat-backend-0.0.1-SNAPSHOT.jar
```

### 8.3 Checklist Pre-Producción

- [ ] Reactivar Spring Security (deshabilitado en dev).
- [ ] Implementar JWT para autenticación sin estado.
- [ ] Configurar HTTPS/SSL en endpoint.
- [ ] Habilitar CORS solo para dominios permitidos.
- [ ] Auditar datos sensibles (logs, env vars).
- [ ] Configurar rate-limiting en endpoints.
- [ ] Implementar health checks (`/actuator/health`).
- [ ] Documentar procesos de backup/restauración de BD.
- [ ] Pruebas de carga y estrés (JMeter, Gatling).
- [ ] Monitoreo (ELK stack, Prometheus + Grafana).

---

## 9. Testing (Futuro)

### 9.1 Estrategia de Testing

| Nivel | Herramienta | Cobertura |
|-------|-------------|-----------|
| Unit | JUnit 5 + Mockito | Controllers, Services |
| Integration | @SpringBootTest | Repository + BD |
| E2E | Postman/RestAssured | Flujos completos |
| Load | JMeter/Gatling | Rendimiento máx |

### 9.2 Ejemplo: Test de Controller

```java
@SpringBootTest
class RoomControllerTest {
    @Autowired
    private MockMvc mockMvc;
    
    @Test
    void testCreateRoom() throws Exception {
        mockMvc.perform(post("/api/rooms")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"name\":\"Test\",\"roomType\":\"public\"}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").exists());
    }
}
```

---

## 10. Matriz de Responsabilidades

| Función | Persona 1 | Persona 2 |
|---------|-----------|-----------|
| Backend REST (CRUD) | ✅ 100% | — |
| Base de Datos | ✅ Setup | ✅ Queries opt. |
| Seguridad (JWT) | ⚠️ Diseño | ✅ Implementación |
| WebSockets | — | ✅ 100% |
| RabbitMQ Integration | ⚠️ Config | ✅ Handlers |
| Frontend | — | ✅ (Si aplica) |
| Testing | ⚠️ Unit básicos | ✅ E2E |
| Documentación | ✅ Parte 1 | ✅ Parte 2 |

---

## 11. Glosario

| Término | Definición |
|---------|-----------|
| **DTO** | Data Transfer Object; objeto para serializar/deserializar entre API y BD. |
| **JPA** | Java Persistence API; estándar de ORM en Java. |
| **Hibernate** | Implementación de JPA; maneja mapping Entity ↔ Tabla. |
| **BCrypt** | Algoritmo de hash de contraseñas con salt automático. |
| **JWT** | JSON Web Token; token sin estado para autenticación. |
| **WebSocket** | Protocolo full-duplex para comunicación en tiempo real. |
| **RabbitMQ** | Message broker para comunicación asíncrona entre servicios. |
| **Índice** | Estructura de BD que acelera búsquedas (trade-off: espacio vs velocidad). |
| **Cascada** | En relaciones FK: delete en padre elimina hijo automático. |
| **Paginación** | División de resultados en páginas para optimizar transferencia. |

---

## 12. Referencias

- [Spring Boot Official Docs](https://spring.io/projects/spring-boot)
- [Spring Data JPA](https://spring.io/projects/spring-data-jpa)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
- [JWT.io](https://jwt.io)
- [BCrypt Explained](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)

---


