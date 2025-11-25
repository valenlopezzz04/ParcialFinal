import asyncio, json, os, random, statistics, time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

import websockets

# pip install websockets
# export BASE_TOKEN="TU_TOKEN"
# export ROOM_ID="ID_REAL"
# export CONCURRENT_USERS=50
# export TEST_DURATION_S=30
# python simulate.py


WS_URL_TEMPLATE = os.getenv("WS_URL_TEMPLATE", "ws://localhost:3001/?token={token}")
BASE_TOKEN = os.getenv("BASE_TOKEN", "PEGA_TOKEN_AQUI")

ROOM_ID = os.getenv("ROOM_ID", "1")  # ajusta al room real
CONCURRENT_USERS = int(os.getenv("CONCURRENT_USERS", "50"))
TEST_DURATION_S = int(os.getenv("TEST_DURATION_S", "30"))
MEAN_SEND_INTERVAL_S = float(os.getenv("MEAN_SEND_INTERVAL_S", "1.0"))
SEND_JITTER = float(os.getenv("SEND_JITTER", "0.3"))
LATENCY_SLO_MS = int(os.getenv("LATENCY_SLO_MS", "850"))
LOG_EVERY_S = float(os.getenv("LOG_EVERY_S", "5"))

MESSAGE_SIZE = int(os.getenv("MESSAGE_SIZE", "60"))

def now_ms(): return time.time() * 1000
def rand_text(n):
    letters = "abcdefghijklmnopqrstuvwxyz0123456789 "
    return "".join(random.choice(letters) for _ in range(n)).strip()

@dataclass
class UserResult:
    user_id: int
    connected: bool = False
    sent: int = 0
    echoes: int = 0
    errors: int = 0
    lat_ms: List[float] = field(default_factory=list)

@dataclass
class Global:
    lat_ms: List[float] = field(default_factory=list)

async def user_worker(uid: int, res: UserResult, stop_at: float):
    url = WS_URL_TEMPLATE.format(token=BASE_TOKEN, user_id=uid)

    pending: Dict[str, float] = {}  # content_tag -> send_t

    try:
        async with websockets.connect(url, ping_interval=20, ping_timeout=20) as ws:
            res.connected = True

            # 1) join_room
            await ws.send(json.dumps({"event": "join_room", "roomId": ROOM_ID}))
            # lee respuesta join (opcional)
            try:
                _ = await asyncio.wait_for(ws.recv(), timeout=2.0)
            except Exception:
                pass

            async def receiver():
                while time.time() < stop_at:
                    try:
                        raw = await asyncio.wait_for(ws.recv(), timeout=1.0)
                    except asyncio.TimeoutError:
                        continue
                    except Exception:
                        res.errors += 1
                        return

                    try:
                        msg = json.loads(raw)
                    except Exception:
                        continue

                    # eco esperado
                    if msg.get("event") == "new_message":
                        content = msg.get("content")
                        if content in pending:
                            t0 = pending.pop(content)
                            res.echoes += 1
                            res.lat_ms.append(now_ms() - t0)

            recv_task = asyncio.create_task(receiver())

            # 2) loop send_message
            while time.time() < stop_at:
                base = MEAN_SEND_INTERVAL_S
                jitter = base * SEND_JITTER * (random.random() * 2 - 1)
                await asyncio.sleep(max(0.0, base + jitter))

                # tag único para reconocer nuestro eco
                content = f"[u{uid}-{int(time.time()*1000)}] {rand_text(MESSAGE_SIZE)}"
                pending[content] = now_ms()

                try:
                    await ws.send(json.dumps({"event": "send_message", "content": content}))
                    res.sent += 1
                except Exception:
                    res.errors += 1

            await asyncio.sleep(2)
            recv_task.cancel()

    except Exception:
        res.errors += 1

async def log_loop(results: List[UserResult], stop_at: float):
    while time.time() < stop_at:
        await asyncio.sleep(LOG_EVERY_S)
        connected = sum(r.connected for r in results)
        sent = sum(r.sent for r in results)
        echoes = sum(r.echoes for r in results)
        errors = sum(r.errors for r in results)
        all_lat = [x for r in results for x in r.lat_ms]

        if all_lat:
            s = sorted(all_lat)
            p95 = s[int(0.95*(len(s)-1))]
            mean = statistics.mean(s)
        else:
            p95 = mean = 0.0

        print(f"[metrics] connected={connected}/{len(results)} sent={sent} echoes={echoes} "
              f"errors={errors} lat_mean_ms={mean:.1f} lat_p95_ms={p95:.1f}")

async def main():
    stop_at = time.time() + TEST_DURATION_S
    results = [UserResult(i) for i in range(CONCURRENT_USERS)]

    tasks = [user_worker(i, results[i], stop_at) for i in range(CONCURRENT_USERS)]
    logger = asyncio.create_task(log_loop(results, stop_at))

    await asyncio.gather(*tasks, return_exceptions=True)
    logger.cancel()

    all_lat = [x for r in results for x in r.lat_ms]
    slos = [x for x in all_lat if x > LATENCY_SLO_MS]

    print(f"Usuarios objetivo: {CONCURRENT_USERS}")
    print(f"Conectados OK:     {sum(r.connected for r in results)}")
    print(f"Fallaron:          {sum(not r.connected for r in results)}")
    print(f"Enviados:          {sum(r.sent for r in results)}")
    print(f"Ecos recibidos:    {sum(r.echoes for r in results)}")
    print(f"Errores:           {sum(r.errors for r in results)}")

    if all_lat:
        s = sorted(all_lat)
        def pct(p): return s[int(round((p/100)*(len(s)-1)))]
        print("\nLatencia ms:")
        print(f"  min  : {min(s):.1f}")
        print(f"  p50  : {pct(50):.1f}")
        print(f"  p95  : {pct(95):.1f}")
        print(f"  p99  : {pct(99):.1f}")
        print(f"  max  : {max(s):.1f}")
        print(f"  mean : {statistics.mean(s):.1f}")
        print(f"\nSLO<{LATENCY_SLO_MS}ms violaciones: {len(slos)}/{len(all_lat)} ({len(slos)/len(all_lat)*100:.2f}%)")
    else:
        print("\nNo hubo muestras de latencia (¿no llegaron ecos?).")

if __name__ == "__main__":
    asyncio.run(main())
