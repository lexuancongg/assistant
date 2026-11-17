import sys
import os
import subprocess
import time

try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

# Add Ai folder to python path
sys.path.insert(0, os.path.abspath("Ai"))
from dotenv import load_dotenv
load_dotenv("Ai/.env")

from app.schemas.extract.extract_request import ExtractRequest
from app.services.extract_service import ExtractService
from app.services.qdrant_service import QdrantService
from qdrant_client.http.models import Filter, FieldCondition, MatchValue

def main():
    print("=== STARTING RAG RE-INDEXING SCRIPT ===")
    
    # 1. Fetch files from Postgres
    cmd = [
        "docker", "exec", "ai_assistant_postgres",
        "psql", "-U", "xuancong", "-d", "ai-assistant",
        "-t", "-A", "-F", "\t",
        "-c", "SELECT id, name, file_type, storage_path FROM files WHERE deleted_at IS NULL ORDER BY id;"
    ]
    try:
        out = subprocess.check_output(cmd, text=True, encoding="utf-8")
    except Exception as e:
        print(f"Failed to query files from PostgreSQL: {e}")
        return

    extract_service = ExtractService()
    qdrant_service = QdrantService()

    files = []
    for line in out.strip().split("\n"):
        if not line:
            continue
        parts = line.split("\t")
        if len(parts) >= 4:
            files.append({
                "id": int(parts[0]),
                "name": parts[1],
                "file_type": parts[2],
                "storage_path": parts[3]
            })

    print(f"Total files in database: {len(files)}")

    # Filter files that have 0 points in Qdrant
    to_index = []
    for f in files:
        fid = f["id"]
        try:
            res = qdrant_service.client.count(
                collection_name="documents",
                count_filter=Filter(should=[
                    FieldCondition(key="document_id", match=MatchValue(value=str(fid))),
                    FieldCondition(key="document_id", match=MatchValue(value=fid))
                ])
            )
            count = res.count
        except Exception:
            count = 0

        if count == 0:
            to_index.append(f)
            print(f"[NEEDS INDEX] File #{fid}: {f['name']} ({f['file_type']}) - 0 points in Qdrant")
        else:
            print(f"[ALREADY INDEXED] File #{fid}: {f['name']} - {count} points in Qdrant")

    print(f"\nFound {len(to_index)} files needing indexing into Qdrant.")
    if not to_index:
        print("All files are already indexed in Qdrant! Nothing to do.")
        return

    indexed_ids = []
    for idx, f in enumerate(to_index, 1):
        fid = f["id"]
        fname = f["name"]
        fpath = f["storage_path"]
        print(f"\n({idx}/{len(to_index)}) Indexing File #{fid}: {fname} ...")
        start_time = time.time()
        try:
            req = ExtractRequest(documentId=fid, filePath=fpath)
            res = extract_service.extract(req)
            elapsed = time.time() - start_time
            num_chunks = len(res.chunks) if res and res.chunks else 0
            print(f"  -> SUCCESS in {elapsed:.2f}s | Chunks created: {num_chunks}")
            indexed_ids.append(fid)
        except Exception as err:
            elapsed = time.time() - start_time
            print(f"  -> ERROR in {elapsed:.2f}s: {err}")

    if indexed_ids:
        # Mark as ai_indexed in Postgres
        ids_str = ", ".join(str(i) for i in indexed_ids)
        update_cmd = [
            "docker", "exec", "ai_assistant_postgres",
            "psql", "-U", "xuancong", "-d", "ai-assistant",
            "-c", f"UPDATE files SET is_ai_indexed = true WHERE id IN ({ids_str});"
        ]
        subprocess.run(update_cmd, check=False)
        print(f"\nUpdated is_ai_indexed=true for files: {ids_str}")

    print("\n=== RE-INDEXING COMPLETED SUCCESSFULLY! ===")

if __name__ == "__main__":
    main()
