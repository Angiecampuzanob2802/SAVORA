import psycopg

try:
    conn = psycopg.connect(
        "host=localhost dbname=savora_db user=postgres password=Angie208"
    )

    print("✅ Conexión exitosa con psycopg3")

    conn.close()

except Exception as e:
    print("❌ Error")
    print(e)