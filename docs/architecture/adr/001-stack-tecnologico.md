# ADR 001: Stack Tecnológico

## Estado
Aceptado

## Contexto
Necesitamos seleccionar las tecnologías para el backend REST, base de datos y broker del sistema de chat en tiempo real con WebSockets.

## Decisión
- **Backend REST**: Spring Boot (Java)
- **Base de datos**: PostgreSQL
- **Broker**: RabbitMQ
- **Autenticación**: JWT (JSON Web Tokens)
- **ORM**: Spring Data JPA

## Consecuencias

### Positivas
- Spring Boot ofrece un ecosistema maduro y bien documentado
- PostgreSQL cumple con requisitos ACID y maneja relaciones eficientemente
- RabbitMQ es suficiente para messaging entre componentes del sistema
- JWT permite autenticación stateless, fácil de escalar horizontalmente
- Spring Data JPA simplifica el acceso a datos

### Negativas
- Spring Boot puede ser más pesado en recursos que alternativas como Express.js
- Requiere conocimiento de Java y el ecosistema Spring
- RabbitMQ añade complejidad operacional (un servicio más que mantener)
