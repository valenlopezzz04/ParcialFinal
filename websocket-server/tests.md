# Pruebas de Integración — WebSocket, Backend REST y RabbitMQ

Este documento describe los casos de prueba necesarios para validar la integración completa del sistema: autenticación, WebSocket server, API REST, persistencia de mensajes y comunicación vía RabbitMQ.

## 1. Autenticación — Login y generación de JWT

### Endpoint
POST /api/auth/login

Debe retornar un JWT con claims: sub, userId, iat, exp.

## 2. Conexión WebSocket usando JWT

WS URL: ws://localhost:3001?token=JWT_AQUI

Debe mostrar:
[WS] Connected → userId=X username=Y

## 3. Unirse a sala pública

Mensaje WS:
{
"event": "join_room",
"roomId": 1
}

Debe retornar “status: ok”.

## 4. Unirse a sala privada (clave incorrecta)

POST /api/rooms/2/join?userId=XX&password=incorrecta → 403

## 5. Unirse a sala privada (clave correcta)

POST /api/rooms/2/join?userId=XX&password=1234 → 200 OK

## 6. Envío de mensaje

WS:
{
"event": "send_message",
"content": "Hola a todos"
}

Debe recibirse event:new_message y persistirse:
GET /api/rooms/1/messages?userId=XX&page=0&size=20

## 7. Enviar sin unirse

Debe arrojar:
status:error, message:"Not allowed to send message"

## 8. Dos clientes en la misma sala

A envía → B recibe new_message.

Log esperado:
[WS] new_message → room=1 userId=XX content="..."

## 9. RabbitMQ Producer

channel.publish("chat_exchange","room.1",...)

Log:
[RABBIT] publish → room=1 message="..."

## 10. RabbitMQ Consumer

Debe reenviar a todos:
[WS] new_message → broadcast to N clients

## 11. Desconexión

Debe enviar user_left y log correspondiente.

## 12. Historial paginado

GET /api/rooms/1/messages?userId=XX&page=0&size=20

## 13. Acceso a sala privada sin permiso

GET /api/rooms/2/messages?userId=XX → 403 Access denied.
