# Métricas del Sistema (WebSocket + Backend + RabbitMQ)

## 1. Métricas de Conexiones Activas

- Número de clientes WebSocket conectados.
- Número de salas activas con al menos un usuario.
- Máximo concurrente observado.
- Flujo esperado: el servidor registra cada conexión y desconexión.

Ejemplo de log:
```
[WS] connection_open → userId=X username=Y
[WS] connection_close → userId=X username=Y
```

## 2. Métricas de Mensajes

### 2.1 Conteo de mensajes procesados
- Total de mensajes enviados por usuarios.
- Total de mensajes recibidos desde RabbitMQ.
- Total de mensajes reenviados vía broadcast.

Ejemplo:
```
[WS] metrics → messages_sent=120 messages_received=118 broadcasted=118
```

### 2.2 Mensajes por sala
- messages_per_room[roomId] = cantidad acumulada.

## 3. Métricas de Latencia

- Tiempo desde que el cliente envía un mensaje hasta que todos los clientes lo reciben.
- Tiempo desde WS → RabbitMQ → WS.

Ejemplo:
```
[WS] latency → room=1 avg=32ms max=55ms min=20ms
```

## 4. Métricas de Errores

- Errores al intentar unirse a una sala.
- Errores al enviar mensajes sin permisos.
- Errores de RabbitMQ.

Ejemplo:
```
[WS] error_join_room → userId=X roomId=Y reason="Invalid password"
```

## 5. Métricas Periódicas (cada 15 segundos)

El servidor debe emitir un bloque de métricas como:

```
[METRICS] t=2025-11-22
 active_connections=5
 active_rooms=3
 messages_last_15s=32
 avg_latency_ms=28
 errors_last_15s=1
 rabbitmq_status="ok"
```

## 6. Endpoints / Exportación (Opcional)

Se pueden exponer métricas en:

- `/metrics` (estilo Prometheus).
- Archivo `metrics.log`.
- Canal RabbitMQ especial para monitoreo.

## 7. Validación esperada

- Todas las métricas deben reflejar el comportamiento real del sistema.
- Deben ser consistentes entre WebSocket, Broker y Backend.
